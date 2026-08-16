import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, Upload } from "lucide-react";
import { api, toApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

export default function ApplyPage() {
  const [params] = useSearchParams();
  const property_id = params.get("property") || "";
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    property_id, full_name: "", email: "", phone: "", current_address: "",
    employment_status: "Salaried", employer: "", monthly_income: 0,
    occupants: 1, move_in_date: "", duration_months: 11, emergency_contact: "", documents: [],
  });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    api.get("/api/properties").then(({ data }) => setProperties(data)).catch(() => {});
    if (user) setForm((f) => ({ ...f, full_name: user.name, email: user.email }));
  }, [user]);

  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      const { data } = await api.post("/api/uploads/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, documents: [...f.documents, ...data.urls] }));
      toast.push("Documents uploaded");
    } catch (err) { toast.push(toApiError(err)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) return toast.push("Please provide screening consent to continue.");
    setBusy(true);
    try {
      await api.post("/api/applications", form);
      toast.push("Application submitted. Nest Services will be in touch.");
      nav("/portal");
    } catch (err) { toast.push(toApiError(err)); } finally { setBusy(false); }
  };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Rental application</div>
      <h1 className="headline-lg mt-4 text-nest-char">Apply for your<br /><em className="not-italic text-nest-terra font-normal">next home.</em></h1>
      <p className="text-body mt-4 max-w-lg">Step 3 of 6 — Digital application. Sensitive documents are stored privately and only shared with your assigned landlord.</p>

      <form onSubmit={submit} className="mt-10 grid md:grid-cols-2 gap-4">
        <Select label="Residence" value={form.property_id} onChange={(v) => setForm({ ...form, property_id: v })} required options={[{ value: "", label: "Pick a residence" }, ...properties.map((p) => ({ value: p.id, label: `${p.title} · ${p.city}` }))]} testId="apply-property" />
        <Text label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required testId="apply-name" />
        <Text label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required testId="apply-email" />
        <Text label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required testId="apply-phone" />
        <Text label="Current address" value={form.current_address} onChange={(v) => setForm({ ...form, current_address: v })} testId="apply-address" />
        <Select label="Employment" value={form.employment_status} onChange={(v) => setForm({ ...form, employment_status: v })} options={["Salaried", "Self-employed", "Freelance", "Student", "Other"].map((x) => ({ value: x, label: x }))} testId="apply-employment" />
        <Text label="Employer" value={form.employer} onChange={(v) => setForm({ ...form, employer: v })} testId="apply-employer" />
        <Text label="Monthly income (₹)" type="number" value={form.monthly_income} onChange={(v) => setForm({ ...form, monthly_income: Number(v) })} testId="apply-income" />
        <Text label="Occupants" type="number" value={form.occupants} onChange={(v) => setForm({ ...form, occupants: Number(v) })} testId="apply-occupants" />
        <Text label="Desired move-in" type="date" value={form.move_in_date} onChange={(v) => setForm({ ...form, move_in_date: v })} required testId="apply-movein" />
        <Text label="Duration (months)" type="number" value={form.duration_months} onChange={(v) => setForm({ ...form, duration_months: Number(v) })} testId="apply-duration" />
        <Text label="Emergency contact" value={form.emergency_contact} onChange={(v) => setForm({ ...form, emergency_contact: v })} testId="apply-emergency" />

        <div className="md:col-span-2 border border-dashed border-nest-sand p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="kicker">Supporting documents</div>
            <p className="text-body text-[13px] mt-2">Pay slips, ID or rental references — kept private and encrypted at rest.</p>
            <div className="mt-3 text-[12px] text-nest-terra">{form.documents.length} file(s) uploaded</div>
          </div>
          <label className="btn-outline cursor-pointer">
            <Upload size={14} /> Upload documents
            <input type="file" multiple onChange={upload} className="hidden" data-testid="apply-docs-input" />
          </label>
        </div>

        <label className="md:col-span-2 flex items-start gap-3 text-[13px] text-body">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="apply-consent" />
          <span><ShieldCheck size={14} className="inline text-nest-terra" /> I consent to Nest Services and its partners running a tenant screening check (identity and rental history, where legally permitted).</span>
        </label>

        <button disabled={busy} className="btn-primary md:col-span-2 justify-center" data-testid="apply-submit">
          {busy ? "Submitting…" : "Submit application"} <ArrowUpRight size={14} />
        </button>
      </form>
    </main>
  );
}

function Text({ label, value, onChange, type = "text", required, testId }) {
  return (
    <div>
      <label className="font-mono-sm text-nest-clay block mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid={testId} />
    </div>
  );
}
function Select({ label, value, onChange, options, required, testId }) {
  return (
    <div>
      <label className="font-mono-sm text-nest-clay block mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-white border border-nest-sand py-3 px-3 text-[13px]" data-testid={testId}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
