// useWebRTC.js — video chat'ning YADROSI.
//
// Vazifalari:
//   1. Kamera + mikrofonni olish (getUserMedia).
//   2. Xonadagi har bir boshqa peer uchun alohida RTCPeerConnection ochish (mesh).
//   3. Signaling orqali offer/answer/ICE almashinuvini boshqarish.
//   4. Boshqaruvlar: mic/kamera o'chirish, ekran ulashish, chiqish.
//
// Media oqimi brauzerlar orasida to'g'ridan-to'g'ri (P2P) boradi; backend faqat
// signaling xabarlarini uzatadi.

import { useCallback, useEffect, useRef, useState } from "react";
import { Signaling } from "../lib/signaling.js";

// STUN serveri NAT ortidagi public manzilni aniqlaydi. Turli tarmoqlar orasida
// ishonchli ulanish uchun bu yerga TURN server ham qo'shish mumkin:
//   { urls: "turn:turn.example.com:3478", username: "user", credential: "pass" }
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(room, name) {
  const [localStream, setLocalStream] = useState(null);
  // peers: { [peerId]: { name, stream } }
  const [peers, setPeers] = useState({});
  const [status, setStatus] = useState("connecting"); // connecting | live | error
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null); // qattiq emas — ogohlantirish
  const [messages, setMessages] = useState([]); // chat xabarlari
  const [speaking, setSpeaking] = useState({}); // { peerId: bool } — kim gapiryapti
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [handUp, setHandUp] = useState(false); // o'z qo'limiz ko'tarilganmi
  const [reactions, setReactions] = useState([]); // suzuvchi emoji reaksiyalar
  const [devices, setDevices] = useState({ cameras: [], mics: [] });

  const signalingRef = useRef(null);
  const pcsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const pendingIceRef = useRef(new Map()); // peerId -> RTCIceCandidate[]
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null); // ekran ulashishdan keyin qaytarish uchun
  const startedRef = useRef(false); // StrictMode ikki marta ishga tushirmasin
  const liveRef = useRef(false); // welcome kelganmi (WS ulanish holati)
  const msgIdRef = useRef(0); // chat xabarlari uchun unikal ID hisoblagich
  const micOnRef = useRef(true); // mic holati (callback'lar uchun joriy qiymat)
  const camOnRef = useRef(true); // cam holati (callback'lar uchun joriy qiymat)
  const audioCtxRef = useRef(null); // active speaker aniqlash uchun AudioContext
  const analysersRef = useRef(new Map()); // key -> { analyser, data, source }
  const lastSpokeRef = useRef({}); // key -> oxirgi ovoz vaqti (ms) — gisterezis uchun
  const vadTimerRef = useRef(null); // ovoz darajasini tekshirish taymeri
  const sharingRef = useRef(false); // ekran ulashilyaptimi (callback'lar uchun)
  const handRef = useRef(false); // qo'l ko'tarilganmi (callback'lar uchun)
  const reactionIdRef = useRef(0); // reaksiyalar uchun unikal ID

  // mic/cam holatini ham ref'da, ham state'da yangilaymiz (ref — callback'lar uchun).
  const applyMic = useCallback((v) => {
    micOnRef.current = v;
    setMicOn(v);
  }, []);
  const applyCam = useCallback((v) => {
    camOnRef.current = v;
    setCamOn(v);
  }, []);

  // O'z mic/cam/qo'l holatimizni xonadagi boshqalarga e'lon qilamiz.
  const broadcastState = useCallback(() => {
    signalingRef.current?.send({
      type: "state",
      micOn: micOnRef.current,
      camOn: camOnRef.current,
      hand: handRef.current,
    });
  }, []);

  // AudioContext'ni kerak bo'lganda yaratamiz (analizator va signal ovozi uchun umumiy).
  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }, []);

  // Qisqa signal ovozi (qo'shilish/chiqishda) — fayl shart emas, oscillator bilan.
  const beep = useCallback(
    (freq) => {
      try {
        const ctx = ensureAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.26);
      } catch {
        /* audio bloklangan — e'tiborsiz */
      }
    },
    [ensureAudioCtx]
  );

  // --- Active speaker: stream'ning ovoz darajasini kuzatuvchi analizator ---
  const addAnalyser = useCallback((key, stream) => {
    if (!stream || !stream.getAudioTracks().length) return;
    if (analysersRef.current.has(key)) return;
    try {
      const ctx = ensureAudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analysersRef.current.set(key, {
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount),
        source,
      });
    } catch (e) {
      console.warn("Ovoz analizatori xatosi:", e);
    }
  }, [ensureAudioCtx]);

  const removeAnalyser = useCallback((key) => {
    const a = analysersRef.current.get(key);
    if (a) {
      try {
        a.source.disconnect();
      } catch {
        /* allaqachon uzilgan */
      }
      analysersRef.current.delete(key);
    }
    delete lastSpokeRef.current[key];
  }, []);

  // --- Bitta peer uchun RTCPeerConnection yaratish ---
  const createPeer = useCallback(
    (peerId, peerName, isInitiator) => {
      if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId);

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcsRef.current.set(peerId, pc);

      // O'z media track'larimizni ulanishga qo'shamiz.
      const local = localStreamRef.current;
      if (local && local.getTracks().length) {
        local.getTracks().forEach((track) => pc.addTrack(track, local));
      } else if (isInitiator) {
        // Mahalliy media yo'q (kamera band / HTTPS emas) — faqat QABUL qilish uchun
        // transceiver qo'shamiz, shunda offer baribir yaratiladi va remote video keladi.
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
      }
      // non-initiator + media yo'q: answer avtomatik recvonly bo'ladi

      // ICE candidate topilganda — manzil peer'ga yuboramiz.
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingRef.current?.send({
            type: "ice",
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Remote track kelganda — peer'ning stream'ini saqlaymiz (boshqa maydonlarni saqlab).
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setPeers((prev) => ({
          ...prev,
          [peerId]: {
            name: peerName,
            micOn: true,
            camOn: true,
            ...prev[peerId],
            stream,
          },
        }));
        addAnalyser(peerId, stream); // active speaker uchun ovozni kuzatamiz
      };

      // Biz tashabbuskor bo'lsak — offer yaratib yuboramiz (o'z ismimiz bilan).
      if (isInitiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signalingRef.current?.send({
              type: "offer",
              to: peerId,
              name: name,
              sdp: pc.localDescription,
            });
          } catch (e) {
            console.error("Offer yaratishda xato:", e);
          }
        };
      }

      return pc;
    },
    []
  );

  // Bufferlangan ICE candidate'larni qo'llash (remote description o'rnatilgach).
  const flushPendingIce = useCallback(async (peerId, pc) => {
    const pending = pendingIceRef.current.get(peerId);
    if (pending) {
      for (const cand of pending) {
        try {
          await pc.addIceCandidate(cand);
        } catch (e) {
          console.error("ICE qo'shishda xato:", e);
        }
      }
      pendingIceRef.current.delete(peerId);
    }
  }, []);

  // --- Signaling xabarlarini qayta ishlash ---
  const handleMessage = useCallback(
    async (msg) => {
      switch (msg.type) {
        case "welcome": {
          // Xonadagi mavjud peer'larga BIZ offer yuboramiz (yangi kelgan = tashabbuskor).
          liveRef.current = true;
          // Mavjud peer'larni ro'yxatga qo'shamiz (stream keyinroq keladi).
          setPeers((prev) => {
            const next = { ...prev };
            msg.peers.forEach((p) => {
              next[p.peerId] = {
                name: p.name,
                micOn: true,
                camOn: true,
                stream: null,
                ...prev[p.peerId],
              };
            });
            return next;
          });
          msg.peers.forEach((p) => createPeer(p.peerId, p.name, true));
          setStatus("live");
          broadcastState(); // o'z mic/cam holatimizni e'lon qilamiz
          break;
        }
        case "peer-joined": {
          // Yangi peer keldi — uni ro'yxatga qo'shamiz, u bizga offer yuboradi (non-initiator).
          setPeers((prev) => ({
            ...prev,
            [msg.peerId]: {
              name: msg.name,
              micOn: true,
              camOn: true,
              stream: null,
              ...prev[msg.peerId],
            },
          }));
          broadcastState(); // yangi kelganga ham o'z holatimizni bildiramiz
          beep(660); // qo'shilish signali (baland ohang)
          break;
        }
        case "offer": {
          const from = msg.from;
          const pc = createPeer(from, msg.name || "Anon", false);
          await pc.setRemoteDescription(msg.sdp);
          await flushPendingIce(from, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signalingRef.current?.send({
            type: "answer",
            to: from,
            name: name,
            sdp: pc.localDescription,
          });
          break;
        }
        case "answer": {
          const pc = pcsRef.current.get(msg.from);
          if (pc) {
            await pc.setRemoteDescription(msg.sdp);
            await flushPendingIce(msg.from, pc);
          }
          break;
        }
        case "ice": {
          const pc = pcsRef.current.get(msg.from);
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(msg.candidate);
            } catch (e) {
              console.error("ICE qo'shishda xato:", e);
            }
          } else {
            // remote description hali yo'q — keyinroq qo'llash uchun bufferlaymiz.
            const list = pendingIceRef.current.get(msg.from) || [];
            list.push(msg.candidate);
            pendingIceRef.current.set(msg.from, list);
          }
          break;
        }
        case "chat": {
          // Boshqa peer'dan kelgan chat xabari.
          const id = `m${msgIdRef.current++}`;
          setMessages((prev) => [
            ...prev,
            { id, name: msg.name || "Anon", text: msg.text, self: false },
          ]);
          break;
        }
        case "state": {
          // Peer o'z mic/cam/qo'l holatini e'lon qildi.
          setPeers((prev) => {
            const existing = prev[msg.from];
            if (!existing) return prev; // hali tanish emas — e'tiborsiz
            return {
              ...prev,
              [msg.from]: {
                ...existing,
                micOn: Boolean(msg.micOn),
                camOn: Boolean(msg.camOn),
                hand: Boolean(msg.hand),
              },
            };
          });
          break;
        }
        case "reaction": {
          // Peer emoji yubordi — ekranga suzuvchi belgi qo'shamiz.
          const id = `r${reactionIdRef.current++}`;
          const item = { id, emoji: msg.emoji, name: msg.name || "Anon" };
          setReactions((prev) => [...prev, item]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
          }, 4000);
          break;
        }
        case "peer-left": {
          const pc = pcsRef.current.get(msg.peerId);
          if (pc) pc.close();
          pcsRef.current.delete(msg.peerId);
          pendingIceRef.current.delete(msg.peerId);
          removeAnalyser(msg.peerId);
          beep(360); // chiqish signali (past ohang)
          setPeers((prev) => {
            const next = { ...prev };
            delete next[msg.peerId];
            return next;
          });
          break;
        }
        default:
          break;
      }
    },
    [createPeer, flushPendingIce, broadcastState, removeAnalyser, beep]
  );

  // --- Ishga tushirish: media olish + signaling ulash ---
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    // Active speaker: har 150ms da har bir ovoz oqimining darajasini o'lchaymiz.
    const SPEAK_THRESHOLD = 18; // 0..255 o'rtacha amplituda chegarasi
    const HOLD_MS = 600; // belgisi shu muddat ushlanadi (miltillamasligi uchun)
    vadTimerRef.current = setInterval(() => {
      const analysers = analysersRef.current;
      if (!analysers.size) return;
      const now = performance.now();
      analysers.forEach(({ analyser, data }, key) => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        if (sum / data.length > SPEAK_THRESHOLD) lastSpokeRef.current[key] = now;
      });
      let selfNow = false;
      const peerSpeak = {};
      analysers.forEach((_v, key) => {
        const active = now - (lastSpokeRef.current[key] || 0) < HOLD_MS;
        if (key === "self") selfNow = active;
        else peerSpeak[key] = active;
      });
      setLocalSpeaking((prev) => (prev === selfNow ? prev : selfNow));
      setSpeaking((prev) => {
        const keys = Object.keys(peerSpeak);
        let changed = keys.length !== Object.keys(prev).length;
        for (const k of keys) if (prev[k] !== peerSpeak[k]) changed = true;
        return changed ? peerSpeak : prev;
      });
    }, 150);

    (async () => {
      // 1. Media olishga harakat — bo'lmasa ham QABUL QILUVCHI sifatida ulanaveramiz.
      let stream = null;
      const md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) {
        // HTTPS emas (localhost'dan boshqa IP) — media API mavjud emas.
        setWarning(
          "Kamera/mikrofon faqat localhost yoki HTTPS'da ishlaydi. " +
            "Faqat ko'ruvchi rejimida ulandingiz."
        );
      } else {
        try {
          stream = await md.getUserMedia({ video: true, audio: true });
        } catch (e1) {
          console.warn("video+audio olinmadi:", e1.name);
          try {
            // Kamera band bo'lishi mumkin — hech bo'lmasa mikrofonni olamiz.
            stream = await md.getUserMedia({ audio: true });
            setWarning(
              "Kamera ochilmadi (boshqa dastur yoki brauzer band qilgan bo'lishi " +
                "mumkin). Faqat ovoz bilan ulandingiz."
            );
          } catch (e2) {
            console.warn("audio ham olinmadi:", e2.name);
            setWarning(
              "Kamera/mikrofon ochilmadi — faqat ko'ruvchi rejimida ulandingiz. " +
                "(Bitta kamerani ikki brauzer bir vaqtda ishlatolmaydi — sinash uchun " +
                "ikkinchi tab'ni shu brauzerda oching yoki boshqa qurilmadan kiring.)"
            );
          }
        }
      }

      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (stream) {
        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        setLocalStream(stream);
        if (!stream.getVideoTracks().length) applyCam(false);
        if (!stream.getAudioTracks().length) applyMic(false);
        addAnalyser("self", stream); // o'z ovozimizni ham kuzatamiz
      } else {
        applyCam(false);
        applyMic(false);
      }

      // Qurilmalar ro'yxatini olamiz (ruxsatdan keyin nomlar ko'rinadi).
      navigator.mediaDevices
        ?.enumerateDevices()
        .then((list) =>
          setDevices({
            cameras: list.filter((d) => d.kind === "videoinput"),
            mics: list.filter((d) => d.kind === "audioinput"),
          })
        )
        .catch(() => {});

      // 2. Signaling — media bor-yo'qligidan qat'i nazar ulaymiz.
      const signaling = new Signaling(room, name);
      signalingRef.current = signaling;
      signaling.onMessage = handleMessage;
      signaling.onClose = () => {
        // welcome kelmasdan yopilsa — backend ishlamayapti.
        if (!liveRef.current) {
          setError(
            "Signaling serverga ulanib bo'lmadi. Backend ishga tushganmi? " +
              "(web/backend → uvicorn main:app --port 8000)"
          );
          setStatus("error");
        }
      };
      signaling.connect();
    })();

    return () => {
      cancelled = true;
      // Tozalash
      if (vadTimerRef.current) clearInterval(vadTimerRef.current);
      analysersRef.current.forEach((a) => {
        try {
          a.source.disconnect();
        } catch {
          /* allaqachon uzilgan */
        }
      });
      analysersRef.current.clear();
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      signalingRef.current?.close();
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Boshqaruvlar ---
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      applyMic(track.enabled);
      broadcastState();
    }
  }, [applyMic, broadcastState]);

  const toggleCam = useCallback(() => {
    const track = cameraTrackRef.current;
    if (track) {
      track.enabled = !track.enabled;
      applyCam(track.enabled);
      broadcastState();
    }
  }, [applyCam, broadcastState]);

  const replaceVideoTrack = useCallback((newTrack) => {
    pcsRef.current.forEach((pc) => {
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) sender.replaceTrack(newTrack);
    });
  }, []);

  const stopShare = useCallback(() => {
    const cam = cameraTrackRef.current;
    if (cam) replaceVideoTrack(cam);
    // local preview'ni kameraga qaytaramiz
    const audio = localStreamRef.current?.getAudioTracks() || [];
    const newStream = new MediaStream(cam ? [cam, ...audio] : audio);
    localStreamRef.current = newStream;
    setLocalStream(newStream);
    sharingRef.current = false;
    setSharing(false);
  }, [replaceVideoTrack]);

  const shareScreen = useCallback(async () => {
    if (sharing) {
      stopShare();
      return;
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screen.getVideoTracks()[0];
      replaceVideoTrack(screenTrack);

      // local preview'ni ekranga almashtiramiz (ovoz kameradan qoladi).
      const audio = localStreamRef.current?.getAudioTracks() || [];
      const newStream = new MediaStream([screenTrack, ...audio]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      sharingRef.current = true;
      setSharing(true);

      // Foydalanuvchi brauzerning "Stop sharing" tugmasini bossa — qaytaramiz.
      screenTrack.onended = () => stopShare();
    } catch (e) {
      console.error("Ekran ulashishda xato:", e);
    }
  }, [sharing, replaceVideoTrack, stopShare]);

  const leave = useCallback(() => {
    signalingRef.current?.close();
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setPeers({});
    setStatus("left");
  }, []);

  // --- Chat: xabar yuborish (o'zimizga darhol qo'shamiz, boshqalarga signaling orqali) ---
  const sendChat = useCallback((text) => {
    const t = (text || "").trim();
    if (!t) return;
    signalingRef.current?.send({ type: "chat", text: t });
    const id = `m${msgIdRef.current++}`;
    setMessages((prev) => [...prev, { id, name: "Siz", text: t, self: true }]);
  }, []);

  // --- Qo'l ko'tarish / tushirish (state orqali sinxronlanadi) ---
  const toggleHand = useCallback(() => {
    const v = !handRef.current;
    handRef.current = v;
    setHandUp(v);
    broadcastState();
  }, [broadcastState]);

  // --- Emoji reaksiya yuborish (o'zimizga ham darhol ko'rsatamiz) ---
  const sendReaction = useCallback((emoji) => {
    signalingRef.current?.send({ type: "reaction", emoji });
    const id = `r${reactionIdRef.current++}`;
    setReactions((prev) => [...prev, { id, emoji, name: "Siz" }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 4000);
  }, []);

  // --- Qurilmalar ro'yxatini qayta o'qish (UI tugmasi uchun) ---
  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: list.filter((d) => d.kind === "videoinput"),
        mics: list.filter((d) => d.kind === "audioinput"),
      });
    } catch (e) {
      console.warn("Qurilmalarni o'qib bo'lmadi:", e);
    }
  }, []);

  // --- Kamera yoki mikrofonni almashtirish (oqim davom etadi) ---
  const switchDevice = useCallback(
    async (kind, deviceId) => {
      try {
        const constraints =
          kind === "video"
            ? { video: { deviceId: { exact: deviceId } } }
            : { audio: { deviceId: { exact: deviceId } } };
        const ns = await navigator.mediaDevices.getUserMedia(constraints);
        const newTrack =
          kind === "video" ? ns.getVideoTracks()[0] : ns.getAudioTracks()[0];
        if (!newTrack) return;
        const old = localStreamRef.current;

        if (kind === "video") {
          const oldTrack = old?.getVideoTracks()[0];
          newTrack.enabled = camOnRef.current;
          cameraTrackRef.current = newTrack;
          // Ekran ulashilmayotgan bo'lsagina hozir uzatishni almashtiramiz.
          if (!sharingRef.current) {
            replaceVideoTrack(newTrack);
            const audio = old?.getAudioTracks() || [];
            const merged = new MediaStream([newTrack, ...audio]);
            localStreamRef.current = merged;
            setLocalStream(merged);
            if (oldTrack) oldTrack.stop();
          }
          // Ulashish davom etayotgan bo'lsa, yangi kamera "Stop"dan keyin ishlaydi.
        } else {
          const oldTrack = old?.getAudioTracks()[0];
          newTrack.enabled = micOnRef.current;
          pcsRef.current.forEach((pc) => {
            const s = pc
              .getSenders()
              .find((x) => x.track && x.track.kind === "audio");
            if (s) s.replaceTrack(newTrack);
          });
          const video = old?.getVideoTracks() || [];
          const merged = new MediaStream([...video, newTrack]);
          localStreamRef.current = merged;
          setLocalStream(merged);
          if (oldTrack) oldTrack.stop();
          // Ovoz analizatorini yangi mikrofonga ulaymiz.
          removeAnalyser("self");
          addAnalyser("self", merged);
        }
      } catch (e) {
        console.error("Qurilma almashtirishda xato:", e);
      }
    },
    [replaceVideoTrack, addAnalyser, removeAnalyser]
  );

  return {
    localStream,
    peers,
    status,
    error,
    warning,
    micOn,
    camOn,
    sharing,
    messages,
    sendChat,
    speaking,
    localSpeaking,
    handUp,
    toggleHand,
    reactions,
    sendReaction,
    devices,
    switchDevice,
    refreshDevices,
    toggleMic,
    toggleCam,
    shareScreen,
    leave,
  };
}
