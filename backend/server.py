from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Optional
import os, uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
app = FastAPI(title="Nest Services API")
api = APIRouter(prefix="/api")

IMAGES = {
    "skyline": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    "living": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    "kitchen": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    "bedroom": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
}

class Listing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    location: str
    city: str
    rent: int
    deposit: int
    type: str
    bedrooms: int
    bathrooms: int
    furnished: str
    pet_friendly: bool
    available: str
    rating: float = 4.8
    likes: int = 0
    comments: int = 0
    image: str
    images: list[str] = []
    amenities: list[str] = []
    description: str = ""
    owner: str = "Nest Services"

class Booking(BaseModel):
    listing_id: str
    date: str
    time: str
    name: str
    phone: str

class Maintenance(BaseModel):
    property: str
    category: str
    title: str
    description: str
    priority: str

class Contact(BaseModel):
    name: str
    email: str
    subject: str
    message: str

async def seed():
    if await db.listings.count_documents({}) == 0:
        rows = [
            Listing(title="The Aria Residence", location="Alipore, Kolkata", city="Kolkata", rent=42000, deposit=84000, type="Apartment", bedrooms=3, bathrooms=3, furnished="Furnished", pet_friendly=True, available="2026-04-01", image=IMAGES["living"], images=[IMAGES["living"], IMAGES["kitchen"], IMAGES["bedroom"]], amenities=["Concierge", "Private parking", "Gym", "Power backup"], description="A light-filled, fully furnished residence with considered materials and a quiet garden outlook."),
            Listing(title="Cedar House", location="Indiranagar, Bengaluru", city="Bengaluru", rent=68000, deposit=136000, type="House", bedrooms=4, bathrooms=4, furnished="Semi-furnished", pet_friendly=True, available="2026-03-15", image=IMAGES["skyline"], images=[IMAGES["skyline"], IMAGES["kitchen"], IMAGES["living"]], amenities=["Private garden", "Study", "Solar power", "Security"], description="A contemporary family home close to the best of Indiranagar, designed for slower mornings and longer stays."),
            Listing(title="Mysa Studio", location="Hauz Khas, New Delhi", city="New Delhi", rent=25000, deposit=50000, type="Studio", bedrooms=1, bathrooms=1, furnished="Furnished", pet_friendly=False, available="2026-05-01", image=IMAGES["bedroom"], images=[IMAGES["bedroom"], IMAGES["living"]], amenities=["Co-working lounge", "Lift", "WiFi ready", "CCTV"], description="A refined studio with warm wood, generous light, and a community that feels like home."),
            Listing(title="Solara Villa", location="Assagao, Goa", city="Goa", rent=95000, deposit=190000, type="Villa", bedrooms=3, bathrooms=3, furnished="Furnished", pet_friendly=True, available="2026-06-01", image=IMAGES["kitchen"], images=[IMAGES["kitchen"], IMAGES["living"], IMAGES["skyline"]], amenities=["Pool", "Outdoor dining", "Caretaker", "Backup generator"], description="An indoor-outdoor villa for extended stays, with a private pool and a calm tropical rhythm."),
        ]
        await db.listings.insert_many([x.model_dump() for x in rows])

@app.on_event("startup")
async def startup(): await seed()

@api.get("/")
async def root(): return {"message": "Nest Services is ready"}

@api.get("/listings", response_model=list[Listing])
async def listings(q: Optional[str] = None, city: Optional[str] = None, max_rent: Optional[int] = None, property_type: Optional[str] = None, bedrooms: Optional[int] = None):
    query: dict[str, Any] = {}
    if q: query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"location": {"$regex": q, "$options": "i"}}, {"city": {"$regex": q, "$options": "i"}}]
    if city and city != "All cities": query["city"] = city
    if max_rent: query["rent"] = {"$lte": max_rent}
    if property_type and property_type != "All types": query["type"] = property_type
    if bedrooms: query["bedrooms"] = {"$gte": bedrooms}
    rows = await db.listings.find(query, {"_id": 0}).to_list(100)
    return rows

@api.post("/listings", response_model=Listing)
async def create_listing(item: Listing):
    await db.listings.insert_one(item.model_dump()); return item

@api.post("/bookings")
async def booking(item: Booking):
    doc = item.model_dump(); doc["id"] = str(uuid.uuid4()); doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.bookings.insert_one(doc); return {"ok": True, "id": doc["id"]}

@api.post("/maintenance")
async def maintenance(item: Maintenance):
    doc = item.model_dump(); doc["id"] = str(uuid.uuid4()); doc["status"] = "Submitted"; doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.maintenance.insert_one(doc); return {"ok": True, "request": {k: v for k, v in doc.items() if k != "_id"}}

@api.post("/contact")
async def contact(item: Contact):
    doc = item.model_dump(); doc["created_at"] = datetime.now(timezone.utc).isoformat(); await db.contacts.insert_one(doc); return {"ok": True}

@api.get("/notifications")
async def notifications():
    return [{"id": "n1", "title": "New matching residence", "body": "The Aria Residence is now available for your saved search.", "time": "12 min ago", "unread": True}, {"id": "n2", "title": "Tour confirmed", "body": "Your Aria Residence visit is ready to review.", "time": "Yesterday", "unread": False}]

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","), allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown(): client.close()