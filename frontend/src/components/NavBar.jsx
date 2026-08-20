import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, Heart, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "../lib/auth";

const links = [
  { to: "/", label: "Home", id: "home" },
  { to: "/explore", label: "Explore rentals", id: "explore" },
  { to: "/map", label: "Map", id: "map" },
  { to: "/tour", label: "Book a tour", id: "tour" },
  { to: "/portal", label: "Resident portal", id: "portal" },
  { to: "/about", label: "About", id: "about" },
  { to: "/contact", label: "Contact", id: "contact" },
];

export default function NavBar({ onLoginClick, notifCount = 0 }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  // close drawer whenever auth state changes or window resizes to desktop
  useEffect(() => { setOpen(false); }, [user]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const closeAnd = (fn) => () => { setOpen(false); fn?.(); };

  return (
    <>
      <header className="nav-shell mt-4">
        <div className="nav-inner glass-white !rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Link to="/" className="flex items-center gap-3 no-underline drop-shadow-md" data-testid="nav-brand" onClick={() => setOpen(false)}>
            <span className="w-8 h-8 grid place-items-center border border-white/40 text-white font-display text-lg rounded-sm shadow-sm bg-white/5">N</span>
            <span className="font-display text-[13px] tracking-[0.24em] uppercase text-white">Nest<span className="text-nest-sand ml-1">Services</span></span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-7 font-display text-[13px] text-nest-ivory drop-shadow-sm">
            {links.map((l) => (
              <NavLink key={l.id} to={l.to} data-testid={`nav-${l.id}`}
                       className={({ isActive }) => `link-underline transition-colors ${isActive ? "text-nest-terra" : "hover:text-nest-terra"}`}>
                {l.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink to="/admin" data-testid="nav-admin" className="link-underline text-nest-sand hover:text-white transition-colors">Admin</NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-3 text-white">
            <Link to="/wishlist" className="btn-ghost hidden md:inline-flex items-center gap-2 hover:text-white" data-testid="nav-wishlist">
              <Heart size={17} /><span className="text-[12px] font-display">Wishlist</span>
            </Link>
            <button
              onClick={() => (user ? nav("/notifications") : onLoginClick?.())}
              className="btn-ghost relative hover:text-white"
              data-testid="nav-notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-nest-terra text-white text-[10px] w-4 h-4 grid place-items-center rounded-full font-display shadow-md">{notifCount}</span>
              )}
            </button>
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/portal" className="btn-outline !py-2 !px-3 !text-[12px]" data-testid="nav-user">
                  <User size={14} /> {user.name?.split(" ")[0] || "Account"}
                </Link>
                <button onClick={logout} className="btn-ghost hover:text-white" title="Log out" data-testid="nav-logout"><LogOut size={16} /></button>
              </div>
            ) : (
              <button className="btn-primary !py-2 !px-4 !text-[12px] hidden md:inline-flex" onClick={onLoginClick} data-testid="nav-login">
                <ShieldCheck size={14} /> Login
              </button>
            )}
            <button
              className="md:hidden inline-grid place-items-center w-10 h-10 border border-white/20 text-white rounded-md bg-white/10 backdrop-blur-md"
              onClick={() => setOpen((s) => !s)}
              data-testid="mobile-menu-button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[55] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!open}
        data-testid="mobile-menu-drawer"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className={`absolute top-[86px] left-4 right-4 bg-nest-ink border border-white/10 rounded-xl p-6 shadow-2xl transition-transform duration-300 ${open ? "translate-y-0" : "-translate-y-4"}`}>
          <nav className="flex flex-col gap-4 font-display text-[15px] text-white">
            {links.map((l) => (
              <NavLink key={l.id} to={l.to} onClick={() => setOpen(false)}
                       data-testid={`mobile-nav-${l.id}`}
                       className={({ isActive }) => `py-2 border-b border-white/10 last:border-b-0 ${isActive ? "text-nest-sand" : "hover:text-nest-ivory"}`}>
                {l.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink to="/admin" onClick={() => setOpen(false)} className="py-2 text-nest-sand" data-testid="mobile-nav-admin">Admin console</NavLink>
            )}
            <NavLink to="/wishlist" onClick={() => setOpen(false)} className="py-2 border-t border-white/10 hover:text-nest-ivory" data-testid="mobile-nav-wishlist">
              <Heart size={14} className="inline mr-2" />Wishlist
            </NavLink>
          </nav>
          <div className="mt-6 pt-4 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <b className="font-display text-white">{user.name}</b>
                  <div className="text-body text-nest-ivory/60 text-[12px]">{user.email}</div>
                </div>
                <button onClick={closeAnd(logout)} className="btn-outline !py-2 !px-3 !text-[12px]" data-testid="mobile-nav-logout"><LogOut size={13} /> Sign out</button>
              </div>
            ) : (
              <button className="btn-primary w-full justify-center" onClick={closeAnd(onLoginClick)} data-testid="mobile-nav-login">
                <ShieldCheck size={14} /> Login / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
