import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useSettings } from "../lib/settings";

export default function About() {
  const { t } = useSettings();
  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">About Nest</div>
      <h1 className="headline-lg mt-4 text-nest-char">A calmer way to rent<br /><em className="not-italic text-nest-terra font-normal">in India.</em></h1>
      <p className="text-body mt-6 max-w-2xl text-[16px] leading-[1.7]">{t("about.body")}</p>

      <div className="mt-14 grid md:grid-cols-3 gap-6">
        {[
          ["For renters", "Discover homes with clarity — search, tour, apply and settle without the noise."],
          ["For landlords", "Modern console for listings, occupancy, tours and tenant conversations."],
          ["For residents", "One portal for rent, maintenance, lease and messages after move-in."],
        ].map(([t, d]) => (
          <div key={t} className="p-6 border border-nest-sand bg-white">
            <div className="kicker">{t}</div>
            <p className="text-body mt-3 text-[14px]">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <div className="kicker">Testimonials</div>
        <h2 className="headline-md mt-3 text-nest-char">What residents say</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {[
            { name: "Ritwika D.", city: "Agartala", body: "The tour scheduling and portal saved us weeks. It felt like moving with a friend on the inside.", verified: true },
            { name: "Anirban B.", city: "Guwahati", body: "As a landlord, the console is quietly powerful. Applications, tours and messages — all in one place.", verified: false },
          ].map((r) => (
            <div key={r.name} className="p-6 border border-nest-sand bg-white">
              <p className="text-body text-[15px] leading-[1.7]">"{r.body}"</p>
              <div className="mt-4 flex items-center justify-between text-[12px]">
                <b className="font-display text-nest-char">{r.name} · {r.city}</b>
                <span className={`chip ${r.verified ? "!text-nest-terra" : ""}`}>{r.verified ? "Verified tenant" : "General review"}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-mono-sm text-nest-clay">Demo testimonials during development — verified reviews will be marked when signed by real residents.</p>
      </div>

      <div className="mt-16">
        <Link to="/explore" className="btn-primary inline-flex" data-testid="about-cta">Explore residences <ArrowUpRight size={14} /></Link>
      </div>
    </main>
  );
}
