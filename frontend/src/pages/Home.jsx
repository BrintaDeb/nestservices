import { useEffect, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api, toApiError } from "../lib/api";
import Walkthrough from "../components/Walkthrough";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";
import { useToast } from "../components/ToastProvider";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [wished, setWished] = useState([]);
  const { user } = useAuth();
  const { t } = useSettings();
  const toast = useToast();

  useEffect(() => {
    api.get("/api/properties", { params: { limit: 6 } })
      .then(({ data }) => setFeatured(data))
      .catch(() => setFeatured([]));
    if (user) {
      api.get("/api/wishlist").then(({ data }) => setWished(data.map((x) => x.id))).catch(() => {});
    }
  }, [user]);

  const toggleWish = async (id) => {
    if (!user) { toast.push("Please sign in to save homes."); return; }
    try {
      const { data } = await api.post("/api/wishlist/toggle", { property_id: id });
      setWished((s) => data.wishlisted ? [...new Set([...s, id])] : s.filter((x) => x !== id));
      toast.push(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } catch (e) {
      toast.push(toApiError(e));
    }
  };

  return (
    <main>
      <Walkthrough />

      {/* Intro */}
      <section className="container-nest pt-32 pb-24 grid md:grid-cols-2 gap-16 items-end">
        <div>
          <div className="kicker">{t("home.hero_kicker")}</div>
          <h2 className="headline-lg mt-6 text-nest-char">{t("home.hero_title")}<br /><em className="not-italic text-nest-terra font-normal">{t("home.hero_title_em")}</em></h2>
        </div>
        <div>
          <p className="text-body max-w-md text-[16px]">{t("home.hero_body")}</p>
          <Link to="/explore" className="mt-8 inline-flex items-center gap-2 text-nest-terra font-display link-underline" data-testid="intro-explore-link">
            Discover residences <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {/* Search band */}
      <section className="container-nest">
        <div className="glass-white p-4 md:p-3 flex flex-col md:flex-row gap-3 md:items-center rounded-md">
          <div className="flex items-center gap-3 flex-1 px-2">
            <Search size={17} className="text-nest-clay" />
            <input
              type="text"
              placeholder="Try 'Agartala 2 bedroom under ₹20,000'"
              className="flex-1 bg-transparent outline-none py-3 text-[14px]"
              data-testid="home-search-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") window.location.href = `/explore?q=${encodeURIComponent(e.currentTarget.value)}`;
              }}
            />
          </div>
          <Link to="/explore" className="btn-primary" data-testid="home-search-cta">Search residences <ArrowUpRight size={13} /></Link>
        </div>
      </section>

      {/* Featured */}
      <section className="container-nest pt-24 pb-20">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <div className="kicker">Curated in Agartala</div>
            <h2 className="headline-md mt-4 text-nest-char">Homes to come home to.</h2>
          </div>
          <Link to="/explore" className="link-underline font-display text-nest-terra text-[13px]" data-testid="featured-view-all">View all residences →</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((p) => (
            <PropertyCard key={p.id} p={p} wished={wished.includes(p.id)} onToggleWish={toggleWish} />
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="bg-white hairline">
        <div className="container-nest py-24 grid md:grid-cols-[1fr_1.6fr] gap-14">
          <div>
            <div className="kicker">Why Nest Services</div>
            <h2 className="headline-md mt-6 text-nest-char">More than a<br /><em className="not-italic text-nest-terra font-normal">place to live.</em></h2>
          </div>
          <div>
            {[
              ["01", "Explore differently", "A cinematic way to feel a home before you visit."],
              ["02", "Move with clarity", "Search, tour, apply, sign and settle — one considered journey."],
              ["03", "Stay supported", "Rent, maintenance and lease — quietly organised in your resident portal."],
              ["04", "Own with confidence", "Landlords get a modern console — listings, occupancy and messages, in one place."],
            ].map(([n, t, d]) => (
              <div key={n} className="grid grid-cols-[50px_1fr] gap-6 py-6 hairline first:border-0">
                <span className="font-mono-sm text-nest-clay">{n}</span>
                <div>
                  <h3 className="font-display text-[24px] text-nest-char">{t}</h3>
                  <p className="text-body mt-2 text-[14px] max-w-md">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="container-nest py-28 text-center">
        <div className="kicker justify-center inline-flex">Ready when you are</div>
        <h2 className="headline-lg mt-6 text-nest-char">{t("home.cta_title")}<br /><em className="not-italic text-nest-terra font-normal">{t("home.cta_title_em")}</em></h2>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/explore" className="btn-primary" data-testid="cta-explore">Explore rentals <ArrowUpRight size={14} /></Link>
          <Link to="/tour" className="btn-outline" data-testid="cta-tour">Book a tour <ArrowUpRight size={14} /></Link>
        </div>
      </section>
    </main>
  );
}
