"""Property CRUD + smart filters."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user_optional, require_admin
from db import get_db
from models import PropertyIn
from services.alerts import dispatch_new_property_alerts
from timezones import now_ist

router = APIRouter(prefix="/api/properties", tags=["properties"])


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_properties(
    q: Optional[str] = None,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    min_rent: Optional[int] = None,
    max_rent: Optional[int] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    furnished: Optional[str] = None,
    pet_friendly: Optional[bool] = None,
    move_in: Optional[str] = None,
    limit: int = Query(60, le=200),
):
    db = get_db()
    query: dict[str, Any] = {"status": {"$ne": "draft"}}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"locality": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    if city and city.lower() not in ("", "all", "all cities"):
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if property_type and property_type.lower() not in ("", "all", "all types"):
        query["property_type"] = property_type
    if bedrooms:
        query["bedrooms"] = {"$gte": bedrooms}
    if bathrooms:
        query["bathrooms"] = {"$gte": bathrooms}
    if furnished and furnished.lower() not in ("", "any"):
        query["furnished"] = furnished
    if pet_friendly is not None:
        query["pet_friendly"] = pet_friendly
    rent_range: dict[str, int] = {}
    if min_rent:
        rent_range["$gte"] = min_rent
    if max_rent:
        rent_range["$lte"] = max_rent
    if rent_range:
        query["monthly_rent"] = rent_range
    if move_in:
        query["available_from"] = {"$lte": move_in}

    cursor = db.properties.find(query).sort("created_at", -1).limit(limit)
    return [_serialize(d) async for d in cursor]


@router.get("/facets")
async def facets():
    db = get_db()
    cities = await db.properties.distinct("city")
    types = await db.properties.distinct("property_type")
    return {"cities": sorted([c for c in cities if c]), "types": sorted([t for t in types if t])}


@router.get("/{property_id}")
async def get_property(property_id: str, current=Depends(get_current_user_optional)):
    db = get_db()
    try:
        doc = await db.properties.find_one({"_id": ObjectId(property_id)})
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    data = _serialize(doc)
    # comments
    comments = await db.comments.find({"property_id": property_id, "hidden": {"$ne": True}}).sort("created_at", -1).to_list(50)
    data["comments"] = [{"id": str(c["_id"]), "body": c["body"], "user_name": c.get("user_name", "Guest"),
                          "created_at": c["created_at"].isoformat() if isinstance(c.get("created_at"), datetime) else c.get("created_at")}
                        for c in comments]
    data["is_wishlisted"] = False
    if current:
        w = await db.wishlist.find_one({"user_id": current["id"], "property_id": property_id})
        data["is_wishlisted"] = w is not None
    return data


@router.post("", status_code=201)
async def create_property(payload: PropertyIn, _admin=Depends(require_admin)):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = now_ist()
    doc["updated_at"] = doc["created_at"]
    doc["likes"] = 0
    doc["comments_count"] = 0
    if not doc.get("cover_image") and doc.get("images"):
        doc["cover_image"] = doc["images"][0]
    result = await db.properties.insert_one(doc)
    doc["_id"] = result.inserted_id
    created = _serialize(doc)
    # Fire saved-search alerts (in-app + optional email)
    try:
        await dispatch_new_property_alerts(created)
    except Exception:
        pass
    return created


@router.put("/{property_id}")
async def update_property(property_id: str, payload: PropertyIn, _admin=Depends(require_admin)):
    db = get_db()
    doc = payload.model_dump()
    doc["updated_at"] = now_ist()
    if not doc.get("cover_image") and doc.get("images"):
        doc["cover_image"] = doc["images"][0]
    result = await db.properties.update_one({"_id": ObjectId(property_id)}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    updated = await db.properties.find_one({"_id": ObjectId(property_id)})
    return _serialize(updated)


@router.delete("/{property_id}")
async def delete_property(property_id: str, _admin=Depends(require_admin)):
    db = get_db()
    result = await db.properties.delete_one({"_id": ObjectId(property_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    return {"ok": True}
