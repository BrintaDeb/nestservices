import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/api/notifications").then(({ data }) => setItems(data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const mark = async (id) => { try { await api.post(`/api/notifications/${id}/read`); load(); } catch (_) {} };

  return (
    <main className="container-nest pt-28 pb-20">
      <div className="kicker">Notification center</div>
      <h1 className="headline-lg mt-4 text-nest-char">What's new.</h1>
      <div className="mt-8 space-y-2 max-w-3xl">
        {items.length === 0 && <div className="p-12 border border-dashed border-nest-sand text-center text-body">You're all caught up.</div>}
        {items.map((n) => (
          <div key={n.id} className={`p-4 border border-nest-sand ${n.unread ? "bg-nest-sand/40" : "bg-white"} flex items-center gap-3`} data-testid={`notif-${n.id}`}>
            <div className="flex-1">
              <b className="font-display text-nest-char">{n.title}</b>
              <p className="text-body text-[12px]">{n.body}</p>
            </div>
            {n.unread && <button className="link-underline text-[11px] text-nest-terra" onClick={() => mark(n.id)}>Mark read</button>}
          </div>
        ))}
      </div>
    </main>
  );
}
