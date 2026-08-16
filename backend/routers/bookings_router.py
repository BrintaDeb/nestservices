"""Tour bookings + admin/user views."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, require_admin
from db import get_db
from models import BookingIn, StatusUpdateIn

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.post("", status_code=201)
async def create_booking(payload: BookingIn, user: dict = Depends(get_current_user)):
    db = get_db()
    # duplicate slot guard
    existing = await db.bookings.find_one({
        "property_id": payload.property_id,
        "date": payload.date,
        "time_slot": payload.time_slot,
        "status": {"$in": ["pending", "confirmed"]},
    })
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot is already booked. Please pick another time.")
    prop = await db.properties.find_one({"_id": ObjectId(payload.property_id)})
    doc = payload.model_dump()
    doc["user_id"] = user["id"]
    doc["user_email"] = user.get("email")
    doc["property_title"] = prop.get("title") if prop else "Property"
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.bookings.insert_one(doc)
    # notify
    await db.notifications.insert_one({
        "user_id": user["id"],
        "title": "Tour requested",
        "body": f"Your visit to {doc['property_title']} on {doc['date']} at {doc['time_slot']} is pending confirmation.",
        "unread": True,
        "created_at": datetime.now(timezone.utc),
    })
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/mine")
async def my_bookings(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.bookings.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [_serialize(r) for r in rows]


@router.get("")
async def all_bookings(_admin=Depends(require_admin)):
    db = get_db()
    rows = await db.bookings.find().sort("created_at", -1).to_list(200)
    return [_serialize(r) for r in rows]


@router.patch("/{booking_id}")
async def update_booking(booking_id: str, payload: StatusUpdateIn, _admin=Depends(require_admin)):
    db = get_db()
    result = await db.bookings.update_one({"_id": ObjectId(booking_id)},
                                          {"$set": {"status": payload.status, "note": payload.note}})
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    doc = await db.bookings.find_one({"_id": ObjectId(booking_id)})
    # notify user
    await db.notifications.insert_one({
        "user_id": doc.get("user_id"),
        "title": f"Tour {payload.status}",
        "body": f"Your tour for {doc.get('property_title')} is now {payload.status}.",
        "unread": True,
        "created_at": datetime.now(timezone.utc),
    })
    return _serialize(doc)


@router.get("/slots/{property_id}")
async def slots_for(property_id: str, date: str):
    db = get_db()
    taken = await db.bookings.find({
        "property_id": property_id,
        "date": date,
        "status": {"$in": ["pending", "confirmed"]},
    }).to_list(50)
    all_slots = ["10:00 AM", "11:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"]
    booked = {t["time_slot"] for t in taken}
    return {"slots": [{"time": s, "available": s not in booked} for s in all_slots]}
