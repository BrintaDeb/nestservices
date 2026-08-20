import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";
import { toApiError } from "../lib/api";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();

  const from = loc.state?.from || "/portal";

  useEffect(() => { setBusy(false); }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        toast.push(`Welcome back, ${u.name.split(" ")[0]}.`);
        nav(u.role === "admin" ? "/admin" : from);
      } else {
        const u = await register({ name, email, password, phone });
        toast.push(`Welcome to Nest, ${u.name.split(" ")[0]}.`);
        nav("/portal");
      }
    } catch (err) {
      toast.push(toApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-20 grid md:grid-cols-2">
      <div className="container-nest max-w-none mx-0 hidden md:block bg-nest-ivory relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85" alt="Residence" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-nest-char/40" />
        <div className="relative z-10 h-full flex flex-col justify-end p-14 text-white">
          <div className="font-mono-sm">Nest Services</div>
          <h2 className="headline-lg mt-6 !text-white">Find your nest,<br /><em className="not-italic text-nest-sand font-normal">secure your space.</em></h2>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="kicker text-nest-stone before:bg-nest-stone">{mode === "login" ? "Welcome back" : "Create your account"}</div>
          <h1 className="headline-md mt-4 text-white">{mode === "login" ? "Sign in" : "Join Nest"}</h1>
          <p className="text-body mt-3 text-[14px] opacity-80">
            {mode === "login" ? "Enter your credentials to continue." : "Renters, landlords, and residents all in one place."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3 glass-card p-6 md:p-8 rounded-xl">
            {mode === "register" && (
              <>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[14px] text-white focus:border-nest-terra focus:outline-none transition-colors" data-testid="register-name-input" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[14px] text-white focus:border-nest-terra focus:outline-none transition-colors" data-testid="register-phone-input" />
              </>
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[14px] text-white focus:border-nest-terra focus:outline-none transition-colors" data-testid={mode === "login" ? "login-email-input" : "register-email-input"} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[14px] text-white focus:border-nest-terra focus:outline-none transition-colors" data-testid={mode === "login" ? "login-password-input" : "register-password-input"} />
            <button className="btn-primary w-full justify-center" disabled={busy} data-testid={mode === "login" ? "login-submit-button" : "register-submit-button"}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowUpRight size={14} />
            </button>
          </form>

          <div className="mt-6 text-body text-[13px]">
            {mode === "login" ? (
              <>New to Nest? <button className="link-underline text-nest-terra" onClick={() => setMode("register")} data-testid="switch-to-register">Create an account</button></>
            ) : (
              <>Already have an account? <button className="link-underline text-nest-terra" onClick={() => setMode("login")} data-testid="switch-to-login">Sign in</button></>
            )}
          </div>

          <div className="mt-10 p-4 border border-white/10 text-[12px] font-mono-sm text-nest-stone glass-card rounded-xl">
            Demo access — admin@nestservices.in / Nest@Admin2026
            <br />tenant demo — tanya@nestservices.in / Tanya@2026
          </div>

          <div className="mt-6"><Link to="/" className="link-underline text-[13px]">← Back to home</Link></div>
        </div>
      </div>
    </main>
  );
}
