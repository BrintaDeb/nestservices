import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, Heart, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import { useState } from "react";
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

  useEffect(() => { setOpen(false); }, [user]);

  return (
    <header className="nav-shell">
      <div className="nav-inner glass-white">
        <Link to="/" className="flex items-center gap-3 no-underline" data-testid="nav-brand">
          <span className="w-8 h-8 grid place-items-center border border-nest-char text-nest-char font-display text-lg">N</span>
          <span className="font-display text-[13px] tracking-[0.24em] uppercase text-nest-char">Nest<span className="text-nest-clay ml-1">Services</span></span>
        </Link>

        <nav className={`links ${open ? "flex" : "hidden"} md:!flex absolute md:static top-[70px] left-0 right-0 md:top-auto md:left-auto md:right-auto flex-col md:flex-row items-start md:items-center gap-6 md:gap-7 bg-white/95 md:bg-transparent border md:border-0 border-nest-sand p-6 md:p-0`}>
          {links.map((l) => (
            <NavLink key={l.id} to={l.to} data-testid={`nav-${l.id}`} className={({ isActive }) => `link-underline ${isActive ? "text-nest-terra" : ""}`}>
              {l.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin" data-testid="nav-admin" className="link-underline text-nest-terra">Admin</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/wishlist" className="btn-ghost hidden md:inline-flex items-center gap-2" data-testid="nav-wishlist">
            <Heart size={17} /><span className="text-[12px] font-display">Wishlist</span>
          </Link>
          <button
            onClick={() => user ? nav("/notifications") : onLoginClick?.()}
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
            <button className="btn-primary !py-2 !px-4 !text-[12px]" onClick={onLoginClick} data-testid="nav-login">
              <ShieldCheck size={14} /> Login
            </button>
          )}
          <button className="btn-ghost md:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-button">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
