import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

const DEFAULTS = {
  "brand.name": "Nest Services",
  "brand.tagline": "find your nest, secure your space",
  "brand.city": "Agartala",
  "contact.email": "hello@nestservices.in",
  "contact.phone": "+91 90000 00000",
  "contact.address": "Agartala, Tripura, India",
  "whatsapp.number": "919000000000",
  "whatsapp.message": "Hello Nest Services",
  "whatsapp.button_label": "WhatsApp support",
  "home.hero_kicker": "The Nest promise",
  "home.hero_title": "Renting should feel",
  "home.hero_title_em": "like a beginning.",
  "home.hero_body": "Nest Services is a considered rental home for India — a cinematic way to discover residences, a modern marketplace, and a calm portal for the life that follows move-in.",
  "home.cta_title": "Find your nest.",
  "home.cta_title_em": "Secure your space.",
  "footer.about": "Find your nest, secure your space. India's cinematic rental home for renters and landlords.",
  "footer.copyright": "© 2026 Nest Services",
  "about.body": "Nest Services is a modern rental home for renters, landlords and property teams. Built from Agartala for the country, we bring a cinematic way to feel a home before you visit, a considered marketplace of curated residences, and a calm portal that quietly handles rent, maintenance and messages after move-in.",
};

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/api/settings");
      setSettings({ ...DEFAULTS, ...data });
    } catch (_) {
      // keep defaults on failure
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const t = useCallback((key, fallback) => {
    const v = settings[key];
    if (v === undefined || v === null || v === "") return fallback ?? DEFAULTS[key] ?? "";
    return v;
  }, [settings]);

  return (
    <SettingsCtx.Provider value={{ settings, ready, t, refresh }}>{children}</SettingsCtx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

// Format any ISO date string as IST-readable text.
export function formatIST(input, { withTime = true } = {}) {
  if (!input) return "";
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const opts = withTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }
      : { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" };
    return new Intl.DateTimeFormat("en-IN", opts).format(d) + (withTime ? " IST" : "");
  } catch {
    return String(input);
  }
}
