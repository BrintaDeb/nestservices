import { useEffect, useState, useCallback } from "react";
import { ArrowUpRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api, toApiError } from "../lib/api";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";
import { useToast } from "../components/ToastProvider";
import Hero3D from "../components/Hero3D";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [wished, setWished] = useState([]);
  const { user } = useAuth();
  const { t } = useSettings();
  const toast = useToast();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: true, align: "start" });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    api.get("/api/properties", { params: { limit: 8 } })
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
    <main className="bg-nest-ink text-nest-ivory min-h-screen overflow-hidden">
      
      {/* Hero Section with 3D Background */}
      <section className="relative w-full h-screen flex flex-col justify-center">
        <Hero3D />
        
        <motion.div 
          className="container-nest relative z-20 mt-16"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUpVariant} className="kicker text-nest-stone before:bg-nest-stone">
            {t("home.hero_kicker")}
          </motion.div>
          <motion.h2 variants={fadeUpVariant} className="headline-lg mt-6 text-nest-ivory drop-shadow-2xl">
            {t("home.hero_title")}<br />
            <em className="not-italic text-nest-glow font-normal">{t("home.hero_title_em")}</em>
          </motion.h2>
          
          <motion.div variants={fadeUpVariant} className="mt-10 max-w-xl">
            <p className="text-nest-sand text-lg mb-8 drop-shadow-md">
              {t("home.hero_body")}
            </p>
            
            <div className="glass-white p-2 flex flex-col md:flex-row gap-2 md:items-center rounded-2xl md:rounded-full shadow-2xl">
              <div className="flex items-center gap-3 flex-1 px-4">
                <Search size={18} className="text-nest-ivory opacity-60" />
                <input
                  type="text"
                  placeholder="Try 'Agartala 2 bedroom under ₹20,000'"
                  className="flex-1 bg-transparent outline-none py-3 text-nest-ivory placeholder:text-nest-ivory/50"
                  data-testid="home-search-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") window.location.href = `/explore?q=${encodeURIComponent(e.currentTarget.value)}`;
                  }}
                />
              </div>
              <Link to="/explore" className="btn-primary whitespace-nowrap" data-testid="home-search-cta">Search <ArrowUpRight size={14} /></Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured 3D Carousel */}
      <section className="container-nest py-32 relative z-10 bg-nest-ink">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="flex items-end justify-between gap-4 mb-12"
        >
          <div>
            <motion.div variants={fadeUpVariant} className="kicker text-nest-stone before:bg-nest-stone">Curated in Agartala</motion.div>
            <motion.h2 variants={fadeUpVariant} className="headline-md mt-4 text-nest-ivory">Homes to come home to.</motion.h2>
          </div>
          <motion.div variants={fadeUpVariant} className="flex gap-3">
            <button onClick={scrollPrev} className="p-3 rounded-full border border-white/10 bg-black/20 hover:bg-white/10 transition-colors text-white">
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button onClick={scrollNext} className="p-3 rounded-full border border-white/10 bg-black/20 hover:bg-white/10 transition-colors text-white">
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </motion.div>
        </motion.div>

        {/* Embla Carousel Viewport */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden -mx-4 px-4 pb-12" 
          ref={emblaRef}
        >
          <div className="flex gap-6">
            {featured.map((p) => (
              <div key={p.id} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0">
                <PropertyCard p={p} wished={wished.includes(p.id)} onToggleWish={toggleWish} />
              </div>
            ))}
          </div>
        </motion.div>
        
        <div className="mt-4 text-center">
          <Link to="/explore" className="link-underline font-display text-nest-stone text-[14px]" data-testid="featured-view-all">View all residences →</Link>
        </div>
      </section>

      {/* Why Cinematic Grid */}
      <section className="bg-black hairline">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="container-nest py-32 grid md:grid-cols-[1fr_1.6fr] gap-16"
        >
          <div>
            <motion.div variants={fadeUpVariant} className="kicker text-nest-stone before:bg-nest-stone">Why Nest Services</motion.div>
            <motion.h2 variants={fadeUpVariant} className="headline-md mt-6 text-nest-ivory">More than a<br /><em className="not-italic text-nest-glow font-normal">place to live.</em></motion.h2>
          </div>
          <div>
            {[
              ["01", "Explore differently", "A cinematic way to feel a home before you visit."],
              ["02", "Move with clarity", "Search, tour, apply, sign and settle — one considered journey."],
              ["03", "Stay supported", "Rent, maintenance and lease — quietly organised in your resident portal."],
              ["04", "Own with confidence", "Landlords get a modern console — listings, occupancy and messages, in one place."],
            ].map(([n, t, d], i) => (
              <motion.div 
                key={n} 
                variants={fadeUpVariant}
                className="grid grid-cols-[50px_1fr] gap-6 p-6 glass-card hover:bg-white/10 transition-colors mb-6"
              >
                <span className="font-mono-sm text-nest-stone pt-2">{n}</span>
                <div>
                  <h3 className="font-display text-[28px] text-nest-ivory">{t}</h3>
                  <p className="text-nest-sand mt-3 text-[16px] max-w-md opacity-80">{d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA band */}
      <section className="container-nest py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-nest-ink pointer-events-none"></div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative z-10 glass-card p-8 md:p-16 max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUpVariant} className="kicker justify-center inline-flex text-nest-stone before:bg-nest-stone">Ready when you are</motion.div>
          <motion.h2 variants={fadeUpVariant} className="headline-lg mt-8 text-nest-ivory">
            {t("home.cta_title")}<br /><em className="not-italic text-nest-glow font-normal">{t("home.cta_title_em")}</em>
          </motion.h2>
          <motion.div variants={fadeUpVariant} className="mt-12 flex items-center justify-center gap-4 flex-wrap">
            <Link to="/explore" className="btn-primary text-base px-8 py-4" data-testid="cta-explore">Explore rentals <ArrowUpRight size={16} /></Link>
            <Link to="/tour" className="btn-outline text-base px-8 py-4" data-testid="cta-tour">Book a tour <ArrowUpRight size={16} /></Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
