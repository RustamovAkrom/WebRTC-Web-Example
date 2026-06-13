// ThemeContext — dark / light / system mavzu boshqaruvi.
//
// Tanlov localStorage'da saqlanadi; <html data-theme="..."> orqali CSS tokenlari
// almashadi. "system" bo'lsa OS sozlamasiga ergashadi.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "webrtc-theme"; // "dark" | "light" | "system"

function systemTheme() {
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolve(pref) {
  return pref === "system" ? systemTheme() : pref;
}

function apply(pref) {
  document.documentElement.setAttribute("data-theme", resolve(pref));
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => localStorage.getItem(KEY) || "dark");

  useEffect(() => {
    apply(pref);
    localStorage.setItem(KEY, pref);
  }, [pref]);

  // "system" tanlangan bo'lsa OS o'zgarishini kuzatamiz.
  useEffect(() => {
    if (pref !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setTheme = useCallback((p) => setPref(p), []);
  const toggleTheme = useCallback(
    () => setPref((p) => (resolve(p) === "dark" ? "light" : "dark")),
    []
  );

  return (
    <ThemeContext.Provider
      value={{ theme: pref, resolved: resolve(pref), setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme ThemeProvider ichida ishlatilishi kerak");
  return ctx;
}
