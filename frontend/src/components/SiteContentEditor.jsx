import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { api, toApiError } from "../lib/api";
import { useToast } from "./ToastProvider";
import { useSettings } from "../lib/settings";

// Human labels + hints for each key. Only keys shown here are editable in the UI.
const FIELDS = [
  { key: "brand.name", label: "Brand name", type: "text" },
  { key: "brand.tagline", label: "Brand tagline", type: "text" },
  { key: "brand.city", label: "Primary city", type: "text" },
  { key: "contact.email", label: "Contact email", type: "email" },
  { key: "contact.phone", label: "Contact phone (display)", type: "text" },
  { key: "contact.address", label: "Studio address", type: "text" },
  { key: "whatsapp.number", label: "WhatsApp number (E.164, no +, e.g. 919876543210)", type: "text" },
  { key: "whatsapp.message", label: "WhatsApp default message", type: "text" },
  { key: "whatsapp.button_label", label: "WhatsApp button label", type: "text" },
  { key: "home.hero_kicker", label: "Home kicker", type: "text" },
  { key: "home.hero_title", label: "Home hero title (line 1)", type: "text" },
  { key: "home.hero_title_em", label: "Home hero title (accent line)", type: "text" },
  { key: "home.hero_body", label: "Home hero paragraph", type: "textarea" },
  { key: "home.cta_title", label: "Home CTA title (line 1)", type: "text" },
  { key: "home.cta_title_em", label: "Home CTA title (accent line)", type: "text" },
  { key: "footer.about", label: "Footer about paragraph", type: "textarea" },
  { key: "footer.copyright", label: "Footer copyright", type: "text" },
  { key: "about.body", label: "About page body", type: "textarea" },
];

export default function SiteContentEditor() {
  const { refresh, t } = useSettings();
  const [values, setValues] = useState({});
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setReloading(true);
    try {
      const { data } = await api.get("/api/settings");
      const next = {};
      FIELDS.forEach((f) => { next[f.key] = data[f.key] ?? t(f.key); });
      setValues(next);
      setDirty({});
    } catch (e) { toast.push(toApiError(e)); } finally { setReloading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const set = (k, v) => { setValues((s) => ({ ...s, [k]: v })); setDirty((d) => ({ ...d, [k]: true })); };

  const saveAll = async () => {
    const items = Object.fromEntries(Object.keys(dirty).map((k) => [k, values[k] ?? ""]));
    if (Object.keys(items).length === 0) return toast.push("Nothing to save.");
    setSaving(true);
    try {
      await api.post("/api/settings/bulk", { items });
      setDirty({});
      await refresh();
      toast.push("Site content updated.");
    } catch (e) { toast.push(toApiError(e)); } finally { setSaving(false); }
  };

  const resetKey = async (key) => {
    try {
      const { data } = await api.post(`/api/settings/reset/${encodeURIComponent(key)}`);
      set(key, data.value);
      // clear dirty for this key since server has canonical default
      setDirty((d) => { const n = { ...d }; delete n[key]; return n; });
      await refresh();
      toast.push("Reset to default.");
    } catch (e) { toast.push(toApiError(e)); }
  };

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div className="mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="kicker text-nest-stone before:bg-nest-stone">Site content</div>
          <p className="text-white/80 text-[14px] mt-3 max-w-xl">Edit any user-facing text and the WhatsApp support number. Changes go live everywhere on the site the moment they save.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-outline !py-2.5 !px-4 !text-[13px]" disabled={reloading} data-testid="site-content-reload">
            <RotateCcw size={14} /> Reload
          </button>
          <button onClick={saveAll} className="btn-primary !py-2.5 !px-4 !text-[13px]" disabled={saving || dirtyCount === 0} data-testid="site-content-save">
            <Save size={14} /> {saving ? "Saving…" : `Save${dirtyCount ? ` (${dirtyCount})` : ""}`}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {FIELDS.map((f) => (
          <div key={f.key} className={`p-6 glass-card rounded-xl border ${dirty[f.key] ? "border-nest-terra shadow-[0_0_15px_rgba(229,123,85,0.15)]" : "border-white/10"} group hover:border-white/20 transition-all`}>
            <div className="flex items-center justify-between">
              <label className="font-mono-sm text-white">{f.label}</label>
              <button onClick={() => resetKey(f.key)} className="text-[11px] font-mono-sm text-nest-terra hover:text-nest-terra/80 transition-colors" data-testid={`site-content-reset-${f.key}`}>Reset to default</button>
            </div>
            <div className="text-[11px] font-mono-sm text-nest-stone opacity-70 mt-1 mb-4">{f.key}</div>
            {f.type === "textarea" ? (
              <textarea value={values[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[14px] text-white focus:border-nest-terra focus:outline-none transition-colors custom-scrollbar"
                        data-testid={`site-content-input-${f.key}`} />
            ) : (
              <input type={f.type} value={values[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[14px] text-white focus:border-nest-terra focus:outline-none transition-colors"
                     data-testid={`site-content-input-${f.key}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
