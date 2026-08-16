import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowUpRight } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { api, toApiError } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [ids, setIds] = useState([]);
  const toast = useToast();
  const load = () => api.get("/api/wishlist").then(({ data }) => { setItems(data); setIds(data.map((x) => x.id)); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try {
      const { data } = await api.post("/api/wishlist/toggle", { property_id: id });
      toast.push(data.wishlisted ? "Added" : "Removed from wishlist");
      load();
    } catch (e) { toast.push(toApiError(e)); }
  };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Your saved homes</div>
      <h1 className="headline-lg mt-4 text-nest-char">Wishlist.</h1>

      {items.length === 0 ? (
        <div className="mt-16 p-16 border border-dashed border-nest-sand text-center">
          <Heart className="mx-auto mb-3 text-nest-terra" />
          <p className="text-body">You haven't saved any homes yet.</p>
          <Link to="/explore" className="mt-4 inline-flex items-center gap-2 text-nest-terra link-underline">Explore residences <ArrowUpRight size={13} /></Link>
        </div>
      ) : (
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} wished={ids.includes(p.id)} onToggleWish={toggle} />
          ))}
        </div>
      )}
    </main>
  );
}
