# Nest Services MVP PRD

## Original problem statement
Build Nest Services, a premium cinematic mobile-first Indian rental marketplace and tenant-management platform combining a scroll-driven property experience, rental marketplace, and lightweight tenant/landlord management.

## Architecture decisions
- React frontend with React Router and CSS-based cinematic scroll scenes for a lightweight, reliable MVP.
- FastAPI backend with MongoDB through the protected MONGO_URL and seeded listing data.
- INR formatting throughout; demo-only login and payment UI to preserve the 10-credit budget.
- Local browser previews for landlord image uploads; sensitive screening and document providers remain integration-ready.

## User personas
- Visitor: discovers homes, filters listings, views map-ready/property details, and contacts Nest Services.
- Renter/tenant: saves homes, books tours, applies, pays demo rent, and tracks maintenance.
- Landlord: reviews portfolio metrics, listings, occupancy, and local image uploads.
- Admin: platform operations, moderation, and future workflow management.

## Core requirements (static)
- Cinematic walkthrough, mobile responsiveness, premium black/gold glass UI, rental listings, INR prices, filters, property details, wishlist, likes/share affordances, tours, portals, maintenance, notifications, WhatsApp, demo checkout, landlord/admin views.

## Implemented (2026-08-15)
- Built homepage with scroll-driven room scenes, parallax mouse movement, reduced-motion support, responsive navigation, and CTA.
- Added seeded Indian rentals, search/filter controls, property gallery modal, wishlist state, tour booking API, resident portal, admin metrics, and local upload previews with cover/delete controls.
- Added FastAPI listing, booking, maintenance, contact, and notification endpoints with MongoDB-safe projections.
- Verified API responses, production build, responsive screenshot flow, tour form state, and no mobile overflow.

## Prioritized backlog
- P0: Replace demo login with secure role-based authentication and private document access.
- P1: Persist wishlist, comments, likes, saved searches, notifications, maintenance updates, and landlord listing edits per account.
- P1: Connect hosted/tokenized India payment gateway and certified e-sign provider when credentials are available.
- P2: Add Mapbox/OpenStreetMap markers, email/WhatsApp alerts, screening provider consent flow, and CSV accounting export.

## Next tasks
- Add real session/account persistence and protected portal routes.
- Finish upload persistence and secure document storage.
- Add provider-backed payments and e-signature only after integration selection.
