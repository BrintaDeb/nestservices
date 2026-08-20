import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Trash2, Upload, X, Star, Home as HomeIcon, Users, Wrench, CalendarDays, FileText } from "lucide-react";
import { api, assetUrl, formatINR, toApiError } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import SiteContentEditor from "../components/SiteContentEditor";

const TABS = ["Dashboard", "Properties", "Users", "Applications", "Tours", "Maintenance", "Site content"];

const EMPTY = {
  title: "", description: "", property_type: "Apartment", city: "Agartala", locality: "",
  monthly_rent: 25000, security_deposit: 50000, bedrooms: 2, bathrooms: 2,
  furnished: "Furnished", pet_friendly: false, available_from: "", amenities: [], rules: [],
  images: [], cover_image: "", status: "available", rating: 4.7,
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("Dashboard");
  const [stats, setStats] = useState(null);
  const [props, setProps] = useState([]);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [tours, setTours] = useState([]);
  const [maints, setMaints] = useState([]);
  const [editing, setEditing] = useState(null); // property being edited or "new"
  const toast = useToast();

  const load = async () => {
    try {
      const [s, p, u, a, t, m] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/properties", { params: { limit: 200 } }),
        api.get("/api/admin/users"),
        api.get("/api/applications"),
        api.get("/api/bookings"),
        api.get("/api/maintenance"),
      ]);
      setStats(s.data); setProps(p.data); setUsers(u.data); setApps(a.data); setTours(t.data); setMaints(m.data);
    } catch (e) { toast.push(toApiError(e)); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Remove this residence?")) return;
    try { await api.delete(`/api/properties/${id}`); toast.push("Removed"); load(); } catch (e) { toast.push(toApiError(e)); }
  };

  const updateStatus = async (kind, id, status) => {
    try { await api.patch(`/api/${kind}/${id}`, { status }); toast.push("Updated"); load(); } catch (e) { toast.push(toApiError(e)); }
  };

  return (
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-20">
      <div className="container-nest max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="kicker text-nest-stone before:bg-nest-stone">Owner console · Nest Services</div>
            <h1 className="headline-lg mt-4 text-white">Good day,<br /><em className="not-italic text-nest-terra font-normal">Nest team.</em></h1>
          </div>
          <button className="btn-primary" onClick={() => setEditing(EMPTY)} data-testid="add-property-button"><Plus size={14} /> Add residence</button>
        </div>

        <div className="flex gap-8 border-b border-white/10 overflow-auto whitespace-nowrap mb-8 pb-2 custom-scrollbar">
          {TABS.map((t) => (
            <button key={t} className={`pb-3 text-[14px] font-display transition-colors relative ${tab === t ? "text-nest-terra" : "text-nest-stone hover:text-white"}`} onClick={() => setTab(t)} data-testid={`admin-tab-${t.toLowerCase()}`}>
              {t}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-nest-terra translate-y-[3px]" />}
            </button>
          ))}
        </div>

        {tab === "Dashboard" && stats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              [String(stats.total_properties).padStart(2, "0"), "Total residences", <HomeIcon size={14} key="a" />],
              [String(stats.occupied_units).padStart(2, "0"), "Occupied units", <HomeIcon size={14} key="b" />],
              [`${stats.occupancy_rate}%`, "Occupancy rate", <Star size={14} key="c" />],
              [formatINR(stats.rent_collected), "Monthly rent value", <FileText size={14} key="d" />],
              [String(stats.users).padStart(2, "0"), "Users", <Users size={14} key="e" />],
              [String(stats.applications).padStart(2, "0"), "Applications", <FileText size={14} key="f" />],
              [String(stats.tours).padStart(2, "0"), "Tour requests", <CalendarDays size={14} key="g" />],
              [String(stats.open_maintenance).padStart(2, "0"), "Open maintenance", <Wrench size={14} key="h" />],
            ].map(([v, l, ic]) => (
              <div key={l} className="p-6 glass-card rounded-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between kicker text-nest-stone before:bg-nest-stone relative z-10">{l}<span className="text-nest-terra/80 group-hover:text-nest-terra transition-colors">{ic}</span></div>
                <div className="mt-6 font-display text-[36px] text-white relative z-10 leading-none group-hover:text-nest-terra transition-colors">{v}</div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-nest-terra/5 rounded-full blur-2xl group-hover:bg-nest-terra/10 transition-colors"></div>
              </div>
            ))}
          </div>
        )}

        {tab === "Properties" && (
          <div className="mt-8 space-y-4">
            {props.map((p) => (
              <div key={p.id} className="p-4 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6 group hover:border-white/20 transition-colors" data-testid={`admin-prop-${p.id}`}>
                <img src={assetUrl(p.cover_image || p.images?.[0])} alt="" className="w-24 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{p.title}</b>
                  <div className="text-body text-[13px] opacity-80 mt-1">{p.locality} · <span className="text-nest-terra">{formatINR(p.monthly_rent)}/mo</span></div>
                </div>
                <span className={`chip ${p.status === "occupied" ? "bg-nest-terra/20 text-nest-terra border-nest-terra/30" : "bg-white/5 text-nest-stone border-white/10"}`}>{p.status}</span>
                <div className="flex gap-2">
                  <button className="btn-outline !py-2 !px-4 !text-[13px]" onClick={() => setEditing(p)} data-testid={`admin-edit-${p.id}`}>Edit</button>
                  <button className="btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 !py-2 !px-3" onClick={() => remove(p.id)} data-testid={`admin-delete-${p.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Users" && (
          <div className="mt-8 space-y-4">
            {users.map((u) => (
              <div key={u.id} className="p-5 glass-card rounded-xl border border-white/10 flex items-center gap-6" data-testid={`admin-user-${u.id}`}>
                <div className="w-12 h-12 grid place-items-center rounded-full bg-white/5 border border-white/10 text-white font-display text-[18px]">{u.name?.[0]}</div>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{u.name}</b>
                  <div className="text-body text-[13px] opacity-80 mt-1">{u.email} <span className="opacity-50 mx-2">·</span> {u.phone || "No phone"}</div>
                </div>
                <span className={`chip ${u.role === "admin" ? "bg-nest-terra/20 text-nest-terra border-nest-terra/30" : "bg-white/5 text-nest-stone border-white/10"}`}>{u.role}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Applications" && (
          <div className="mt-8 space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="p-5 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6" data-testid={`admin-app-${a.id}`}>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{a.full_name}</b>
                  <div className="text-body text-[13px] opacity-80 mt-1">{a.email} <span className="opacity-50 mx-2">·</span> Move-in {a.move_in_date}</div>
                </div>
                <select value={a.status} onChange={(e) => updateStatus("applications", a.id, e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[13px] text-white focus:border-nest-terra focus:outline-none appearance-none cursor-pointer">
                  {["Submitted", "Under Review", "Approved", "Rejected"].map((s) => <option key={s} className="bg-nest-ink">{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === "Tours" && (
          <div className="mt-8 space-y-4">
            {tours.map((t) => (
              <div key={t.id} className="p-5 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6" data-testid={`admin-tour-${t.id}`}>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{t.property_title}</b>
                  <div className="text-body text-[13px] opacity-80 mt-1 flex items-center gap-2">{t.name} <span className="opacity-50 mx-1">·</span> <CalendarDays size={12} className="opacity-60" /> {t.date} <span className="opacity-50 mx-1">·</span> {t.time_slot}</div>
                </div>
                <select value={t.status} onChange={(e) => updateStatus("bookings", t.id, e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[13px] text-white focus:border-nest-terra focus:outline-none appearance-none cursor-pointer">
                  {["pending", "confirmed", "cancelled", "completed"].map((s) => <option key={s} className="bg-nest-ink">{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === "Maintenance" && (
          <div className="mt-8 space-y-4">
            {maints.map((m) => (
              <div key={m.id} className="p-5 glass-card rounded-xl border border-white/10 flex flex-wrap items-center gap-6" data-testid={`admin-maint-${m.id}`}>
                <div className="flex-1">
                  <b className="font-display text-white text-[16px]">{m.title}</b>
                  <div className="text-body text-[13px] opacity-80 mt-1 font-mono-sm">{m.category} <span className="opacity-50 mx-2">·</span> {m.priority} Priority</div>
                </div>
                <select value={m.status} onChange={(e) => updateStatus("maintenance", m.id, e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[13px] text-white focus:border-nest-terra focus:outline-none appearance-none cursor-pointer">
                  {["Submitted", "Assigned", "Technician Scheduled", "In Progress", "Completed"].map((s) => <option key={s} className="bg-nest-ink">{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === "Site content" && <SiteContentEditor />}

        {editing && (
          <PropertyEditor value={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </main>
  );
}

function PropertyEditor({ value, onClose, onSaved }) {
  const [form, setForm] = useState(value);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isNew = !form.id;

  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      const { data } = await api.post("/api/uploads/images", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const next = [...(form.images || []), ...data.urls];
      const cover = form.cover_image || data.urls[0];
      setForm({ ...form, images: next, cover_image: cover });
      toast.push("Images uploaded");
    } catch (err) { toast.push(toApiError(err)); }
  };

  const move = (i, dir) => {
    const next = [...form.images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setForm({ ...form, images: next });
  };
  const removeImg = (im) => {
    const next = form.images.filter((x) => x !== im);
    setForm({ ...form, images: next, cover_image: form.cover_image === im ? next[0] || "" : form.cover_image });
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = { ...form };
      // ensure numbers
      ["monthly_rent", "security_deposit", "bedrooms", "bathrooms"].forEach((k) => { payload[k] = Number(payload[k] || 0); });
      payload.rating = Number(payload.rating || 4.7);
      if (isNew) await api.post("/api/properties", payload);
      else await api.put(`/api/properties/${form.id}`, payload);
      toast.push("Residence saved");
      onSaved();
    } catch (e) { toast.push(toApiError(e)); } finally { setBusy(false); }
  };

  return (
    <div className="overlay z-[900]" onClick={onClose}>
      <div className="sheet !max-w-5xl !bg-nest-ink relative border-l border-white/10" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-6 right-6 text-nest-stone hover:text-white transition-colors" onClick={onClose}><X /></button>
        <div className="p-8 md:p-10 h-full overflow-y-auto">
          <div className="kicker text-nest-stone before:bg-nest-stone">{isNew ? "New residence" : "Edit residence"}</div>
          <h2 className="headline-md mt-4 text-white">{form.title || "Untitled residence"}</h2>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Field label="Title"><input value={form.title} onChange={(e) => set("title", e.target.value)} className="input" data-testid="editor-title" /></Field>
            <Field label="Property type">
              <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className="input appearance-none" data-testid="editor-type">
                {["Apartment", "House", "Villa", "Studio", "PG", "Independent Floor"].map((t) => <option key={t} className="bg-nest-ink">{t}</option>)}
              </select>
            </Field>
            <Field label="City"><input value={form.city} onChange={(e) => set("city", e.target.value)} className="input" data-testid="editor-city" /></Field>
            <Field label="Locality"><input value={form.locality} onChange={(e) => set("locality", e.target.value)} className="input" data-testid="editor-locality" /></Field>
            <Field label="Monthly rent (₹)"><input type="number" value={form.monthly_rent} onChange={(e) => set("monthly_rent", e.target.value)} className="input" data-testid="editor-rent" /></Field>
            <Field label="Security deposit (₹)"><input type="number" value={form.security_deposit} onChange={(e) => set("security_deposit", e.target.value)} className="input" data-testid="editor-deposit" /></Field>
            <Field label="Bedrooms"><input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="input" data-testid="editor-bedrooms" /></Field>
            <Field label="Bathrooms"><input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className="input" data-testid="editor-bathrooms" /></Field>
            <Field label="Furnishing">
              <select value={form.furnished} onChange={(e) => set("furnished", e.target.value)} className="input appearance-none" data-testid="editor-furnished">
                {["Furnished", "Semi-furnished", "Unfurnished"].map((f) => <option key={f} className="bg-nest-ink">{f}</option>)}
              </select>
            </Field>
            <Field label="Pet friendly">
              <select value={form.pet_friendly ? "yes" : "no"} onChange={(e) => set("pet_friendly", e.target.value === "yes")} className="input appearance-none" data-testid="editor-pet">
                <option value="yes" className="bg-nest-ink">Yes</option><option value="no" className="bg-nest-ink">No</option>
              </select>
            </Field>
            <Field label="Available from"><input type="date" value={form.available_from || ""} onChange={(e) => set("available_from", e.target.value)} className="input" data-testid="editor-availability" style={{ colorScheme: 'dark' }} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input appearance-none" data-testid="editor-status">
                {["available", "occupied", "draft"].map((s) => <option key={s} className="bg-nest-ink">{s}</option>)}
              </select>
            </Field>
            <Field label="Amenities (comma-separated)" className="md:col-span-2">
              <input value={(form.amenities || []).join(", ")} onChange={(e) => set("amenities", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} className="input" data-testid="editor-amenities" />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input min-h-[140px]" data-testid="editor-description" />
            </Field>
          </div>

          <div className="mt-10 p-8 glass-card border border-white/10 rounded-xl">
            <div className="kicker text-nest-stone before:bg-nest-stone">Property images</div>
            <div className="mt-4 flex flex-wrap gap-4">
              {(form.images || []).map((im, i) => (
                <div key={im + i} className={`relative rounded-lg overflow-hidden border-2 ${form.cover_image === im ? "border-nest-terra shadow-[0_0_15px_rgba(229,123,85,0.3)]" : "border-transparent"} group`}>
                  <img src={assetUrl(im)} alt={`Image ${i + 1}`} className="w-40 h-28 object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm py-1.5 flex items-center justify-around text-[11px] opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0">
                    <button onClick={() => set("cover_image", im)} className="text-nest-terra font-medium" data-testid={`editor-cover-${i}`}>{form.cover_image === im ? "Cover" : "Set cover"}</button>
                    <button onClick={() => move(i, -1)} className="text-white hover:text-nest-terra transition-colors">←</button>
                    <button onClick={() => move(i, +1)} className="text-white hover:text-nest-terra transition-colors">→</button>
                    <button onClick={() => removeImg(im)} className="text-red-400 hover:text-red-300" data-testid={`editor-delete-${i}`}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              <label className="w-40 h-28 rounded-lg border border-dashed border-white/30 grid place-items-center text-nest-stone cursor-pointer hover:bg-white/5 hover:border-white/50 transition-colors">
                <div className="text-center text-[12px]"><Upload size={20} className="mx-auto mb-2 opacity-60" />Upload</div>
                <input type="file" multiple accept="image/*" className="hidden" onChange={upload} data-testid="editor-upload" />
              </label>
            </div>
          </div>

          <div className="mt-10 flex gap-4 justify-end">
            <button className="btn-outline !px-6" onClick={onClose}>Cancel</button>
            <button className="btn-primary !px-6" onClick={save} disabled={busy} data-testid="editor-save">{busy ? "Saving…" : "Save residence"} <ArrowUpRight size={14} /></button>
          </div>
        </div>
      </div>
      <style>{`.input { width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px 16px; font-size:14px; color:white; outline:none; transition:border-color 0.2s; } .input:focus { border-color: #E57B55; }`}</style>
    </div>
  );
}
function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="font-mono-sm text-nest-stone opacity-80 block mb-2">{label}</label>
      {children}
    </div>
  );
}
