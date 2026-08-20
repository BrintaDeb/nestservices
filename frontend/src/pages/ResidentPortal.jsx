import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, FileText, Heart, MessageSquare, Wrench, Bell } from "lucide-react";
import { api, formatINR, toApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

const TABS = ["Overview", "Wishlist", "Tours", "Applications", "Maintenance", "Saved searches", "Notifications"];

export default function ResidentPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [wishlist, setWishlist] = useState([]);
  const [tours, setTours] = useState([]);
  const [apps, setApps] = useState([]);
  const [maint, setMaint] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [reqForm, setReqForm] = useState({ property_id: "", category: "Plumbing", title: "", description: "", priority: "Medium" });
  const toast = useToast();

  const load = async () => {
    try {
      const [w, t, a, m, n, s] = await Promise.all([
        api.get("/api/wishlist"),
        api.get("/api/bookings/mine"),
        api.get("/api/applications/mine"),
        api.get("/api/maintenance/mine"),
        api.get("/api/notifications"),
        api.get("/api/saved-searches"),
      ]);
      setWishlist(w.data); setTours(t.data); setApps(a.data); setMaint(m.data); setNotifs(n.data); setSavedSearches(s.data);
    } catch (e) { toast.push(toApiError(e)); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-20">
      <div className="container-nest">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="kicker text-nest-stone before:bg-nest-stone">Resident portal · Welcome back</div>
            <h1 className="headline-lg mt-4 text-white">Your home,<br /><em className="not-italic text-nest-terra font-normal">all in one place.</em></h1>
          </div>
          <div className="glass-card px-5 py-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 grid place-items-center rounded-full bg-white/5 border border-white/10 text-white font-display text-[18px]">{user?.name?.[0] || "U"}</div>
            <div>
              <b className="font-display text-white text-[15px]">{user?.name}</b>
              <div className="text-body text-[12px] opacity-80">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-8 border-b border-white/10 overflow-auto whitespace-nowrap mb-10 pb-2 custom-scrollbar">
          {TABS.map((t) => (
            <button key={t} className={`pb-3 text-[14px] font-display transition-colors relative ${tab === t ? "text-nest-terra" : "text-nest-stone hover:text-white"}`} onClick={() => setTab(t)} data-testid={`portal-tab-${t.toLowerCase()}`}>
              {t}{t === "Notifications" && unread > 0 ? ` (${unread})` : ""}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-nest-terra translate-y-[3px]" />}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <StatCard icon={<Heart size={18} />} label="Saved homes" value={wishlist.length} onClick={() => setTab("Wishlist")} testId="stat-wishlist" />
            <StatCard icon={<CalendarDays size={18} />} label="Upcoming tours" value={tours.filter((t) => t.status !== "cancelled").length} onClick={() => setTab("Tours")} testId="stat-tours" />
            <StatCard icon={<FileText size={18} />} label="Applications" value={apps.length} onClick={() => setTab("Applications")} testId="stat-apps" />
            <StatCard icon={<Wrench size={18} />} label="Open maintenance" value={maint.filter((m) => m.status !== "Completed").length} onClick={() => setTab("Maintenance")} testId="stat-maint" />
            <StatCard icon={<Bell size={18} />} label="Unread notifications" value={unread} onClick={() => setTab("Notifications")} testId="stat-notifs" />
            <div className="p-6 glass-card border border-white/10 rounded-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-nest-terra/10 rounded-full blur-3xl group-hover:bg-nest-terra/20 transition-colors"></div>
              <div className="kicker text-nest-stone before:bg-nest-stone relative z-10">Rent snapshot</div>
              <div className="mt-6 font-display text-[26px] text-white relative z-10">Manage on request</div>
              <p className="text-body text-[13px] mt-2 opacity-80 relative z-10">Rent details are shared once your application is approved and a lease begins.</p>
            </div>
          </div>
        )}

        {tab === "Wishlist" && (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.length === 0 ? <EmptyState label="Nothing saved yet." /> :
              wishlist.map((p) => (
                <Link to={`/property/${p.id}`} key={p.id} className="prop-card block glass-card" data-testid={`portal-wish-${p.id}`}>
                  <div className="prop-media"><img src={p.cover_image} alt={p.title} /></div>
                  <div className="p-5">
                    <h3 className="font-display text-[19px] text-white">{p.title}</h3>
                    <p className="text-body text-[12px] mt-1 opacity-80">{p.locality}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <b className="text-nest-terra">{formatINR(p.monthly_rent)}</b>
                      <span className="text-[12px] text-nest-terra group flex items-center gap-1">View <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}

        {tab === "Tours" && (
          <div className="mt-8 space-y-4 max-w-4xl">
            {tours.length === 0 && <EmptyState label="No tours booked yet." />}
            {tours.map((t) => (
              <div key={t.id} className="p-6 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6" data-testid={`portal-tour-${t.id}`}>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{t.property_title}</b>
                  <div className="text-body text-[13px] mt-2 opacity-80 flex items-center gap-2">
                    <CalendarDays size={14} className="opacity-60" /> {t.date} · {t.time_slot}
                  </div>
                </div>
                <span className={`chip ${t.status === "confirmed" ? "bg-nest-terra/20 text-nest-terra border-nest-terra/30" : "bg-white/5 text-nest-stone border-white/10"}`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Applications" && (
          <div className="mt-8 space-y-4 max-w-4xl">
            {apps.length === 0 && <EmptyState label="No applications yet." />}
            {apps.map((a) => (
              <div key={a.id} className="p-6 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6" data-testid={`portal-app-${a.id}`}>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{a.full_name}</b>
                  <div className="text-body text-[13px] mt-2 opacity-80">Move-in {a.move_in_date} · {a.duration_months} months</div>
                </div>
                <span className="chip bg-white/5 text-nest-stone border-white/10">{a.status}</span>
                <span className="chip bg-white/5 text-nest-stone border-white/10">Screening: {a.screening_status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Maintenance" && (
          <div className="mt-8 grid md:grid-cols-[1.5fr_1fr] gap-10">
            <div className="space-y-4">
              {maint.length === 0 && <EmptyState label="No requests yet." />}
              {maint.map((m) => (
                <div key={m.id} className="p-6 glass-card rounded-xl border border-white/10" data-testid={`portal-maint-${m.id}`}>
                  <div className="flex items-center justify-between">
                    <b className="font-display text-white text-[16px]">{m.title}</b>
                    <span className="chip bg-white/5 text-nest-stone border-white/10">{m.status}</span>
                  </div>
                  <div className="text-body text-[12px] mt-2 opacity-60 font-mono-sm">{m.category} · {m.priority} Priority</div>
                  <p className="text-body text-[14px] mt-4 opacity-80 leading-relaxed glass-card p-4 rounded-lg">{m.description}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submitMaint} className="glass-card p-6 md:p-8 rounded-xl border border-white/10 space-y-5 self-start">
              <div className="kicker text-nest-stone before:bg-nest-stone">New maintenance request</div>
              <MaintPropertyPicker value={reqForm.property_id} onChange={(v) => setReqForm({ ...reqForm, property_id: v })} />
              <select value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white focus:border-nest-terra focus:outline-none appearance-none" data-testid="maint-category">
                {["Plumbing", "Electrical", "Appliance", "Internet", "Structural", "Cleaning", "Other"].map((c) => <option key={c} className="bg-nest-ink">{c}</option>)}
              </select>
              <input value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} placeholder="Short title" required className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white focus:border-nest-terra focus:outline-none" data-testid="maint-title" />
              <textarea value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} placeholder="Describe the issue in detail" required className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white focus:border-nest-terra focus:outline-none min-h-[120px]" data-testid="maint-description" />
              <select value={reqForm.priority} onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white focus:border-nest-terra focus:outline-none appearance-none" data-testid="maint-priority">
                {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p} className="bg-nest-ink">{p} Priority</option>)}
              </select>
              <button className="btn-primary w-full justify-center mt-2" data-testid="maint-submit"><Wrench size={14} /> Submit request</button>
            </form>
          </div>
        )}

        {tab === "Saved searches" && (
          <div className="mt-8 space-y-4 max-w-4xl">
            {savedSearches.length === 0 && <EmptyState label="No saved searches yet. Save one from the Explore page to get alerts on new matches." />}
            {savedSearches.map((s) => (
              <div key={s.id} className="p-6 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6" data-testid={`portal-saved-${s.id}`}>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{s.name}</b>
                  <div className="text-body text-[12px] mt-3 flex flex-wrap gap-2">
                    {Object.entries(s.query || {}).filter(([, v]) => v !== "" && v !== null && v !== undefined).map(([k, v]) => (
                      <span key={k} className="chip bg-white/5 border-white/10 text-nest-stone !py-1 !px-2 !text-[11px] font-mono-sm">{k}: {String(v)}</span>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[13px] font-mono-sm text-nest-stone cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={s.alerts_enabled !== false}
                         onChange={async (e) => {
                           try { await api.patch(`/api/saved-searches/${s.id}`, { alerts_enabled: e.target.checked }); load(); }
                           catch (err) { toast.push(toApiError(err)); }
                         }}
                         className="accent-nest-terra"
                         data-testid={`portal-saved-alerts-${s.id}`} />
                  Alerts
                </label>
                <button className="text-[13px] text-red-400 hover:text-red-300 transition-colors border border-red-400/30 px-3 py-1.5 rounded-md hover:bg-red-400/10"
                        onClick={async () => { try { await api.delete(`/api/saved-searches/${s.id}`); toast.push("Deleted"); load(); } catch (err) { toast.push(toApiError(err)); } }}
                        data-testid={`portal-saved-delete-${s.id}`}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {tab === "Notifications" && (
          <div className="mt-8 space-y-3 max-w-4xl">
            {notifs.length === 0 && <EmptyState label="You're all caught up." />}
            {notifs.map((n) => (
              <div key={n.id} className={`p-5 rounded-xl border border-white/10 glass-card flex items-center gap-4 transition-colors ${n.unread ? "border-nest-terra/50 bg-nest-terra/10" : ""}`} data-testid={`portal-notif-${n.id}`}>
                <div className={`p-2 rounded-full ${n.unread ? "bg-nest-terra/20 text-nest-terra" : "bg-white/5 text-nest-stone"}`}>
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1">
                  <b className="font-display text-white text-[15px]">{n.title}</b>
                  <p className="text-body text-[13px] mt-1 opacity-80">{n.body}</p>
                </div>
                {n.unread && <button className="text-[12px] text-nest-terra hover:text-white transition-colors border border-nest-terra/30 px-3 py-1.5 rounded-md hover:bg-nest-terra/20" onClick={() => markRead(n.id)}>Mark read</button>}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        /* Custom scrollbar for tabs */
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </main>
  );
}

function StatCard({ icon, label, value, onClick, testId }) {
  return (
    <button onClick={onClick} className="p-6 glass-card rounded-xl border border-white/10 text-left hover:border-white/30 hover:bg-white/5 transition-all group" data-testid={testId}>
      <div className="kicker text-nest-stone before:bg-nest-stone">{label}</div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-display text-[36px] text-white leading-none group-hover:text-nest-terra transition-colors">{value}</span>
        <span className="text-nest-stone opacity-60 group-hover:text-white group-hover:opacity-100 transition-colors">{icon}</span>
      </div>
    </button>
  );
}

function EmptyState({ label }) { return <div className="p-16 text-center rounded-xl border border-dashed border-white/20 text-nest-stone opacity-80">{label}</div>; }

function MaintPropertyPicker({ value, onChange }) {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/api/properties").then(({ data }) => setItems(data)).catch(() => setItems([])); }, []);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white focus:border-nest-terra focus:outline-none appearance-none" required data-testid="maint-property">
      <option value="" className="bg-nest-ink">Pick a residence…</option>
      {items.map((p) => <option key={p.id} value={p.id} className="bg-nest-ink">{p.title}</option>)}
    </select>
  );
}
