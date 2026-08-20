import { Link } from "react-router-dom";
import { useSettings } from "../lib/settings";

export default function Footer() {
  const { t } = useSettings();
  return (
    <footer className="mt-24 border-t border-white/10 bg-nest-ink text-white relative z-20">
      <div className="container-nest py-14 grid gap-10 md:grid-cols-4 text-[13px]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 grid place-items-center border border-white/40 text-white font-display rounded-sm shadow-sm bg-white/5">N</span>
            <span className="font-display text-[13px] tracking-[0.24em] uppercase text-white">{t("brand.name")}</span>
          </div>
          <p className="text-body mt-4 max-w-xs">{t("footer.about")}</p>
        </div>
        <div>
          <div className="kicker text-nest-stone before:bg-nest-stone">Discover</div>
          <ul className="mt-4 space-y-2 opacity-80">
            <li><Link to="/explore" className="link-underline hover:text-white transition-colors">Explore rentals</Link></li>
            <li><Link to="/map" className="link-underline hover:text-white transition-colors">Map browser</Link></li>
            <li><Link to="/tour" className="link-underline hover:text-white transition-colors">Book a tour</Link></li>
            <li><Link to="/wishlist" className="link-underline hover:text-white transition-colors">Wishlist</Link></li>
            <li><Link to="/terms" className="link-underline hover:text-white transition-colors text-nest-terra font-medium">Legal & Trust</Link></li>
          </ul>
        </div>
        <div>
          <div className="kicker text-nest-stone before:bg-nest-stone">Manage</div>
          <ul className="mt-4 space-y-2 opacity-80">
            <li><Link to="/portal" className="link-underline hover:text-white transition-colors">Resident portal</Link></li>
            <li><Link to="/apply" className="link-underline hover:text-white transition-colors">Rental application</Link></li>
            <li><Link to="/admin" className="link-underline hover:text-white transition-colors">Owner console</Link></li>
          </ul>
        </div>
        <div>
          <div className="kicker text-nest-stone before:bg-nest-stone">Contact</div>
          <ul className="mt-4 space-y-2 text-body opacity-80">
            <li>{t("contact.address")}</li>
            <li>{t("contact.email")}</li>
            <li>{t("contact.phone")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/40">
        <div className="container-nest py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] font-mono-sm text-body">
          <span>{t("footer.copyright")}</span>
          <span>{t("brand.tagline")}</span>
          <span>₹ INR · IST</span>
        </div>
      </div>
    </footer>
  );
}
