import { Heart, MapPin, Sparkles, ArrowUpRight, BedDouble, Bath, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { assetUrl, formatINR } from "../lib/api";

export default function PropertyCard({ p, wished = false, onToggleWish }) {
  const cover = p.cover_image || (p.images && p.images[0]);
  return (
    <article className="prop-card" data-testid={`property-card-${p.id}`}>
      <div className="prop-media">
        <img src={assetUrl(cover)} alt={p.title} loading="lazy" />
        <button
          className={`absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-black/40 backdrop-blur border border-white/20 ${wished ? "text-nest-terra" : "text-white"}`}
          onClick={(e) => { e.preventDefault(); onToggleWish?.(p.id); }}
          aria-label="Toggle wishlist"
          data-testid={`property-wishlist-${p.id}`}
        >
          <Heart size={16} fill={wished ? "currentColor" : "none"} />
        </button>
        <span className="absolute top-3 left-3 chip !bg-black/50 !text-white !border-white/10 font-mono-sm !text-[10px] !px-3 backdrop-blur-md">Available {p.available_from?.slice(5)}</span>
        <span className="absolute bottom-3 right-3 chip !bg-black/50 !text-white !border-white/10 !text-[11px] backdrop-blur-md"><Sparkles size={12} /> {p.images?.length || 3} photos</span>
      </div>
      <div className="p-4 md:p-5 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 flex-1">
          <div>
            <h3 className="font-display text-[20px] md:text-[22px] leading-tight text-white line-clamp-2" data-testid={`property-title-${p.id}`}>{p.title}</h3>
            <p className="mt-1.5 text-body text-[13px] flex items-center gap-1.5"><MapPin size={13} /> {p.locality}</p>
          </div>
          <div className="text-left sm:text-right mt-1 sm:mt-0 whitespace-nowrap">
            <strong className="font-display text-[18px] text-white">{formatINR(p.monthly_rent)}</strong>
            <small className="block text-body text-[11px]">/ month</small>
          </div>
        </div>

        <div className="hairline mt-4 pt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-body text-[12px]">
          <span className="inline-flex items-center gap-1"><BedDouble size={13} /> {p.bedrooms} bed</span>
          <span className="inline-flex items-center gap-1"><Bath size={13} /> {p.bathrooms} bath</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> {p.furnished}</span>
          <span className="ml-auto text-nest-terra font-mono-sm !text-[10px]">★ {p.rating}</span>
        </div>

        <Link to={`/property/${p.id}`} className="mt-5 inline-flex items-center gap-2 text-[13px] font-display text-nest-terra hover:text-white transition-colors group" data-testid={`view-property-${p.id}`}>
          View residence <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
