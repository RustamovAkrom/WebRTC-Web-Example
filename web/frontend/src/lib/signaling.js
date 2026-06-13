// signaling.js — backend WebSocket signaling serveri bilan ishlovchi yengil o'rovchi.
//
// Vazifasi: ulanishni ochish, JSON xabarlarni yuborish/qabul qilish va
// hodisalarni (onMessage / onOpen / onClose) callback orqali yetkazish.

export class Signaling {
  /**
   * @param {string} room   - xona ID
   * @param {string} name   - foydalanuvchi ismi
   * @param {string|null} token - ixtiyoriy WS ticket (login bo'lganlar uchun)
   */
  constructor(room, name, token = null) {
    this.room = room;
    this.name = name;
    this.token = token;
    this.ws = null;
    this.onMessage = () => {};
    this.onOpen = () => {};
    this.onClose = () => {};
  }

  connect() {
    // Bir xil origin orqali ulanamiz (dev'da Vite proksi, prod'da nginx proksi qiladi).
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const tokenPart = this.token
      ? `&token=${encodeURIComponent(this.token)}`
      : "";
    const url = `${proto}://${window.location.host}/ws/${encodeURIComponent(
      this.room
    )}?name=${encodeURIComponent(this.name)}${tokenPart}`;

    this.ws = new WebSocket(url);
    this.ws.onopen = () => this.onOpen();
    this.ws.onclose = () => this.onClose();
    this.ws.onmessage = (event) => {
      try {
        this.onMessage(JSON.parse(event.data));
      } catch (e) {
        console.error("Signaling: noto'g'ri JSON", e);
      }
    };
  }

  /** Manzil peer'ga (yoki serverga) JSON xabar yuborish. */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close() {
    if (this.ws) {
      this.ws.onclose = null; // qayta-ulanish/hodisani chaqirmaslik uchun
      this.ws.close();
      this.ws = null;
    }
  }
}
