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
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Map · Browse by location</div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-4">
        <h1 className="headline-lg text-nest-char">Where would you<br /><em className="not-italic text-nest-terra font-normal">like to wake up?</em></h1>
        <div className="glass-white rounded-md p-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 min-w-[180px]">
            <Search size={14} className="text-nest-clay" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area or property"
                   className="bg-transparent outline-none py-2 text-[13px] w-full" data-testid="map-search-input" />
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border border-nest-sand py-2 px-2 text-[13px]" data-testid="map-city-select">
            <option>All cities</option>
            <option>Agartala</option>
            <option>Guwahati</option>
            <option>Shillong</option>
          </select>
        </div>
      </div>

      <div className="mt-10 grid lg:grid-cols-[1fr_1.8fr] gap-6">
        {/* List */}
        <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
          <p className="font-mono-sm text-nest-clay">{filtered.length} residence{filtered.length === 1 ? "" : "s"}</p>
          {filtered.map((p) => (
            <button key={p.id} onClick={() => focusOn(p)}
                    className={`w-full text-left p-4 border ${active?.id === p.id ? "border-nest-terra" : "border-nest-sand"} bg-white flex items-center gap-3 transition-colors`}
                    data-testid={`map-item-${p.id}`}>
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
          {filtered.length === 0 && (
            <div className="p-8 border border-dashed border-nest-sand text-body text-center">No residences to plot for this filter.</div>
          )}
        </div>

        {/* Map */}
        <div className="relative border border-nest-sand rounded-md overflow-hidden h-[620px] bg-nest-sand/30">
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
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter target={target} />
            {flyTarget && <FlyTo position={flyTarget} />}
            <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
              {filtered.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={priceIcon(p.monthly_rent)} eventHandlers={{ click: () => setActive(p) }}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <img src={assetUrl(p.cover_image)} alt={p.title} style={{ width: "100%", height: 110, objectFit: "cover", marginBottom: 8 }} />
                      <b style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A1A" }}>{p.title}</b>
                      <div style={{ fontSize: 12, color: "#3A3A3A", marginTop: 2 }}>{p.locality}</div>
                      <div style={{ fontSize: 15, color: "#B76C3D", marginTop: 6 }}>{formatINR(p.monthly_rent)} <small style={{ color: "#3A3A3A" }}>/ month</small></div>
                      <Link to={`/property/${p.id}`} style={{ color: "#B76C3D", fontSize: 12, marginTop: 8, display: "inline-block" }} data-testid={`popup-view-${p.id}`}>View residence →</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>

          {active && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-white border border-nest-sand p-4 shadow-lg z-[400]" data-testid="map-property-card">
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

      <p className="text-body text-[12px] mt-4">Live map powered by OpenStreetMap · Leaflet · Marker clustering enabled around dense neighbourhoods.</p>

      <style>{`
        .nest-price-pin { background: transparent; border: 0; }
        .nest-price-pin-inner { background: #1A1A1A; color: #F7F5F0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; padding: 6px 10px; border-radius: 999px; box-shadow: 0 6px 18px -6px rgba(24,24,24,.35); border: 1px solid #B76C3D; white-space: nowrap; }
        .nest-price-pin-inner::after { content:''; position:absolute; left:50%; bottom:-6px; transform: translateX(-50%); width:0; height:0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #1A1A1A; }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background: rgba(183,108,61,.25) !important; }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div { background: #B76C3D !important; color: #F7F5F0 !important; font-family: 'Plus Jakarta Sans', sans-serif; }
        .leaflet-popup-content-wrapper { border-radius: 4px; }
      `}</style>
    </main>
  );
}
