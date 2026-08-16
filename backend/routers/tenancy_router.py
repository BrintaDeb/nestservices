"""Rental applications + maintenance requests + admin dashboards."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, require_admin
from db import get_db
from models import ApplicationIn, MaintenanceIn, StatusUpdateIn

router = APIRouter(tags=["tenancy"])


def _s(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), datetime):
            doc[k] = doc[k].isoformat()
    return doc


# --------- Applications ---------
@router.post("/api/applications", status_code=201)
async def submit_application(payload: ApplicationIn, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["user_id"] = user["id"]
    doc["status"] = "Submitted"
    doc["screening_status"] = "Consent Required"
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.applications.insert_one(doc)
    await db.notifications.insert_one({
        "user_id": user["id"],
        "title": "Application submitted",
        "body": "Your rental application is under review by Nest Services.",
        "unread": True,
        "created_at": datetime.now(timezone.utc),
    })
    doc["_id"] = result.inserted_id
    return _s(doc)


@router.get("/api/applications/mine")
async def my_applications(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    return [_s(r) for r in rows]


@router.get("/api/applications")
async def all_applications(_admin=Depends(require_admin)):
    db = get_db()
    rows = await db.applications.find().sort("created_at", -1).to_list(200)
    return [_s(r) for r in rows]


@router.patch("/api/applications/{aid}")
async def update_application(aid: str, payload: StatusUpdateIn, _admin=Depends(require_admin)):
    db = get_db()
    update = {"status": payload.status, "note": payload.note, "updated_at": datetime.now(timezone.utc)}
    result = await db.applications.update_one({"_id": ObjectId(aid)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    doc = await db.applications.find_one({"_id": ObjectId(aid)})
    await db.notifications.insert_one({
        "user_id": doc.get("user_id"),
        "title": f"Application {payload.status}",
        "body": f"Your application status is now {payload.status}.",
        "unread": True,
        "created_at": datetime.now(timezone.utc),
    })
    return _s(doc)


# --------- Maintenance ---------
@router.post("/api/maintenance", status_code=201)
async def create_maintenance(payload: MaintenanceIn, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["user_id"] = user["id"]
    doc["status"] = "Submitted"
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.maintenance.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _s(doc)


@router.get("/api/maintenance/mine")
async def my_maintenance(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.maintenance.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    return [_s(r) for r in rows]


@router.get("/api/maintenance")
async def all_maintenance(_admin=Depends(require_admin)):
    db = get_db()
    rows = await db.maintenance.find().sort("created_at", -1).to_list(200)
    return [_s(r) for r in rows]


@router.patch("/api/maintenance/{mid}")
async def update_maintenance(mid: str, payload: StatusUpdateIn, _admin=Depends(require_admin)):
    db = get_db()
    result = await db.maintenance.update_one({"_id": ObjectId(mid)},
                                             {"$set": {"status": payload.status, "note": payload.note}})
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    doc = await db.maintenance.find_one({"_id": ObjectId(mid)})
    return _s(doc)


# --------- Admin analytics ---------
@router.get("/api/admin/stats")
async def admin_stats(_admin=Depends(require_admin)):
    db = get_db()
    total = await db.properties.count_documents({})
    occupied = await db.properties.count_documents({"status": "occupied"})
    available = await db.properties.count_documents({"status": "available"})
    users = await db.users.count_documents({})
    applications = await db.applications.count_documents({})
    tours = await db.bookings.count_documents({})
    maintenance = await db.maintenance.count_documents({"status": {"$ne": "Completed"}})
    monthly_rent_agg = await db.properties.aggregate([
        {"$match": {"status": "occupied"}},
        {"$group": {"_id": None, "total": {"$sum": "$monthly_rent"}}},
    ]).to_list(1)
    rent_collected = monthly_rent_agg[0]["total"] if monthly_rent_agg else 0
    occupancy_rate = round((occupied / total) * 100) if total else 0
    return {
        "total_properties": total,
        "occupied_units": occupied,
        "available_units": available,
        "users": users,
        "applications": applications,
        "tours": tours,
        "open_maintenance": maintenance,
        "rent_collected": rent_collected,
        "occupancy_rate": occupancy_rate,
    }


@router.get("/api/admin/users")
async def admin_users(_admin=Depends(require_admin)):
    db = get_db()
    rows = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(200)
    return [{"id": str(r.pop("_id")), **r, "created_at": r.get("created_at").isoformat() if isinstance(r.get("created_at"), datetime) else r.get("created_at")}
            for r in rows]
