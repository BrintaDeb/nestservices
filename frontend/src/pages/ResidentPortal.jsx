import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, FileText, Heart, MessageSquare, Wrench, Bell } from "lucide-react";
import { api, formatINR, toApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

const TABS = ["Overview", "Wishlist", "Tours", "Applications", "Maintenance", "Notifications"];

export default function ResidentPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [wishlist, setWishlist] = useState([]);
  const [tours, setTours] = useState([]);
  const [apps, setApps] = useState([]);
  const [maint, setMaint] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [reqForm, setReqForm] = useState({ property_id: "", category: "Plumbing", title: "", description: "", priority: "Medium" });
  const toast = useToast();

  const load = async () => {
    try {
      const [w, t, a, m, n] = await Promise.all([
        api.get("/api/wishlist"),
        api.get("/api/bookings/mine"),
        api.get("/api/applications/mine"),
        api.get("/api/maintenance/mine"),
        api.get("/api/notifications"),
      ]);
      setWishlist(w.data); setTours(t.data); setApps(a.data); setMaint(m.data); setNotifs(n.data);
    } catch (e) { toast.push(toApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const submitMaint = async (e) => {
    e.preventDefault();
    if (!reqForm.property_id) { toast.push("Please pick a residence."); return; }
    try {
      await api.post("/api/maintenance", reqForm);
      setReqForm({ property_id: reqForm.property_id, category: "Plumbing", title: "", description: "", priority: "Medium" });
      toast.push("Maintenance request submitted");
      load();
    } catch (err) { toast.push(toApiError(err)); }
  };

  const markRead = async (id) => {
    try { await api.post(`/api/notifications/${id}/read`); load(); } catch (_) {}
  };

  const unread = notifs.filter((n) => n.unread).length;

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <div className="kicker">Resident portal · Welcome back</div>
          <h1 className="headline-lg mt-4 text-nest-char">Your home,<br /><em className="not-italic text-nest-terra font-normal">all in one place.</em></h1>
        </div>
        <div className="glass-white px-5 py-4 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 grid place-items-center border border-nest-char text-nest-char font-display">{user?.name?.[0] || "U"}</div>
          <div>
            <b className="font-display text-nest-char">{user?.name}</b>
            <div className="text-body text-[12px]">{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-nest-sand overflow-auto whitespace-nowrap">
        {TABS.map((t) => (
          <button key={t} className={`pb-3 text-[13px] font-display ${tab === t ? "text-nest-terra border-b border-nest-terra" : "text-body"}`} onClick={() => setTab(t)} data-testid={`portal-tab-${t.toLowerCase()}`}>
            {t}{t === "Notifications" && unread > 0 ? ` (${unread})` : ""}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <StatCard icon={<Heart size={16} />} label="Saved homes" value={wishlist.length} to="#" onClick={() => setTab("Wishlist")} testId="stat-wishlist" />
          <StatCard icon={<CalendarDays size={16} />} label="Upcoming tours" value={tours.filter((t) => t.status !== "cancelled").length} onClick={() => setTab("Tours")} testId="stat-tours" />
          <StatCard icon={<FileText size={16} />} label="Applications" value={apps.length} onClick={() => setTab("Applications")} testId="stat-apps" />
          <StatCard icon={<Wrench size={16} />} label="Open maintenance" value={maint.filter((m) => m.status !== "Completed").length} onClick={() => setTab("Maintenance")} testId="stat-maint" />
          <StatCard icon={<Bell size={16} />} label="Unread notifications" value={unread} onClick={() => setTab("Notifications")} testId="stat-notifs" />
          <div className="p-5 border border-nest-sand bg-white">
            <div className="kicker">Rent snapshot</div>
            <div className="mt-4 font-display text-[26px] text-nest-char">Manage on request</div>
            <p className="text-body text-[13px] mt-2">Rent details are shared once your application is approved and a lease begins.</p>
          </div>
        </div>
      )}

      {tab === "Wishlist" && (
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.length === 0 ? <EmptyState label="Nothing saved yet." /> :
            wishlist.map((p) => (
              <Link to={`/property/${p.id}`} key={p.id} className="prop-card block" data-testid={`portal-wish-${p.id}`}>
                <div className="prop-media"><img src={p.cover_image} alt={p.title} /></div>
                <div className="p-5">
                  <h3 className="font-display text-[19px] text-nest-char">{p.title}</h3>
                  <p className="text-body text-[12px] mt-1">{p.locality}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <b className="text-nest-terra">{formatINR(p.monthly_rent)}</b>
                    <span className="link-underline text-[12px] text-nest-terra">View <ArrowUpRight size={11} className="inline" /></span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}

      {tab === "Tours" && (
        <div className="mt-8 space-y-3">
          {tours.length === 0 && <EmptyState label="No tours booked yet." />}
          {tours.map((t) => (
            <div key={t.id} className="p-5 border border-nest-sand bg-white flex flex-wrap items-center gap-4" data-testid={`portal-tour-${t.id}`}>
              <div className="flex-1">
                <b className="font-display text-nest-char">{t.property_title}</b>
                <div className="text-body text-[12px] mt-1">{t.date} · {t.time_slot}</div>
              </div>
              <span className={`chip ${t.status === "confirmed" ? "text-nest-terra" : ""}`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "Applications" && (
        <div className="mt-8 space-y-3">
          {apps.length === 0 && <EmptyState label="No applications yet." />}
          {apps.map((a) => (
            <div key={a.id} className="p-5 border border-nest-sand bg-white flex flex-wrap items-center gap-4" data-testid={`portal-app-${a.id}`}>
              <div className="flex-1">
                <b className="font-display text-nest-char">{a.full_name}</b>
                <div className="text-body text-[12px] mt-1">Move-in {a.move_in_date} · {a.duration_months} months</div>
              </div>
              <span className="chip">{a.status}</span>
              <span className="chip">Screening: {a.screening_status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "Maintenance" && (
        <div className="mt-8 grid md:grid-cols-[1fr_1fr] gap-8">
          <div className="space-y-3">
            {maint.length === 0 && <EmptyState label="No requests yet." />}
            {maint.map((m) => (
              <div key={m.id} className="p-5 border border-nest-sand bg-white" data-testid={`portal-maint-${m.id}`}>
                <div className="flex items-center justify-between">
                  <b className="font-display text-nest-char">{m.title}</b>
                  <span className="chip">{m.status}</span>
                </div>
                <div className="text-body text-[12px] mt-1">{m.category} · {m.priority}</div>
                <p className="text-body text-[13px] mt-3">{m.description}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submitMaint} className="glass-white p-5 rounded-md space-y-3">
            <div className="kicker">New maintenance request</div>
            <MaintPropertyPicker value={reqForm.property_id} onChange={(v) => setReqForm({ ...reqForm, property_id: v })} />
            <select value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="maint-category">
              {["Plumbing", "Electrical", "Appliance", "Internet", "Structural", "Cleaning", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} placeholder="Short title" required className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="maint-title" />
            <textarea value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} placeholder="Describe the issue" required className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px] min-h-[100px]" data-testid="maint-description" />
            <select value={reqForm.priority} onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid="maint-priority">
              {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <button className="btn-primary w-full justify-center" data-testid="maint-submit"><Wrench size={14} /> Submit request</button>
          </form>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="mt-8 space-y-2">
          {notifs.length === 0 && <EmptyState label="You're all caught up." />}
          {notifs.map((n) => (
            <div key={n.id} className={`p-4 border border-nest-sand ${n.unread ? "bg-nest-sand/40" : "bg-white"} flex items-center gap-3`} data-testid={`portal-notif-${n.id}`}>
              <MessageSquare size={16} className="text-nest-terra" />
              <div className="flex-1">
                <b className="font-display text-nest-char">{n.title}</b>
                <p className="text-body text-[12px]">{n.body}</p>
              </div>
              {n.unread && <button className="link-underline text-[11px] text-nest-terra" onClick={() => markRead(n.id)}>Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, label, value, onClick, testId }) {
  return (
    <button onClick={onClick} className="p-5 border border-nest-sand bg-white text-left hover:border-nest-terra transition-colors" data-testid={testId}>
      <div className="kicker">{label}</div>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-[32px] text-nest-char">{value}</span>
        <span className="text-nest-clay">{icon}</span>
      </div>
    </button>
  );
}
function EmptyState({ label }) { return <div className="p-12 text-center border border-dashed border-nest-sand text-body">{label}</div>; }

function MaintPropertyPicker({ value, onChange }) {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/api/properties").then(({ data }) => setItems(data)).catch(() => setItems([])); }, []);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" required data-testid="maint-property">
      <option value="">Pick a residence…</option>
      {items.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
    </select>
  );
}
