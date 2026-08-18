import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import "./App.css";

import { AuthProvider, useAuth } from "./lib/auth";
import { SettingsProvider, useSettings } from "./lib/settings";
import { ToastProvider } from "./components/ToastProvider";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import ResidentPortal from "./pages/ResidentPortal";
import AdminDashboard from "./pages/AdminDashboard";
import Wishlist from "./pages/Wishlist";
import MapPage from "./pages/MapPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import BookTour from "./pages/BookTour";
import Notifications from "./pages/Notifications";
import Apply from "./pages/Apply";

import { api } from "./lib/api";

function Shell() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { t } = useSettings();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) { setNotifCount(0); return; }
    let cancelled = false;
    const fetchOnce = () => api.get("/api/notifications")
      .then(({ data }) => { if (!cancelled) setNotifCount(data.filter((n) => n.unread).length); })
      .catch(() => {});
    fetchOnce();
    const t = setInterval(fetchOnce, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [user]);

  useEffect(() => {
    // Lenis smooth scroll — dynamic import so SSR/preload doesn't break
    let lenis;
    let raf;
    let cancelled = false;
    if (typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        lenis = new Lenis({ duration: 1.1, smoothTouch: false, lerp: 0.1 });
        const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
      }).catch(() => {});
    }
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (lenis) lenis.destroy?.();
    };
  }, []);

  return (
    <>
      <NavBar onLoginClick={() => nav("/login")} notifCount={notifCount} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tour" element={<ProtectedRoute><BookTour /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute><ResidentPortal /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/apply" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
      </Routes>

      <Footer />

      <a href={`https://wa.me/${t("whatsapp.number").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(t("whatsapp.message"))}`} target="_blank" rel="noreferrer" className="wa-float" data-testid="whatsapp-support-button">
        <MessageCircle size={16} /> {t("whatsapp.button_label")}
      </a>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
