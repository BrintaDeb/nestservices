import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return (
    <div className="min-h-[80vh] grid place-items-center">
      <div className="text-body font-mono-sm">Loading…</div>
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
