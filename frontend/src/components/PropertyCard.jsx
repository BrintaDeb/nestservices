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
          className={`absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/80 backdrop-blur border border-nest-sand ${wished ? "text-nest-terra" : "text-nest-char"}`}
          onClick={(e) => { e.preventDefault(); onToggleWish?.(p.id); }}
          aria-label="Toggle wishlist"
          data-testid={`property-wishlist-${p.id}`}
        >
          <Heart size={16} fill={wished ? "currentColor" : "none"} />
        </button>
        <span className="absolute top-3 left-3 chip !bg-white/90 font-mono-sm !text-[10px] !px-3">Available {p.available_from?.slice(5)}</span>
        <span className="absolute bottom-3 right-3 chip !bg-white/90 !text-[11px]"><Sparkles size={12} /> {p.images?.length || 3} photos</span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[22px] leading-tight text-nest-char" data-testid={`property-title-${p.id}`}>{p.title}</h3>
            <p className="mt-1 text-body text-[13px] flex items-center gap-1.5"><MapPin size={13} /> {p.locality}</p>
          </div>
          <div className="text-right">
            <strong className="font-display text-[18px] text-nest-char">{formatINR(p.monthly_rent)}</strong>
            <small className="block text-body text-[11px]">/ month</small>
          </div>
        </div>

        <div className="hairline mt-4 pt-4 flex items-center gap-4 text-body text-[12px]">
          <span className="inline-flex items-center gap-1"><BedDouble size={13} /> {p.bedrooms} bed</span>
          <span className="inline-flex items-center gap-1"><Bath size={13} /> {p.bathrooms} bath</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> {p.furnished}</span>
          <span className="ml-auto text-nest-terra font-mono-sm !text-[10px]">★ {p.rating}</span>
        </div>

        <Link to={`/property/${p.id}`} className="mt-4 inline-flex items-center gap-2 text-[12px] font-display text-nest-terra link-underline" data-testid={`view-property-${p.id}`}>
          View residence <ArrowUpRight size={13} />
        </Link>
      </div>
    </article>
  );
}
