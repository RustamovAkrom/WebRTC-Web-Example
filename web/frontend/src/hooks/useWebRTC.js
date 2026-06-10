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

  const signalingRef = useRef(null);
  const pcsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const pendingIceRef = useRef(new Map()); // peerId -> RTCIceCandidate[]
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null); // ekran ulashishdan keyin qaytarish uchun
  const startedRef = useRef(false); // StrictMode ikki marta ishga tushirmasin
  const liveRef = useRef(false); // welcome kelganmi (WS ulanish holati)

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

      // Remote track kelganda — peer'ning stream'ini saqlaymiz.
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setPeers((prev) => ({
          ...prev,
          [peerId]: { name: peerName, stream },
        }));
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
          msg.peers.forEach((p) => createPeer(p.peerId, p.name, true));
          setStatus("live");
          break;
        }
        case "peer-joined": {
          // Yangi peer keldi — u bizga offer yuboradi, biz kutamiz (non-initiator).
          // pc uning offer'i kelganda yaratiladi. Hozircha ismni eslab qolamiz.
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
        case "peer-left": {
          const pc = pcsRef.current.get(msg.peerId);
          if (pc) pc.close();
          pcsRef.current.delete(msg.peerId);
          pendingIceRef.current.delete(msg.peerId);
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
    [createPeer, flushPendingIce]
  );

  // --- Ishga tushirish: media olish + signaling ulash ---
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

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
        if (!stream.getVideoTracks().length) setCamOn(false);
        if (!stream.getAudioTracks().length) setMicOn(false);
      } else {
        setCamOn(false);
        setMicOn(false);
      }

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
      setMicOn(track.enabled);
    }
  }, []);

  const toggleCam = useCallback(() => {
    const track = cameraTrackRef.current;
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  }, []);

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

  return {
    localStream,
    peers,
    status,
    error,
    warning,
    micOn,
    camOn,
    sharing,
    toggleMic,
    toggleCam,
    shareScreen,
    leave,
  };
}
