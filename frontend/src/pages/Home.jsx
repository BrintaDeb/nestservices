import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowUpRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, toApiError } from "../lib/api";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";
import { useToast } from "../components/ToastProvider";
import HeroParallax from "../components/HeroParallax";
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate } from "framer-motion";
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: true, skipSnaps: true, align: "start" });

  // 3D Tilt Logic
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse values for parallax translation
  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  // Translation on axes for flat depth (no shape distortion)
  const x1 = useTransform(mouseX, [-200, 200], [-8, 8]);
  const y1 = useTransform(mouseY, [-200, 200], [-8, 8]);
  
  // iOS Gyro Gloss / Sheen Effect
  const rotateX = useTransform(mouseY, [-200, 200], [2, -2]); // Very subtle 3D tilt
  const rotateY = useTransform(mouseX, [-200, 200], [-2, 2]); // Very subtle 3D tilt
  
  // Map mouse to gradient position (moves opposite to simulate light source)
  const glareX = useTransform(mouseX, [-200, 200], [100, 0]); 
  const glareY = useTransform(mouseY, [-200, 200], [100, 0]);
  
  // Dynamic smooth glossy background
  const background = useMotionTemplate`radial-gradient(120% 120% at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%)`;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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
      
      {/* Hero Section with Cinematic Background */}
      <section className="relative w-full h-screen flex flex-col justify-center overflow-hidden">
        <HeroParallax />
        
        <motion.div 
          className="container-nest relative z-20 mt-16"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative inline-block w-full max-w-4xl"
            variants={fadeUpVariant}
          >
            {/* Moving glass background with iOS gyro sheen */}
            <motion.div 
              className="absolute inset-0 rounded-[32px] border border-white/20 shadow-2xl pointer-events-none"
              style={{ 
                x: x1, 
                y: y1, 
                rotateX, 
                rotateY, 
                background, 
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            />
            
            {/* Fixed text container */}
            <div className="relative z-10 p-10 md:p-14">
              <div className="kicker text-nest-stone before:bg-nest-stone">
                {t("home.hero_kicker")}
              </div>
              <h2 className="headline-lg mt-6 text-white drop-shadow-2xl">
                {t("home.hero_title")} <em className="not-italic text-nest-terra font-normal">{t("home.hero_title_em")}</em>
              </h2>
              
              <div className="mt-10">
                <p className="text-white/80 text-lg mb-8 drop-shadow-md">
                  {t("home.hero_body")}
                </p>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    navigate(searchQuery.trim() ? `/explore?q=${encodeURIComponent(searchQuery.trim())}` : '/explore');
                  }}
                  className="bg-black/40 backdrop-blur-md p-2 flex flex-col md:flex-row gap-2 md:items-center rounded-2xl md:rounded-full shadow-2xl border border-white/10 pointer-events-auto w-full max-w-full overflow-hidden"
                >
                  <div className="flex items-center gap-3 flex-1 px-4 min-w-0">
                    <Search size={18} className="text-white opacity-60 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Try 'Agartala 2 bedroom under ₹20,000'"
                      className="flex-1 min-w-0 bg-transparent outline-none py-3 text-white placeholder:text-white/50"
                      data-testid="home-search-input"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="btn-primary whitespace-nowrap flex-shrink-0 w-full md:w-auto justify-center !rounded-xl md:!rounded-full px-8" 
                    data-testid="home-search-cta"
                  >
                    Search <ArrowUpRight size={14} />
                  </button>
                </form>
              </div>
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
            <motion.h2 variants={fadeUpVariant} className="headline-md mt-4 text-white">Homes to come home to.</motion.h2>
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
          <div className="flex -ml-6">
            {featured.map((p) => (
              <div key={p.id} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 pl-6">
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
            <motion.h2 variants={fadeUpVariant} className="headline-md mt-6 text-white">More than a<br /><em className="not-italic text-nest-terra font-normal">place to live.</em></motion.h2>
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
                  <h3 className="font-display text-[28px] text-white">{t}</h3>
                  <p className="text-white/80 mt-3 text-[16px] max-w-md opacity-80">{d}</p>
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
          <motion.h2 variants={fadeUpVariant} className="headline-lg mt-8 text-white">
            {t("home.cta_title")}<br /><em className="not-italic text-nest-terra font-normal">{t("home.cta_title_em")}</em>
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
