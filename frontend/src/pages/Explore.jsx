import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, Search, SlidersHorizontal, X } from "lucide-react";
import { api, toApiError } from "../lib/api";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

const PRICE_BANDS = [
  { label: "Any budget", value: "" },
  { label: "Under ₹15,000", value: "15000" },
  { label: "Under ₹25,000", value: "25000" },
  { label: "Under ₹40,000", value: "40000" },
  { label: "Under ₹60,000", value: "60000" },
  { label: "Under ₹1,00,000", value: "100000" },
];

const TYPES = ["All types", "Apartment", "House", "Villa", "Studio", "Independent Floor", "PG"];
const FURNISHED = ["Any", "Furnished", "Semi-furnished", "Unfurnished"];
const PET = ["Any", "Yes", "No"];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [city, setCity] = useState(params.get("city") || "All cities");
  const [type, setType] = useState(params.get("type") || "All types");
  const [maxRent, setMaxRent] = useState(params.get("max") || "");
  const [minRent, setMinRent] = useState(params.get("min") || "");
  const [bedrooms, setBedrooms] = useState(params.get("bed") || "");
  const [furnished, setFurnished] = useState(params.get("furn") || "Any");
  const [pet, setPet] = useState(params.get("pet") || "Any");
  const [moveIn, setMoveIn] = useState(params.get("move") || "");
  const [items, setItems] = useState([]);
  const [wished, setWished] = useState([]);
  const [facets, setFacets] = useState({ cities: ["Agartala", "Guwahati", "Shillong"], types: [] });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    api.get("/api/properties/facets").then(({ data }) => setFacets((f) => ({ ...f, ...data }))).catch(() => {});
  }, []);

  const query = useMemo(() => {
    const p = {};
    if (q) p.q = q;
    if (city && city !== "All cities") p.city = city;
    if (type && type !== "All types") p.property_type = type;
    if (maxRent) p.max_rent = Number(maxRent);
    if (minRent) p.min_rent = Number(minRent);
    if (bedrooms) p.bedrooms = Number(bedrooms);
    if (furnished && furnished !== "Any") p.furnished = furnished;
    if (pet && pet !== "Any") p.pet_friendly = pet === "Yes";
    if (moveIn) p.move_in = moveIn;
    return p;
  }, [q, city, type, maxRent, minRent, bedrooms, furnished, pet, moveIn]);

  useEffect(() => {
    setLoading(true);
    api.get("/api/properties", { params: query })
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // sync url
    const next = Object.fromEntries(Object.entries(query).map(([k, v]) => [k === "property_type" ? "type" : k === "max_rent" ? "max" : k === "min_rent" ? "min" : k === "bedrooms" ? "bed" : k === "furnished" ? "furn" : k === "move_in" ? "move" : k, String(v)]));
    setParams(next, { replace: true });
  }, [query, setParams]);

  useEffect(() => {
    if (user) api.get("/api/wishlist").then(({ data }) => setWished(data.map((x) => x.id))).catch(() => {});
  }, [user]);

  const toggleWish = async (id) => {
    if (!user) return toast.push("Please sign in to save homes.");
    try {
      const { data } = await api.post("/api/wishlist/toggle", { property_id: id });
      setWished((s) => data.wishlisted ? [...new Set([...s, id])] : s.filter((x) => x !== id));
      toast.push(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } catch (e) { toast.push(toApiError(e)); }
  };

  const saveSearch = async () => {
    if (!user) return toast.push("Sign in to save this search.");
    try {
      const name = [city !== "All cities" && city, bedrooms && `${bedrooms}BHK`, maxRent && `under ₹${Number(maxRent).toLocaleString("en-IN")}`].filter(Boolean).join(" · ") || "Custom search";
      const { data } = await api.post("/api/saved-searches", { name, query });
      const suffix = typeof data?.match_count === "number" ? ` · ${data.match_count} match${data.match_count === 1 ? "" : "es"} today` : "";
      toast.push(`Search saved${suffix}. We'll email you when a matching home is listed.`);
    } catch (e) { toast.push(toApiError(e)); }
  };

  return (
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-20">
      <div className="container-nest max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="kicker text-nest-stone before:bg-nest-stone">Curated rentals · India</div>
            <h1 className="headline-lg mt-4 text-white">Homes with a<br /><em className="not-italic text-nest-terra font-normal">point of view.</em></h1>
          </div>
          <p className="text-white/80 max-w-sm text-[14px]">Thoughtfully selected residences in Agartala and beyond. <b className="text-white font-medium">{items.length} residences</b> match your view.</p>
        </div>

        {/* Filter bar */}
        <div className="glass-card p-3 rounded-xl flex flex-wrap gap-3 items-center border border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 bg-black/40 rounded-lg border border-white/5">
            <Search size={16} className="text-nest-stone" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search city, area or property"
                   className="flex-1 bg-transparent outline-none py-3 text-[13px] text-white placeholder:text-nest-stone/70" data-testid="rental-search-input" />
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white appearance-none cursor-pointer outline-none focus:border-nest-terra transition-colors" data-testid="filter-city">
            <option className="bg-nest-ink">All cities</option>
            {facets.cities.map((c) => <option key={c} className="bg-nest-ink">{c}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white appearance-none cursor-pointer outline-none focus:border-nest-terra transition-colors" data-testid="filter-property-type">
            {TYPES.map((t) => <option key={t} className="bg-nest-ink">{t}</option>)}
          </select>
          <select value={maxRent} onChange={(e) => setMaxRent(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white appearance-none cursor-pointer outline-none focus:border-nest-terra transition-colors" data-testid="filter-price">
            {PRICE_BANDS.map((b) => <option key={b.label} value={b.value} className="bg-nest-ink">{b.label}</option>)}
          </select>
          <button className="btn-outline !py-2.5 !px-4 !text-[12px]" onClick={() => setShowFilters(!showFilters)} data-testid="filter-more-button">
            <SlidersHorizontal size={14} /> More filters
          </button>
          <button className="btn-primary !py-2.5 !px-4 !text-[12px]" onClick={saveSearch} data-testid="save-search-button"><Bell size={14} /> Save search</button>
        </div>

        {showFilters && (
          <div className="glass-card mt-4 p-6 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-6 border border-white/10">
            <div>
              <label className="font-mono-sm text-nest-stone block mb-2 opacity-80">Bedrooms</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white w-full appearance-none outline-none focus:border-nest-terra transition-colors" data-testid="filter-bedrooms">
                <option value="" className="bg-nest-ink">Any</option><option value="1" className="bg-nest-ink">1+</option><option value="2" className="bg-nest-ink">2+</option><option value="3" className="bg-nest-ink">3+</option><option value="4" className="bg-nest-ink">4+</option>
              </select>
            </div>
            <div>
              <label className="font-mono-sm text-nest-stone block mb-2 opacity-80">Furnishing</label>
              <select value={furnished} onChange={(e) => setFurnished(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white w-full appearance-none outline-none focus:border-nest-terra transition-colors" data-testid="filter-furnished">
                {FURNISHED.map((f) => <option key={f} className="bg-nest-ink">{f}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono-sm text-nest-stone block mb-2 opacity-80">Pet friendly</label>
              <select value={pet} onChange={(e) => setPet(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-[13px] text-white w-full appearance-none outline-none focus:border-nest-terra transition-colors" data-testid="filter-pet">
                {PET.map((p) => <option key={p} className="bg-nest-ink">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono-sm text-nest-stone block mb-2 opacity-80">Move-in from</label>
              <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-[11px] px-4 text-[13px] text-white w-full outline-none focus:border-nest-terra transition-colors" data-testid="filter-movein" style={{ colorScheme: 'dark' }} />
            </div>
            <button className="btn-outline !py-2 !px-4 !text-[12px] col-span-2 md:col-span-4 justify-center" onClick={() => { setBedrooms(""); setFurnished("Any"); setPet("Any"); setMoveIn(""); setMinRent(""); setMaxRent(""); setType("All types"); setCity("All cities"); setQ(""); }} data-testid="filter-clear-button">
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 mb-6 text-[13px] text-white/70">
          <span>Showing <b className="text-white font-medium">{items.length}</b> residences</span>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="prop-card glass-card">
                <div className="prop-media bg-white/10 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-white/10 animate-pulse w-3/4 rounded-md" />
                  <div className="h-4 bg-white/10 animate-pulse w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-2xl border border-white/5">
            <p className="text-white/70 text-[15px]">No residences match those filters yet. Try widening your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <PropertyCard key={p.id} p={p} wished={wished.includes(p.id)} onToggleWish={toggleWish} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
