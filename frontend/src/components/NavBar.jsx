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
      <header className="nav-shell">
        <div className="nav-inner glass-white">
          <Link to="/" className="flex items-center gap-3 no-underline" data-testid="nav-brand" onClick={() => setOpen(false)}>
            <span className="w-8 h-8 grid place-items-center border border-nest-char text-nest-char font-display text-lg">N</span>
            <span className="font-display text-[13px] tracking-[0.24em] uppercase text-nest-char">Nest<span className="text-nest-clay ml-1">Services</span></span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-7 font-display text-[13px] text-nest-char">
            {links.map((l) => (
              <NavLink key={l.id} to={l.to} data-testid={`nav-${l.id}`}
                       className={({ isActive }) => `link-underline transition-colors ${isActive ? "text-nest-terra" : "hover:text-nest-terra"}`}>
                {l.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink to="/admin" data-testid="nav-admin" className="link-underline text-nest-terra">Admin</NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/wishlist" className="btn-ghost hidden md:inline-flex items-center gap-2" data-testid="nav-wishlist">
              <Heart size={17} /><span className="text-[12px] font-display">Wishlist</span>
            </Link>
            <button
              onClick={() => (user ? nav("/notifications") : onLoginClick?.())}
              className="btn-ghost relative"
              data-testid="nav-notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-nest-terra text-white text-[10px] w-4 h-4 grid place-items-center rounded-full font-display">{notifCount}</span>
              )}
            </button>
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/portal" className="btn-outline !py-2 !px-3 !text-[12px]" data-testid="nav-user">
                  <User size={14} /> {user.name?.split(" ")[0] || "Account"}
                </Link>
                <button onClick={logout} className="btn-ghost" title="Log out" data-testid="nav-logout"><LogOut size={16} /></button>
              </div>
            ) : (
              <button className="btn-primary !py-2 !px-4 !text-[12px] hidden md:inline-flex" onClick={onLoginClick} data-testid="nav-login">
                <ShieldCheck size={14} /> Login
              </button>
            )}
            <button
              className="md:hidden inline-grid place-items-center w-10 h-10 border border-nest-sand text-nest-char rounded-md bg-white/70"
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
        <div className="absolute inset-0 bg-nest-char/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className={`absolute top-[86px] left-4 right-4 bg-white border border-nest-sand rounded-md p-6 shadow-xl transition-transform duration-300 ${open ? "translate-y-0" : "-translate-y-4"}`}>
          <nav className="flex flex-col gap-4 font-display text-[15px] text-nest-char">
            {links.map((l) => (
              <NavLink key={l.id} to={l.to} onClick={() => setOpen(false)}
                       data-testid={`mobile-nav-${l.id}`}
                       className={({ isActive }) => `py-2 border-b border-nest-sand last:border-b-0 ${isActive ? "text-nest-terra" : ""}`}>
                {l.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink to="/admin" onClick={() => setOpen(false)} className="py-2 text-nest-terra" data-testid="mobile-nav-admin">Admin console</NavLink>
            )}
            <NavLink to="/wishlist" onClick={() => setOpen(false)} className="py-2 border-t border-nest-sand" data-testid="mobile-nav-wishlist">
              <Heart size={14} className="inline mr-2" />Wishlist
            </NavLink>
          </nav>
          <div className="mt-6 pt-4 border-t border-nest-sand">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <b className="font-display text-nest-char">{user.name}</b>
                  <div className="text-body text-[12px]">{user.email}</div>
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
