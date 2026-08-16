import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Trash2, Upload, X, Star, Home as HomeIcon, Users, Wrench, CalendarDays, FileText } from "lucide-react";
import { api, assetUrl, formatINR, toApiError } from "../lib/api";
import { useToast } from "../components/ToastProvider";

const TABS = ["Dashboard", "Properties", "Users", "Applications", "Tours", "Maintenance"];

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
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Remove this residence?")) return;
    try { await api.delete(`/api/properties/${id}`); toast.push("Removed"); load(); } catch (e) { toast.push(toApiError(e)); }
  };

  const updateStatus = async (kind, id, status) => {
    try { await api.patch(`/api/${kind}/${id}`, { status }); toast.push("Updated"); load(); } catch (e) { toast.push(toApiError(e)); }
  };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <div className="kicker">Owner console · Nest Services</div>
          <h1 className="headline-lg mt-4 text-nest-char">Good day,<br /><em className="not-italic text-nest-terra font-normal">Nest team.</em></h1>
        </div>
        <button className="btn-primary" onClick={() => setEditing(EMPTY)} data-testid="add-property-button"><Plus size={14} /> Add residence</button>
      </div>

      <div className="flex gap-6 border-b border-nest-sand overflow-auto whitespace-nowrap">
        {TABS.map((t) => (
          <button key={t} className={`pb-3 text-[13px] font-display ${tab === t ? "text-nest-terra border-b border-nest-terra" : "text-body"}`} onClick={() => setTab(t)} data-testid={`admin-tab-${t.toLowerCase()}`}>{t}</button>
        ))}
      </div>

      {tab === "Dashboard" && stats && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div key={l} className="p-5 border border-nest-sand bg-white">
              <div className="flex items-center justify-between kicker">{l}<span>{ic}</span></div>
              <div className="mt-4 font-display text-[30px] text-nest-char">{v}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "Properties" && (
        <div className="mt-8 space-y-3">
          {props.map((p) => (
            <div key={p.id} className="p-4 border border-nest-sand bg-white flex flex-wrap items-center gap-4" data-testid={`admin-prop-${p.id}`}>
              <img src={assetUrl(p.cover_image || p.images?.[0])} alt="" className="w-20 h-16 object-cover" />
              <div className="flex-1">
                <b className="font-display text-nest-char">{p.title}</b>
                <div className="text-body text-[12px]">{p.locality} · {formatINR(p.monthly_rent)}/mo</div>
              </div>
              <span className={`chip ${p.status === "occupied" ? "!text-nest-terra" : ""}`}>{p.status}</span>
              <button className="btn-outline !py-2 !px-3 !text-[12px]" onClick={() => setEditing(p)} data-testid={`admin-edit-${p.id}`}>Edit</button>
              <button className="btn-ghost text-red-600" onClick={() => remove(p.id)} data-testid={`admin-delete-${p.id}`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {tab === "Users" && (
        <div className="mt-8 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="p-4 border border-nest-sand bg-white flex items-center gap-4" data-testid={`admin-user-${u.id}`}>
              <div className="w-10 h-10 grid place-items-center border border-nest-char text-nest-char font-display">{u.name?.[0]}</div>
              <div className="flex-1">
                <b className="font-display text-nest-char">{u.name}</b>
                <div className="text-body text-[12px]">{u.email} · {u.phone || "—"}</div>
              </div>
              <span className={`chip ${u.role === "admin" ? "!text-nest-terra" : ""}`}>{u.role}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "Applications" && (
        <div className="mt-8 space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="p-4 border border-nest-sand bg-white flex flex-wrap items-center gap-4" data-testid={`admin-app-${a.id}`}>
              <div className="flex-1">
                <b className="font-display text-nest-char">{a.full_name}</b>
                <div className="text-body text-[12px]">{a.email} · Move-in {a.move_in_date}</div>
              </div>
              <select value={a.status} onChange={(e) => updateStatus("applications", a.id, e.target.value)} className="bg-transparent border border-nest-sand py-2 px-2 text-[12px]">
                {["Submitted", "Under Review", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "Tours" && (
        <div className="mt-8 space-y-3">
          {tours.map((t) => (
            <div key={t.id} className="p-4 border border-nest-sand bg-white flex flex-wrap items-center gap-4" data-testid={`admin-tour-${t.id}`}>
              <div className="flex-1">
                <b className="font-display text-nest-char">{t.property_title}</b>
                <div className="text-body text-[12px]">{t.name} · {t.date} · {t.time_slot}</div>
              </div>
              <select value={t.status} onChange={(e) => updateStatus("bookings", t.id, e.target.value)} className="bg-transparent border border-nest-sand py-2 px-2 text-[12px]">
                {["pending", "confirmed", "cancelled", "completed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "Maintenance" && (
        <div className="mt-8 space-y-3">
          {maints.map((m) => (
            <div key={m.id} className="p-4 border border-nest-sand bg-white flex flex-wrap items-center gap-4" data-testid={`admin-maint-${m.id}`}>
              <div className="flex-1">
                <b className="font-display text-nest-char">{m.title}</b>
                <div className="text-body text-[12px]">{m.category} · {m.priority}</div>
              </div>
              <select value={m.status} onChange={(e) => updateStatus("maintenance", m.id, e.target.value)} className="bg-transparent border border-nest-sand py-2 px-2 text-[12px]">
                {["Submitted", "Assigned", "Technician Scheduled", "In Progress", "Completed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PropertyEditor value={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
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
    <div className="overlay" onClick={onClose}>
      <div className="sheet !max-w-5xl relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 btn-ghost" onClick={onClose}><X /></button>
        <div className="p-8">
          <div className="kicker">{isNew ? "New residence" : "Edit residence"}</div>
          <h2 className="headline-md mt-3 text-nest-char">{form.title || "Untitled residence"}</h2>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <Field label="Title"><input value={form.title} onChange={(e) => set("title", e.target.value)} className="input" data-testid="editor-title" /></Field>
            <Field label="Property type">
              <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className="input" data-testid="editor-type">
                {["Apartment", "House", "Villa", "Studio", "PG", "Independent Floor"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="City"><input value={form.city} onChange={(e) => set("city", e.target.value)} className="input" data-testid="editor-city" /></Field>
            <Field label="Locality"><input value={form.locality} onChange={(e) => set("locality", e.target.value)} className="input" data-testid="editor-locality" /></Field>
            <Field label="Monthly rent (₹)"><input type="number" value={form.monthly_rent} onChange={(e) => set("monthly_rent", e.target.value)} className="input" data-testid="editor-rent" /></Field>
            <Field label="Security deposit (₹)"><input type="number" value={form.security_deposit} onChange={(e) => set("security_deposit", e.target.value)} className="input" data-testid="editor-deposit" /></Field>
            <Field label="Bedrooms"><input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="input" data-testid="editor-bedrooms" /></Field>
            <Field label="Bathrooms"><input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className="input" data-testid="editor-bathrooms" /></Field>
            <Field label="Furnishing">
              <select value={form.furnished} onChange={(e) => set("furnished", e.target.value)} className="input" data-testid="editor-furnished">
                {["Furnished", "Semi-furnished", "Unfurnished"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Pet friendly">
              <select value={form.pet_friendly ? "yes" : "no"} onChange={(e) => set("pet_friendly", e.target.value === "yes")} className="input" data-testid="editor-pet">
                <option value="yes">Yes</option><option value="no">No</option>
              </select>
            </Field>
            <Field label="Available from"><input type="date" value={form.available_from || ""} onChange={(e) => set("available_from", e.target.value)} className="input" data-testid="editor-availability" /></Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input" data-testid="editor-status">
                {["available", "occupied", "draft"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Amenities (comma-separated)" className="md:col-span-2">
              <input value={(form.amenities || []).join(", ")} onChange={(e) => set("amenities", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} className="input" data-testid="editor-amenities" />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input min-h-[110px]" data-testid="editor-description" />
            </Field>
          </div>

          <div className="mt-8 border border-dashed border-nest-sand p-6">
            <div className="kicker">Property images</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {(form.images || []).map((im, i) => (
                <div key={im + i} className={`relative border ${form.cover_image === im ? "border-nest-terra" : "border-nest-sand"} bg-white`}>
                  <img src={assetUrl(im)} alt={`Image ${i + 1}`} className="w-32 h-24 object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-white/95 py-1 flex items-center justify-around text-[10px]">
                    <button onClick={() => set("cover_image", im)} className="link-underline text-nest-terra" data-testid={`editor-cover-${i}`}>{form.cover_image === im ? "Cover" : "Set cover"}</button>
                    <button onClick={() => move(i, -1)} className="text-nest-clay">←</button>
                    <button onClick={() => move(i, +1)} className="text-nest-clay">→</button>
                    <button onClick={() => removeImg(im)} className="text-red-600" data-testid={`editor-delete-${i}`}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
              <label className="w-32 h-24 border border-dashed border-nest-sand grid place-items-center text-nest-clay cursor-pointer">
                <div className="text-center text-[11px]"><Upload size={16} className="mx-auto mb-1" />Upload</div>
                <input type="file" multiple accept="image/*" className="hidden" onChange={upload} data-testid="editor-upload" />
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={busy} data-testid="editor-save">{busy ? "Saving…" : "Save residence"} <ArrowUpRight size={14} /></button>
          </div>
        </div>
      </div>
      <style>{`.input { width:100%; background:#fff; border:1px solid #E8E1D3; padding:12px; font-size:13px; }`}</style>
    </div>
  );
}
function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="font-mono-sm text-nest-clay block mb-2">{label}</label>
      {children}
    </div>
  );
}
