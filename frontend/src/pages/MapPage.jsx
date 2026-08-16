import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight } from "lucide-react";
import { api, assetUrl, formatINR } from "../lib/api";

export default function MapPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => { api.get("/api/properties").then(({ data }) => setItems(data)).catch(() => {}); }, []);

  // Simple pseudo-map: place pins on a stylised grid based on city
  const CITY_POINTS = {
    "Agartala": { x: 62, y: 45 },
    "Guwahati": { x: 30, y: 30 },
    "Shillong": { x: 40, y: 55 },
  };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Map · Browse by location</div>
      <h1 className="headline-lg mt-4 text-nest-char">Where would you<br /><em className="not-italic text-nest-terra font-normal">like to wake up?</em></h1>

      <div className="mt-10 grid lg:grid-cols-[1fr_1.6fr] gap-6">
        <div className="space-y-3 max-h-[560px] overflow-auto">
          {items.map((p) => (
            <button key={p.id} onClick={() => setActive(p)} className={`w-full text-left p-4 border ${active?.id === p.id ? "border-nest-terra" : "border-nest-sand"} bg-white flex items-center gap-3`} data-testid={`map-item-${p.id}`}>
              <img src={assetUrl(p.cover_image)} alt={p.title} className="w-16 h-14 object-cover" />
              <div className="flex-1">
                <b className="font-display text-nest-char text-[14px]">{p.title}</b>
                <div className="text-body text-[12px]"><MapPin size={11} className="inline" /> {p.locality}</div>
              </div>
              <div className="text-right">
                <b className="text-nest-terra text-[13px]">{formatINR(p.monthly_rent)}</b>
                <div className="text-body text-[10px]">/ month</div>
              </div>
            </button>
          ))}
        </div>

        <div className="relative bg-nest-sand/40 border border-nest-sand min-h-[560px] overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30" aria-hidden>
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#B8AFA0" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            <path d="M 5 60 Q 30 50 50 55 T 95 45" stroke="#8A7458" strokeWidth="0.3" fill="none" />
            <path d="M 10 20 Q 40 30 60 25 T 90 35" stroke="#8A7458" strokeWidth="0.3" fill="none" />
          </svg>
          {items.map((p) => {
            const pt = CITY_POINTS[p.city] || { x: 50 + ((p.id.charCodeAt(0) || 0) % 40) - 20, y: 40 + ((p.id.charCodeAt(1) || 0) % 30) };
            return (
              <button key={p.id} onClick={() => setActive(p)} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${pt.x}%`, top: `${pt.y}%` }} data-testid={`map-pin-${p.id}`}>
                <span className={`block w-3 h-3 rounded-full ${active?.id === p.id ? "bg-nest-terra scale-150" : "bg-nest-char"} shadow-lg transition-transform`} />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 border border-nest-sand px-2 py-1 text-[10px] font-mono-sm opacity-0 group-hover:opacity-100 transition-opacity">{p.title}</span>
              </button>
            );
          })}

          {active && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-white border border-nest-sand p-4 shadow-lg" data-testid="map-property-card">
              <div className="flex gap-3">
                <img src={assetUrl(active.cover_image)} alt={active.title} className="w-24 h-20 object-cover" />
                <div className="flex-1">
                  <b className="font-display text-nest-char">{active.title}</b>
                  <div className="text-body text-[12px]">{active.locality}</div>
                  <div className="text-nest-terra font-display text-[16px] mt-1">{formatINR(active.monthly_rent)}<small className="text-body text-[10px]">/mo</small></div>
                  <Link to={`/property/${active.id}`} className="text-nest-terra text-[12px] link-underline mt-1 inline-block">View residence <ArrowUpRight size={11} className="inline" /></Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-body text-[12px] mt-4">Interactive placeholder — ready to connect to Google Maps / Mapbox / OpenStreetMap when API credentials are added.</p>
    </main>
  );
}
