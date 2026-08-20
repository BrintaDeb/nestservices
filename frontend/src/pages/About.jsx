import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useSettings } from "../lib/settings";

export default function About() {
  const { t } = useSettings();
  return (
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-20">
      <div className="container-nest max-w-5xl">
        <div className="kicker text-nest-stone before:bg-nest-stone">About Nest</div>
        <h1 className="headline-lg mt-4 text-white">A calmer way to rent<br /><em className="not-italic text-nest-terra font-normal">in India.</em></h1>
        <p className="text-body mt-6 max-w-2xl text-[16px] leading-[1.7] opacity-90">{t("about.body")}</p>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            ["For renters", "Discover homes with clarity — search, tour, apply and settle without the noise."],
            ["For landlords", "Modern console for listings, occupancy, tours and tenant conversations."],
            ["For residents", "One portal for rent, maintenance, lease and messages after move-in."],
          ].map(([t, d]) => (
            <div key={t} className="glass-card p-8">
              <div className="kicker text-nest-stone before:bg-nest-stone">{t}</div>
              <p className="text-body mt-4 text-[14px] leading-relaxed opacity-80">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-20 border-t border-white/10">
          <div className="kicker text-nest-stone before:bg-nest-stone">Testimonials</div>
          <h2 className="headline-md mt-4 text-white">What residents say</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            {[
              { name: "Ritwika D.", city: "Agartala", body: "The tour scheduling and portal saved us weeks. It felt like moving with a friend on the inside.", verified: true },
              { name: "Anirban B.", city: "Guwahati", body: "As a landlord, the console is quietly powerful. Applications, tours and messages — all in one place.", verified: false },
            ].map((r) => (
              <div key={r.name} className="glass-card p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-[64px] font-display leading-none group-hover:text-nest-terra group-hover:opacity-10 transition-colors">"</div>
                <p className="text-body text-[16px] leading-[1.7] relative z-10 italic">"{r.body}"</p>
                <div className="mt-6 flex items-center justify-between text-[12px] relative z-10">
                  <b className="font-display text-white">{r.name} <span className="opacity-60 font-normal">· {r.city}</span></b>
                  <span className={`px-2 py-1 rounded border ${r.verified ? "border-nest-terra/30 text-nest-terra bg-nest-terra/10" : "border-white/10 text-nest-stone"}`}>{r.verified ? "Verified tenant" : "General review"}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] font-mono-sm text-nest-stone opacity-60">Demo testimonials during development — verified reviews will be marked when signed by real residents.</p>
        </div>

        <div className="mt-20">
          <Link to="/explore" className="btn-primary inline-flex" data-testid="about-cta">Explore residences <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </main>
  );
}
