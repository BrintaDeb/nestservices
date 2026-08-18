import { useState } from "react";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { api, toApiError } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { useSettings } from "../lib/settings";

export default function Contact() {
  const { t } = useSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "General enquiry", message: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (form.phone.trim().length < 6) { toast.push("Please enter a valid phone number."); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/api/contact", form);
      toast.push(data.message || "Thank you.");
      setForm({ name: "", email: "", phone: "", subject: "General enquiry", message: "" });
    } catch (err) { toast.push(toApiError(err)); } finally { setBusy(false); }
  };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Contact</div>
      <h1 className="headline-lg mt-4 text-nest-char">We're here to<br /><em className="not-italic text-nest-terra font-normal">help you settle in.</em></h1>

      <div className="mt-14 grid md:grid-cols-[1fr_1.4fr] gap-10">
        <div className="space-y-6">
          <div>
            <div className="kicker">Studio</div>
            <p className="text-body mt-2 text-[14px] flex items-center gap-2"><MapPin size={14} /> {t("contact.address")}</p>
          </div>
          <div>
            <div className="kicker">Email</div>
            <p className="text-body mt-2 text-[14px] flex items-center gap-2"><Mail size={14} /> {t("contact.email")}</p>
          </div>
          <div>
            <div className="kicker">Phone</div>
            <p className="text-body mt-2 text-[14px] flex items-center gap-2"><Phone size={14} /> {t("contact.phone")}</p>
          </div>
          <div>
            <div className="kicker">WhatsApp</div>
            <a href={`https://wa.me/${t("whatsapp.number").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(t("whatsapp.message"))}`} target="_blank" rel="noreferrer" className="text-nest-terra link-underline text-[14px] inline-flex items-center gap-2 mt-2">
              Chat with our team <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <form onSubmit={submit} className="glass-white p-6 md:p-8 rounded-md space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full bg-white border border-nest-sand py-3 px-3 text-[14px]" data-testid="contact-name" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full bg-white border border-nest-sand py-3 px-3 text-[14px]" data-testid="contact-email" />
          </div>
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (required)" pattern="[0-9+ ()-]{6,20}" className="w-full bg-white border border-nest-sand py-3 px-3 text-[14px]" data-testid="contact-phone" />
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full bg-white border border-nest-sand py-3 px-3 text-[14px]" data-testid="contact-subject">
            {["General enquiry", "Rentals", "List my property", "Partnership", "Feedback"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your message" className="w-full bg-white border border-nest-sand py-3 px-3 text-[14px] min-h-[140px]" data-testid="contact-message" />
          <button className="btn-primary w-full justify-center" disabled={busy} data-testid="contact-submit">{busy ? "Sending…" : "Send message"} <ArrowUpRight size={14} /></button>
        </form>
      </div>
    </main>
  );
}
