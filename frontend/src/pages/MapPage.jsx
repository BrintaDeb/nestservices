import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { api, assetUrl, formatINR } from "../lib/api";

// Fix default Leaflet marker icon URLs for webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const priceIcon = (price) =>
  L.divIcon({
    className: "nest-price-pin",
    html: `<div class="nest-price-pin-inner"><span>₹${Math.round(price / 1000)}K</span></div>`,
    iconSize: [64, 30],
    iconAnchor: [32, 30],
    popupAnchor: [0, -28],
  });

const CITY_CENTERS = {
  Agartala: { center: [23.8315, 91.2868], zoom: 12 },
  Guwahati: { center: [26.1836, 91.7539], zoom: 12 },
  Shillong: { center: [25.5695, 91.8853], zoom: 12 },
};

function Recenter({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.center) map.setView(target.center, target.zoom ?? 13, { animate: true });
  }, [target, map]);
  return null;
}

function FlyTo({ position, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 0.9 });
  }, [position, zoom, map]);
  return null;
}

export default function MapPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [city, setCity] = useState("Agartala");
  const [q, setQ] = useState("");
  const mapKey = useRef(0);

  useEffect(() => {
    api.get("/api/properties").then(({ data }) => setItems(data)).catch(() => setItems([]));
  }, []);

  const withCoords = useMemo(() => items.filter((p) => typeof p.lat === "number" && typeof p.lng === "number"), [items]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return withCoords.filter((p) => {
      if (city !== "All cities" && p.city !== city) return false;
      if (!term) return true;
      return [p.title, p.locality, p.city].some((v) => (v || "").toLowerCase().includes(term));
    });
  }, [withCoords, city, q]);

  const target = CITY_CENTERS[city] || { center: [23.8315, 91.2868], zoom: 11 };

  const focusOn = (p) => {
    setActive(p);
    setFlyTarget([p.lat, p.lng]);
  };

  return (
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-20">
      <div className="container-nest">
        <div className="kicker text-nest-stone before:bg-nest-stone">Map · Browse by location</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-4">
          <h1 className="headline-lg text-white">Where would you<br /><em className="not-italic text-nest-terra font-normal">like to wake up?</em></h1>
          <div className="glass-card rounded-md p-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 min-w-[180px]">
              <Search size={14} className="text-nest-stone" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area or property"
                     className="bg-transparent outline-none py-2 text-[13px] w-full text-white placeholder-nest-stone/60" data-testid="map-search-input" />
            </div>
            <select value={city} onChange={(e) => setCity(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded py-2 px-3 text-[13px] text-white focus:outline-none appearance-none" data-testid="map-city-select">
              <option className="bg-nest-ink">All cities</option>
              <option className="bg-nest-ink">Agartala</option>
              <option className="bg-nest-ink">Guwahati</option>
              <option className="bg-nest-ink">Shillong</option>
            </select>
          </div>
        </div>

        <div className="mt-12 grid lg:grid-cols-[1fr_1.8fr] gap-8">
          {/* List */}
          <div className="space-y-4 max-h-[620px] overflow-auto pr-2 custom-scrollbar">
            <p className="font-mono-sm text-nest-stone opacity-80">{filtered.length} residence{filtered.length === 1 ? "" : "s"}</p>
            {filtered.map((p) => (
              <button key={p.id} onClick={() => focusOn(p)}
                      className={`w-full text-left p-4 rounded-xl border ${active?.id === p.id ? "border-nest-terra bg-white/10" : "glass-card border-white/10"} flex items-center gap-4 transition-colors hover:border-white/20`}
                      data-testid={`map-item-${p.id}`}>
                <img src={assetUrl(p.cover_image)} alt={p.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <b className="font-display text-white text-[15px]">{p.title}</b>
                  <div className="text-body text-[12px] opacity-80 mt-1"><MapPin size={11} className="inline opacity-60 mr-1" /> {p.locality}</div>
                </div>
                <div className="text-right">
                  <b className="text-nest-terra text-[14px]">{formatINR(p.monthly_rent)}</b>
                  <div className="text-body text-[11px] opacity-60">/ month</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 border border-dashed border-white/20 rounded-xl text-body text-center opacity-70">No residences to plot for this filter.</div>
            )}
          </div>

          {/* Map */}
          <div className="relative border border-white/10 rounded-2xl overflow-hidden h-[620px] bg-black/40">
            <MapContainer
              key={mapKey.current}
              center={target.center}
              zoom={target.zoom}
              className="h-full w-full"
              scrollWheelZoom={true}
              data-testid="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <Recenter target={target} />
              {flyTarget && <FlyTo position={flyTarget} />}
              <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
                {filtered.map((p) => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={priceIcon(p.monthly_rent)} eventHandlers={{ click: () => setActive(p) }}>
                    <Popup>
                      <div style={{ minWidth: 200 }}>
                        <img src={assetUrl(p.cover_image)} alt={p.title} style={{ width: "100%", height: 110, objectFit: "cover", marginBottom: 8, borderRadius: 4 }} />
                        <b style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A1A", fontSize: "14px" }}>{p.title}</b>
                        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{p.locality}</div>
                        <div style={{ fontSize: 15, color: "#E57B55", marginTop: 6, fontWeight: "600" }}>{formatINR(p.monthly_rent)} <small style={{ color: "#777", fontWeight: "400" }}>/ month</small></div>
                        <Link to={`/property/${p.id}`} style={{ color: "#E57B55", fontSize: 13, marginTop: 8, display: "inline-block", textDecoration: "underline" }} data-testid={`popup-view-${p.id}`}>View residence →</Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>

            {active && (
              <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-80 glass-card p-4 z-[400] shadow-2xl rounded-xl border border-white/20" data-testid="map-property-card">
                <div className="flex gap-4">
                  <img src={assetUrl(active.cover_image)} alt={active.title} className="w-24 h-24 rounded-lg object-cover" />
                  <div className="flex-1 flex flex-col justify-center">
                    <b className="font-display text-white text-[15px] leading-tight">{active.title}</b>
                    <div className="text-body text-[12px] opacity-80 mt-1">{active.locality}</div>
                    <div className="text-nest-terra font-display text-[16px] mt-2">{formatINR(active.monthly_rent)}<small className="text-body text-[10px] opacity-80">/mo</small></div>
                    <Link to={`/property/${active.id}`} className="text-nest-terra text-[12px] hover:text-white transition-colors mt-2 inline-flex items-center gap-1 group">View residence <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-body text-[12px] mt-6 opacity-60">Live map powered by OpenStreetMap · Leaflet · Marker clustering enabled around dense neighbourhoods.</p>
      </div>

      <style>{`
        .nest-price-pin { background: transparent; border: 0; }
        .nest-price-pin-inner { background: #101216; color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 6px 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; backdrop-filter: blur(8px); }
        .nest-price-pin-inner::after { content:''; position:absolute; left:50%; bottom:-5px; transform: translateX(-50%); width:0; height:0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #101216; }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background: rgba(229,123,85,.3) !important; }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div { background: #E57B55 !important; color: #fff !important; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; border: 2px solid rgba(255,255,255,0.8); }
        .leaflet-popup-content-wrapper { border-radius: 8px; padding: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
        .leaflet-popup-tip { box-shadow: none; }
        /* Custom scrollbar for list */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </main>
  );
}
