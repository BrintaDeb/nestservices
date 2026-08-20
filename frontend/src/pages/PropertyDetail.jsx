import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, BedDouble, Bath, CalendarDays, Heart, MapPin, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { api, assetUrl, formatINR, toApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

const SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"];

export default function PropertyDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [active, setActive] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(SLOTS[0]);
  const [slots, setSlots] = useState([]);
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const load = () => api.get(`/api/properties/${id}`).then(({ data }) => setP(data)).catch(() => setP(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!date) return;
    api.get(`/api/bookings/slots/${id}`, { params: { date } }).then(({ data }) => setSlots(data.slots)).catch(() => setSlots([]));
  }, [date, id]);

  const share = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); toast.push("Link copied to clipboard"); }
    catch { toast.push(url); }
  };

  const wish = async () => {
    if (!user) return toast.push("Sign in to save homes.");
    try {
      const { data } = await api.post("/api/wishlist/toggle", { property_id: id });
      toast.push(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
      setP((prev) => ({ ...prev, is_wishlisted: data.wishlisted }));
    } catch (e) { toast.push(toApiError(e)); }
  };

  const bookTour = async () => {
    if (!user) return nav("/login");
    if (!date || !phone) return toast.push("Please pick a date and enter a phone number.");
    try {
      await api.post("/api/bookings", { property_id: id, date, time_slot: time, name: user.name, phone });
      toast.push("Tour requested. You'll be notified once confirmed.");
      setShowTour(false);
    } catch (e) { toast.push(toApiError(e)); }
  };

  const postComment = async () => {
    if (!user) return toast.push("Sign in to comment.");
    if (!comment.trim()) return;
    try {
      await api.post("/api/comments", { property_id: id, body: comment.trim() });
      setComment("");
      load();
      toast.push("Comment added");
    } catch (e) { toast.push(toApiError(e)); }
  };

  if (p === null) return <div className="min-h-[70vh] grid place-items-center font-mono-sm">Loading residence…</div>;
  if (p === false) return <div className="min-h-[70vh] grid place-items-center text-body">Residence not found.</div>;

  const images = p.images && p.images.length ? p.images : [p.cover_image].filter(Boolean);

  return (
    <main className="pt-28">
      <div className="container-nest">
        <div className="kicker mb-4">{p.property_type} · {p.city}</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <h1 className="headline-lg text-white">{p.title}</h1>
          <div className="text-right">
            <div className="font-display text-[28px] text-nest-terra">{formatINR(p.monthly_rent)} <small className="text-[12px] text-body">/ month</small></div>
            <div className="text-body text-[12px]">Security deposit {formatINR(p.security_deposit)}</div>
          </div>
        </div>
        <p className="mt-3 text-body flex items-center gap-2"><MapPin size={14} /> {p.locality}</p>
      </div>

      {/* Gallery */}
      <div className="container-nest mt-8 grid md:grid-cols-[2fr_1fr] gap-3">
        <div className="aspect-[16/10] overflow-hidden bg-nest-sand">
          <img src={assetUrl(images[active])} alt={p.title} className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 max-h-[520px] overflow-auto">
          {images.slice(0, 6).map((im, i) => (
            <button key={im + i} onClick={() => setActive(i)} className={`aspect-video overflow-hidden ${i === active ? "ring-2 ring-nest-terra" : ""}`} data-testid={`gallery-thumb-${i}`}>
              <img src={assetUrl(im)} alt={`${p.title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="container-nest mt-6 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => setShowTour((s) => !s)} data-testid="book-tour-button"><CalendarDays size={14} /> Book a private tour</button>
        <button className="btn-outline" onClick={() => nav(`/apply?property=${id}`)} data-testid="apply-property-button">Apply for this home <ArrowUpRight size={14} /></button>
        <button className="btn-outline" onClick={wish} data-testid="detail-wishlist-button"><Heart size={14} fill={p.is_wishlisted ? "currentColor" : "none"} /> Wishlist</button>
        <button className="btn-outline" onClick={share} data-testid="detail-share-button"><Share2 size={14} /> Share</button>
      </div>

      {showTour && (
        <div className="container-nest mt-6">
          <div className="glass-white p-5 grid md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="font-mono-sm text-nest-clay block mb-2">Visit date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent border border-nest-sand py-3 px-3 w-full text-[13px]" data-testid="tour-date-input" />
            </div>
            <div>
              <label className="font-mono-sm text-nest-clay block mb-2">Time</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent border border-nest-sand py-3 px-3 w-full text-[13px]" data-testid="tour-time-select">
                {SLOTS.map((s) => {
                  const found = slots.find((x) => x.time === s);
                  const dis = found && !found.available;
                  return <option key={s} value={s} disabled={dis}>{s}{dis ? " · Booked" : ""}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="font-mono-sm text-nest-clay block mb-2">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" className="bg-transparent border border-nest-sand py-3 px-3 w-full text-[13px]" data-testid="tour-phone-input" />
            </div>
            <button className="btn-primary" onClick={bookTour} data-testid="confirm-tour-button">Confirm tour <ArrowUpRight size={14} /></button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="container-nest mt-14 grid md:grid-cols-[2fr_1fr] gap-14">
        <div>
          <div className="kicker">Residence</div>
          <h2 className="headline-md mt-3 text-white">A considered stay</h2>
          <p className="text-body mt-4 text-[15px] leading-[1.7]">{p.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 hairline hairline-b py-6">
            <div><b className="font-display text-[22px] text-white">{p.bedrooms}</b><br /><small className="font-mono-sm text-nest-clay"><BedDouble size={11} className="inline" /> Bedrooms</small></div>
            <div><b className="font-display text-[22px] text-white">{p.bathrooms}</b><br /><small className="font-mono-sm text-nest-clay"><Bath size={11} className="inline" /> Bathrooms</small></div>
            <div><b className="font-display text-[22px] text-white">{p.furnished}</b><br /><small className="font-mono-sm text-nest-clay">Furnishing</small></div>
            <div><b className="font-display text-[22px] text-white">{p.pet_friendly ? "Yes" : "No"}</b><br /><small className="font-mono-sm text-nest-clay">Pets</small></div>
          </div>

          <div className="mt-8">
            <div className="kicker">Amenities</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.amenities?.map((a) => (
                <span key={a} className="chip"><ShieldCheck size={12} /> {a}</span>
              ))}
            </div>
          </div>

          {p.rules?.length > 0 && (
            <div className="mt-8">
              <div className="kicker">House rules</div>
              <ul className="mt-4 space-y-2 text-body text-[14px]">
                {p.rules.map((r) => <li key={r}>· {r}</li>)}
              </ul>
            </div>
          )}

          {/* Comments */}
          <div className="mt-14">
            <div className="kicker">What visitors say</div>
            <h3 className="headline-md mt-3 text-white">{p.comments?.length || 0} comments</h3>
            <div className="mt-6 space-y-4">
              {p.comments?.map((c) => (
                <div key={c.id} className="p-4 border border-nest-sand bg-white">
                  <div className="flex items-center justify-between text-[12px] text-nest-clay">
                    <b className="text-white">{c.user_name}</b>
                    <span className="font-mono-sm">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-body text-[14px]">{c.body}</p>
                </div>
              ))}
              {!p.comments?.length && <p className="text-body text-[13px]">Be the first to leave a note.</p>}
            </div>
            <div className="mt-6 flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={user ? "Share a note about this residence…" : "Sign in to comment"}
                     className="flex-1 bg-white border border-nest-sand py-3 px-4 text-[14px]" data-testid="comment-input" />
              <button className="btn-primary" onClick={postComment} data-testid="comment-submit"><ArrowUpRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="glass-white p-6 rounded-md h-fit sticky top-24">
          <div className="kicker">Owner / manager</div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-12 h-12 grid place-items-center border border-nest-char text-white font-display">N</div>
            <div>
              <b className="font-display text-white">Nest Services</b>
              <div className="text-body text-[12px]">Managed rental · Agartala</div>
            </div>
          </div>
          <div className="mt-6 text-body text-[13px]">Contact through the Nest platform — your number stays private.</div>
          <div className="mt-4 flex flex-col gap-2">
            <button className="btn-primary w-full justify-center" onClick={() => setShowTour(true)} data-testid="sidebar-tour-button"><CalendarDays size={14} /> Book a tour</button>
            <button className="btn-outline w-full justify-center" onClick={() => nav(`/apply?property=${id}`)} data-testid="sidebar-apply-button">Apply for this home <ArrowUpRight size={14} /></button>
          </div>
          <div className="mt-6 pt-6 hairline">
            <div className="font-mono-sm text-nest-clay">Availability</div>
            <div className="mt-1 font-display text-white">Move-in from {p.available_from}</div>
          </div>
        </aside>
      </div>

      <div className="h-28" />
    </main>
  );
}
