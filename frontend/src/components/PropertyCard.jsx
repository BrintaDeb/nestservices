import { Heart, MapPin, Sparkles, ArrowUpRight, BedDouble, Bath, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { assetUrl, formatINR } from "../lib/api";

export default function PropertyCard({ p, wished = false, onToggleWish }) {
  const cover = p.cover_image || (p.images && p.images[0]);
  return (
    <article className="prop-card" data-testid={`property-card-${p.id}`}>
      <div className="prop-media">
        <img src={assetUrl(cover)} alt={p.title} loading="lazy" />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <span className="inline-flex items-center bg-black/40 text-white border border-white/10 font-mono-sm text-[10px] py-1.5 px-3 rounded-md backdrop-blur-md shadow-sm uppercase tracking-widest pointer-events-auto">
            Avail {p.available_from?.slice(5)}
          </span>
          <button
            className={`w-9 h-9 grid place-items-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 transition-all hover:bg-black/60 hover:scale-105 pointer-events-auto ${wished ? "text-nest-terra" : "text-white"}`}
            onClick={(e) => { e.preventDefault(); onToggleWish?.(p.id); }}
            aria-label="Toggle wishlist"
            data-testid={`property-wishlist-${p.id}`}
          >
            <Heart size={16} fill={wished ? "currentColor" : "none"} />
          </button>
        </div>
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-black/40 text-white border border-white/10 font-display text-[11px] py-1.5 px-3 rounded-md backdrop-blur-md shadow-sm">
          <Sparkles size={12} className="opacity-70" /> {p.images?.length || 3} photos
        </span>
      </div>
      <div className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-[22px] leading-tight text-white line-clamp-2" data-testid={`property-title-${p.id}`}>{p.title}</h3>
              <p className="mt-2 text-body text-[13px] flex items-center gap-1.5 opacity-80"><MapPin size={14} /> {p.locality}</p>
            </div>
            <div className="text-right whitespace-nowrap">
              <strong className="font-display text-[20px] text-white">{formatINR(p.monthly_rent)}</strong>
              <small className="block text-body text-[11px] opacity-60">/ month</small>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-body text-[13px] opacity-90">
            <span className="flex items-center gap-1.5"><BedDouble size={14} className="opacity-60" /> {p.bedrooms}</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-1.5"><Bath size={14} className="opacity-60" /> {p.bathrooms}</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="opacity-60" /> {p.furnished}</span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
          <Link to={`/property/${p.id}`} className="inline-flex items-center gap-2 text-[13px] font-display text-white hover:text-nest-terra transition-colors group tracking-wide" data-testid={`view-property-${p.id}`}>
            View residence <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <span className="flex items-center gap-1 text-nest-terra font-mono-sm text-[12px] bg-nest-terra/10 px-2 py-1 rounded">
            ★ {p.rating}
          </span>
        </div>
      </div>
    </article>
  );
}
