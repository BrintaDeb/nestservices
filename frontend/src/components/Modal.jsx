import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, children, size = "md", testId }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  const maxW = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" }[size] || "max-w-2xl";
  return (
    <div className="overlay" onClick={onClose} data-testid={testId}>
      <div className={`sheet w-full ${maxW} relative`} onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 z-10 btn-ghost" onClick={onClose} aria-label="Close" data-testid="close-modal">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
