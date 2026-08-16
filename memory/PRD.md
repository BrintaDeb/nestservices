# Nest Services PRD

## Original problem statement
Build Nest Services — a premium, cinematic, mobile-first Indian rental marketplace and tenant/landlord management platform. Combines a scroll-driven 3D property experience, a marketplace, and a tenant + landlord management system. Later upgraded (Phase 2) into a fully database-backed, role-authenticated platform focused on Agartala, Tripura.

## Architecture decisions
- **Backend**: FastAPI (preserved, not migrated) + MongoDB via `motor` async driver. Modularised into routers (`auth`, `properties`, `uploads`, `bookings`, `engagement`, `tenancy`).
- **Auth**: bcrypt password hashing + JWT access/refresh tokens. Set as HttpOnly `SameSite=None` cookies AND returned in JSON body for Bearer-based automated testing. Brute-force lockout keyed on both `real_ip:email` and `email:` (behind `X-Forwarded-For`).
- **RBAC**: `visitor`, `user`, `admin` roles. Route-level `require_admin` dependency.
- **Storage**: Local disk uploads under `/app/backend/uploads`, served via `/api/uploads/file/{name}` — Cloudinary-ready contract.
- **Frontend**: React + React Router + Tailwind + Lenis smooth scroll + custom parallax cinematic walkthrough (7 rooms). Auth context with axios `withCredentials` and Bearer fallback.
- **Design**: Premium **light architectural** theme — ivory (`#F7F5F0`), white surface (`#FFFFFF`), sand (`#E8E1D3`), charcoal (`#1A1A1A`), terra (`#B76C3D`). Fonts: Plus Jakarta Sans (display), Inter (body), JetBrains Mono (kickers). No dark/gold aesthetic remains.
- **Payments**: Explicitly removed. Rent displayed as read-only info only.

## User personas
- Visitor: browse rentals, search, view map, read details.
- Renter/tenant (user role): save wishlist, comment, save searches, receive alerts, schedule tours, apply, upload docs, submit maintenance, message.
- Landlord/Admin (admin role): manage listings, applications, tours, users, maintenance, analytics.

## Core requirements (static)
- Cinematic scroll walkthrough Exterior→Entrance→Living→Dining→Kitchen→Bedroom→Balcony
- Mobile-first responsive UI with reduced-motion support
- Property listings with images/amenities/rules, filtering by city/type/price/bedrooms/furnishing/pet/move-in
- Wishlist, saved searches, comments, share, notifications
- Tour booking with slot availability & duplicate protection
- Digital rental application with document upload + explicit screening consent
- Maintenance request workflow with status pipeline
- Admin dashboard: property CRUD (with image upload/cover/reorder), user & application management
- INR (₹) formatting; no payment integrations

## Implemented (2026-08-16 — Phase 2)
- Rewrote FastAPI backend into modular routers under `/api/*`
- MongoDB persistence with indexes (users.email unique, wishlist compound, properties city+rent)
- Real bcrypt/JWT auth with cookies + Bearer + brute-force lockout (X-Forwarded-For aware)
- Seeded 8 curated properties (6 Agartala + Guwahati + Shillong) + Admin + Demo tenant
- Uploads endpoint for images and documents, with size/extension validation
- Full frontend redesign: light architectural theme, Plus Jakarta Sans + Inter typography, glass-white nav, cinematic 7-scene scroll walkthrough with rail + progress bar
- Removed all payment UI
- Pages: Home, Explore (with smart filters), Property Detail, Login/Register, Resident Portal (Overview/Wishlist/Tours/Applications/Maintenance/Notifications), Admin Dashboard, Apply, Book Tour, Wishlist, Map (visual pin browser), Contact, About, Notifications
- 26/26 backend tests passing; core frontend flows verified via testing agent

## Prioritized backlog (P2)
- Real map provider (Leaflet + OpenStreetMap tiles) — placeholder ready
- Internal messaging inbox (tenant ↔ landlord ↔ admin)
- E-signature integration + tenant screening provider consent flow
- Email/SMS/WhatsApp alerts for saved searches (WhatsApp button already live)
- CSV/Excel export for accounting section
- SEO meta enrichment + structured data

## Next tasks (post-Phase 2)
- Add Leaflet map integration when tile provider selected
- Add internal messaging endpoints and inbox UI
- Wire saved-search alerts to a background job

## Test credentials
- Admin: `admin@nestservices.in` / `Nest@Admin2026`
- Demo tenant: `tanya@nestservices.in` / `Tanya@2026`
