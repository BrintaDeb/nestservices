import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const scenes = [
  {
    id: "exterior",
    num: "01",
    label: "Exterior",
    title: "Arrive somewhere considered.",
    body: "The approach — pale stone, softened lines, mid-morning light. A first step that already feels different.",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=90",
  },
  {
    id: "entrance",
    num: "02",
    label: "Entrance",
    title: "Cross the threshold.",
    body: "A quiet foyer with warm oak, brushed brass and space to set the day down.",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=90",
  },
  {
    id: "living",
    num: "03",
    label: "Living Room",
    title: "Room to gather, room to breathe.",
    body: "North light, linen drapes, and shelves ready to hold a life. This is where the day begins to slow.",
    img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=90",
  },
  {
    id: "dining",
    num: "04",
    label: "Dining Room",
    title: "A long table, longer conversations.",
    body: "A dining space designed for repeats — Sunday lunches, workday mornings, quiet celebrations.",
    img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=2000&q=90",
  },
  {
    id: "kitchen",
    num: "05",
    label: "Kitchen",
    title: "Rituals made simple.",
    body: "A working kitchen with honest surfaces — modular, sunlit, and quietly generous.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90",
  },
  {
    id: "bedroom",
    num: "06",
    label: "Bedroom",
    title: "A quieter kind of luxury.",
    body: "Muted linens, warm floors, and a window that opens to the morning.",
    img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=90",
  },
  {
    id: "balcony",
    num: "07",
    label: "Balcony",
    title: "The view from home.",
    body: "A balcony that turns the day's noise into a breeze — a small ceremony of coming home.",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=90",
  },
];

export default function Walkthrough() {
  const shellRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // preload
    scenes.forEach((s) => { const i = new Image(); i.src = s.img; });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = shellRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      setProgress(p);
      const idx = Math.min(scenes.length - 1, Math.floor(p * scenes.length));
      setIndex(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onMouse = (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    setMouse({ x: (e.clientX / w) * 100, y: (e.clientY / h) * 100 });
  };

  const current = scenes[index];
  const sceneProgress = (progress * scenes.length) - index;

  return (
    <section ref={shellRef} className="walkthrough-shell" id="walkthrough" data-testid="walkthrough">
      <div className="walkthrough-sticky" onMouseMove={onMouse}>
        {scenes.map((s, i) => {
          const active = i === index;
          const parallaxX = active ? (mouse.x - 50) * -0.05 : 0;
          const parallaxY = active ? (mouse.y - 50) * -0.05 : 0;
          const scale = active ? 1 + (sceneProgress * 0.08) : 1.03;
          return (
            <div key={s.id} className={`room-plate ${active ? "active" : ""}`} aria-hidden={!active}>
              <img
                className="room-img"
                src={s.img}
                alt={s.label}
                style={{
                  transform: `translate3d(${parallaxX}%, ${parallaxY}%, 0) scale(${scale})`,
                  transition: "opacity 900ms ease, transform 1400ms cubic-bezier(.22,.61,.36,1)",
                  filter: "saturate(.85) contrast(1.05)",
                }}
              />
              <div className="room-tint" />
              <div className="room-vignette" />
            </div>
          );
        })}

        <div className="room-caption" data-testid={`walkthrough-scene-${current.id}`} key={current.id}>
          <div className="num">{current.num} / {String(scenes.length).padStart(2, "0")} — {current.label.toUpperCase()}</div>
          <h2 className="animate-fade-up">{current.title}</h2>
          <p className="animate-fade-up" style={{ animationDelay: ".18s" }}>{current.body}</p>
          {index >= scenes.length - 1 && (
            <div className="mt-8 animate-fade-up" style={{ animationDelay: ".3s" }}>
              <Link to="/explore" className="btn-primary" data-testid="walkthrough-cta">
                Explore all residences <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <div className="rail" aria-hidden>
          {scenes.map((s, i) => (
            <div key={s.id} className={`rail-row ${i === index ? "active" : ""}`}>
              <span>{s.label}</span>
              <span className={`dot ${i === index ? "active" : ""}`} />
            </div>
          ))}
        </div>

        <div className="scene-progress" aria-hidden>
          <i style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="absolute left-8 top-6 z-[3] text-white/85 font-mono-sm">
          Nest / Cinematic walkthrough
        </div>
        <div className="absolute right-8 top-6 z-[3] text-white/70 text-[11px] font-display hidden md:flex items-center gap-2">
          Scroll to move through the home <ChevronDown size={13} />
        </div>
      </div>
    </section>
  );
}
