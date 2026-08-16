import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-nest-sand">
      <div className="container-nest py-14 grid gap-10 md:grid-cols-4 text-[13px]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 grid place-items-center border border-nest-char text-nest-char font-display">N</span>
            <span className="font-display text-[13px] tracking-[0.24em] uppercase text-nest-char">Nest Services</span>
          </div>
          <p className="text-body mt-4 max-w-xs">Find your nest, secure your space. India's cinematic rental home for renters and landlords.</p>
        </div>
        <div>
          <div className="kicker">Discover</div>
          <ul className="mt-4 space-y-2">
            <li><Link to="/explore" className="link-underline">Explore rentals</Link></li>
            <li><Link to="/map" className="link-underline">Map browser</Link></li>
            <li><Link to="/tour" className="link-underline">Book a tour</Link></li>
            <li><Link to="/wishlist" className="link-underline">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <div className="kicker">Manage</div>
          <ul className="mt-4 space-y-2">
            <li><Link to="/portal" className="link-underline">Resident portal</Link></li>
            <li><Link to="/apply" className="link-underline">Rental application</Link></li>
            <li><Link to="/admin" className="link-underline">Owner console</Link></li>
          </ul>
        </div>
        <div>
          <div className="kicker">Contact</div>
          <ul className="mt-4 space-y-2 text-body">
            <li>Agartala, Tripura</li>
            <li>hello@nestservices.in</li>
            <li>+91 90000 00000</li>
          </ul>
        </div>
      </div>
      <div className="hairline">
        <div className="container-nest py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] font-mono-sm">
          <span>© 2026 Nest Services</span>
          <span>Find your nest — secure your space</span>
          <span>₹ INR</span>
        </div>
      </div>
    </footer>
  );
}
