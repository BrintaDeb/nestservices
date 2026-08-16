import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { api, toApiError } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../lib/auth";

const SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"];

export default function BookTour() {
  const [params] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [pid, setPid] = useState(params.get("property") || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(SLOTS[0]);
  const [slots, setSlots] = useState([]);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => { api.get("/api/properties").then(({ data }) => setProperties(data)); }, []);
  useEffect(() => {
    if (!pid || !date) return;
    api.get(`/api/bookings/slots/${pid}`, { params: { date } }).then(({ data }) => setSlots(data.slots)).catch(() => setSlots([]));
  }, [pid, date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return nav("/login");
    setBusy(true);
    try {
      await api.post("/api/bookings", { property_id: pid, date, time_slot: time, name: user.name, phone, notes });
      toast.push("Tour requested. You'll be notified once confirmed.");
      nav("/portal");
    } catch (e) { toast.push(toApiError(e)); } finally { setBusy(false); }
  };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Book a private tour</div>
      <h1 className="headline-lg mt-4 text-nest-char">Come by,<br /><em className="not-italic text-nest-terra font-normal">feel the space.</em></h1>

      <form onSubmit={submit} className="mt-10 grid md:grid-cols-2 gap-4 max-w-3xl">
        <div className="md:col-span-2">
          <label className="font-mono-sm text-nest-clay block mb-2">Residence</label>
          <select value={pid} onChange={(e) => setPid(e.target.value)} required className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="tour-property">
            <option value="">Pick a residence…</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.city}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono-sm text-nest-clay block mb-2">Date</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="tour-date" />
        </div>
        <div>
          <label className="font-mono-sm text-nest-clay block mb-2">Time</label>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="tour-time">
            {SLOTS.map((s) => {
              const found = slots.find((x) => x.time === s);
              const dis = found && !found.available;
              return <option key={s} value={s} disabled={dis}>{s}{dis ? " · Booked" : ""}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="font-mono-sm text-nest-clay block mb-2">Phone</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="tour-phone" />
        </div>
        <div>
          <label className="font-mono-sm text-nest-clay block mb-2">Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like us to prepare?" className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="tour-notes" />
        </div>
        <button className="btn-primary md:col-span-2 justify-center" disabled={busy} data-testid="tour-submit">
          {busy ? "Requesting…" : "Request tour"} <CalendarDays size={14} />
        </button>
      </form>
    </main>
  );
}
