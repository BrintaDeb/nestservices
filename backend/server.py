"""Nest Services — FastAPI entry point."""
from __future__ import annotations
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from auth import hash_password, verify_password  # noqa: E402
from db import close_db, get_db  # noqa: E402
from routers.auth_router import router as auth_router  # noqa: E402
from routers.bookings_router import router as bookings_router  # noqa: E402
from routers.engagement_router import router as engagement_router  # noqa: E402
from routers.properties_router import router as properties_router  # noqa: E402
from routers.tenancy_router import router as tenancy_router  # noqa: E402
from routers.uploads_router import router as uploads_router  # noqa: E402
from routers.ai_router import router as ai_router  # noqa: E402

app = FastAPI(title="Nest Services API", version="2.0.0")


# Property seed data — Agartala-focused with a few nearby cities
IMG = {
    "aria": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
    "living": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85",
    "kitchen": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85",
    "bedroom": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85",
    "bath": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1600&q=85",
    "balcony": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=85",
    "villa": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
    "studio": "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=85",
    "facade": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85",
}


def _seed_properties() -> list[dict]:
    now = datetime.now(timezone.utc)
    def make(**kw):
        base = {
            "created_at": now, "updated_at": now, "likes": 0, "comments_count": 0,
            "rating": 4.7, "status": "available", "rules": ["No smoking", "Quiet hours after 10 PM"],
            "video_url": None, "tour_3d_url": None,
        }
        base.update(kw)
        base["cover_image"] = base.get("cover_image") or base["images"][0]
        return base

    return [
        make(title="Ujjayanta Residency", description="A calm three-bedroom home minutes from Ujjayanta Palace with double-height ceilings, a landscaped garden and a private study.",
             property_type="Apartment", city="Agartala", locality="Kunjaban, Agartala",
             monthly_rent=28000, security_deposit=56000, bedrooms=3, bathrooms=3,
             furnished="Furnished", pet_friendly=True, available_from="2026-04-01",
             lat=23.8479, lng=91.2765,
             amenities=["Covered parking", "Power backup", "Modular kitchen", "24x7 water"],
             images=[IMG["aria"], IMG["living"], IMG["kitchen"], IMG["bedroom"], IMG["balcony"]]),
        make(title="Rabindra Bhavan Retreat", description="A quiet two-bedroom home tucked away in a leafy lane, walking distance to Rabindra Bhavan and the College Tilla parks.",
             property_type="Apartment", city="Agartala", locality="College Tilla, Agartala",
             monthly_rent=18000, security_deposit=36000, bedrooms=2, bathrooms=2,
             furnished="Semi-furnished", pet_friendly=False, available_from="2026-03-20",
             lat=23.8341, lng=91.2812,
             amenities=["Lift", "Security", "Balcony", "Piped gas"],
             images=[IMG["living"], IMG["bedroom"], IMG["kitchen"]]),
        make(title="Neermahal Courtyard House", description="A four-bedroom courtyard house designed for family life, with a shaded veranda, outdoor dining, and a caretaker.",
             property_type="House", city="Agartala", locality="Abhoynagar, Agartala",
             monthly_rent=42000, security_deposit=84000, bedrooms=4, bathrooms=4,
             furnished="Furnished", pet_friendly=True, available_from="2026-05-01",
             lat=23.8225, lng=91.2734,
             amenities=["Private garden", "Study", "Solar power", "CCTV"],
             images=[IMG["villa"], IMG["living"], IMG["kitchen"], IMG["bedroom"], IMG["bath"]]),
        make(title="Melarmath Studio", description="A light-filled studio a short walk from the Melarmath market — thoughtfully finished with warm oak and stone.",
             property_type="Studio", city="Agartala", locality="Melarmath, Agartala",
             monthly_rent=12500, security_deposit=25000, bedrooms=1, bathrooms=1,
             furnished="Furnished", pet_friendly=False, available_from="2026-03-10",
             lat=23.8395, lng=91.2833,
             amenities=["WiFi ready", "Co-working lounge", "CCTV"],
             images=[IMG["studio"], IMG["bedroom"], IMG["kitchen"]]),
        make(title="Battala Independent Floor", description="A quiet two-bedroom independent floor with a private terrace over the Battala neighbourhood.",
             property_type="Independent Floor", city="Agartala", locality="Battala, Agartala",
             monthly_rent=22000, security_deposit=44000, bedrooms=2, bathrooms=2,
             furnished="Semi-furnished", pet_friendly=True, available_from="2026-04-15",
             lat=23.8298, lng=91.2887,
             amenities=["Terrace", "Two-wheeler parking", "Piped gas"],
             images=[IMG["facade"], IMG["living"], IMG["balcony"]]),
        make(title="Airport Road Villa", description="A generous three-bedroom villa with a walled garden, ideal for longer stays close to Agartala airport.",
             property_type="Villa", city="Agartala", locality="Airport Road, Agartala",
             monthly_rent=55000, security_deposit=110000, bedrooms=3, bathrooms=3,
             furnished="Furnished", pet_friendly=True, available_from="2026-06-01",
             lat=23.8867, lng=91.2404,
             amenities=["Private garden", "Backup generator", "Caretaker", "Solar water"],
             images=[IMG["villa"], IMG["kitchen"], IMG["balcony"], IMG["bedroom"]]),
        make(title="Guwahati Riverfront Apartment", description="A three-bedroom apartment overlooking the Brahmaputra with river-facing balconies.",
             property_type="Apartment", city="Guwahati", locality="Uzan Bazaar, Guwahati",
             monthly_rent=35000, security_deposit=70000, bedrooms=3, bathrooms=3,
             furnished="Furnished", pet_friendly=True, available_from="2026-04-05",
             lat=26.1836, lng=91.7539,
             amenities=["Concierge", "Gym", "Backup power", "Lift"],
             images=[IMG["aria"], IMG["living"], IMG["kitchen"]]),
        make(title="Shillong Pine House", description="A two-bedroom pine-lined home in the hills, minutes from Ward's Lake.",
             property_type="House", city="Shillong", locality="Laitumkhrah, Shillong",
             monthly_rent=32000, security_deposit=64000, bedrooms=2, bathrooms=2,
             furnished="Furnished", pet_friendly=True, available_from="2026-05-15",
             lat=25.5695, lng=91.8853,
             amenities=["Fireplace", "Wooden interiors", "Garden", "Parking"],
             images=[IMG["villa"], IMG["bedroom"], IMG["living"]]),
    ]


async def _seed_admin_and_user(db):
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "name": "Nest Services Admin",
            "phone": "+91 90000 00000",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password),
                                            "role": "admin"}})

    demo_email = os.environ["DEMO_USER_EMAIL"].lower()
    demo_password = os.environ["DEMO_USER_PASSWORD"]
    existing_user = await db.users.find_one({"email": demo_email})
    if existing_user is None:
        await db.users.insert_one({
            "email": demo_email,
            "name": "Tanya Debbarma",
            "phone": "+91 98000 12345",
            "password_hash": hash_password(demo_password),
            "role": "user",
            "created_at": datetime.now(timezone.utc),
        })
    elif not verify_password(demo_password, existing_user["password_hash"]):
        await db.users.update_one({"email": demo_email},
                                  {"$set": {"password_hash": hash_password(demo_password)}})


@app.on_event("startup")
async def _startup():
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.wishlist.create_index([("user_id", 1), ("property_id", 1)], unique=True)
    await db.login_attempts.create_index("identifier")
    await db.notifications.create_index("user_id")
    await db.properties.create_index("city")
    await db.properties.create_index("monthly_rent")

    if await db.properties.count_documents({}) == 0:
        await db.properties.insert_many(_seed_properties())
    else:
        # Backfill lat/lng and status for previously-seeded properties (idempotent)
        for seed in _seed_properties():
            await db.properties.update_one(
                {"title": seed["title"], "city": seed["city"], "$or": [{"lat": {"$exists": False}}, {"lat": None}]},
                {"$set": {"lat": seed.get("lat"), "lng": seed.get("lng")}},
            )

    await _seed_admin_and_user(db)


@app.on_event("shutdown")
async def _shutdown():
    close_db()


# Health
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "nest-services", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/")
async def root():
    return {"message": "Nest Services API — find your nest, secure your space."}


# Register routers
app.include_router(auth_router)
app.include_router(properties_router)
app.include_router(uploads_router)
app.include_router(bookings_router)
app.include_router(engagement_router)
app.include_router(tenancy_router)
app.include_router(ai_router)


# CORS — same-origin via ingress. Allow explicit origin so credentials cookies work.
_frontend_origin = os.environ.get("FRONTEND_URL")
_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
if _frontend_origin:
    allow_origins = [_frontend_origin]
elif _origins_env and _origins_env != "*":
    allow_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]
else:
    # Wildcard is fine here because the browser sees frontend + backend on the same
    # origin via ingress; cross-origin credentialed calls are not required in production.
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=(allow_origins != ["*"]),
    allow_methods=["*"],
    allow_headers=["*"],
)
