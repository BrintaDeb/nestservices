"""Wishlist, saved searches, comments, notifications, contact."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, require_admin
from db import get_db
from models import CommentIn, ContactIn, SavedSearchIn, WishlistToggleIn
from services.alerts import _matches

router = APIRouter(tags=["engagement"])


# ---------------- Wishlist ----------------
@router.post("/api/wishlist/toggle")
async def wishlist_toggle(payload: WishlistToggleIn, user: dict = Depends(get_current_user)):
    db = get_db()
    key = {"user_id": user["id"], "property_id": payload.property_id}
    existing = await db.wishlist.find_one(key)
    if existing:
        await db.wishlist.delete_one(key)
        return {"wishlisted": False}
    await db.wishlist.insert_one({**key, "created_at": datetime.now(timezone.utc)})
    return {"wishlisted": True}


@router.get("/api/wishlist")
async def wishlist_list(user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.wishlist.find({"user_id": user["id"]}).to_list(200)
    property_ids = []
    for i in items:
        pid = i.get("property_id")
        if not pid:
            continue
        try:
            property_ids.append(ObjectId(pid))
        except Exception:
            continue
    props = await db.properties.find({"_id": {"$in": property_ids}}).to_list(200)
    out = []
    for p in props:
        p["id"] = str(p.pop("_id"))
        out.append(p)
    return out


# ---------------- Saved searches ----------------
@router.post("/api/saved-searches")
async def saved_search_create(payload: SavedSearchIn, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {"user_id": user["id"], "name": payload.name, "query": payload.query,
           "alerts_enabled": True, "created_at": datetime.now(timezone.utc)}
    result = await db.saved_searches.insert_one(doc)
    # Preview count for current matches
    props = await db.properties.find({"status": {"$ne": "draft"}}).to_list(500)
    matches = sum(1 for p in props if _matches(payload.query or {}, p))
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc["match_count"] = matches
    return doc


@router.patch("/api/saved-searches/{sid}")
async def saved_search_update(sid: str, payload: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    allowed = {k: v for k, v in payload.items() if k in ("name", "alerts_enabled")}
    if not allowed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No allowed fields to update")
    result = await db.saved_searches.update_one(
        {"_id": ObjectId(sid), "user_id": user["id"]}, {"$set": allowed}
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Saved search not found")
    return {"ok": True}


@router.get("/api/saved-searches")
async def saved_search_list(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.saved_searches.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    return [{"id": str(r.pop("_id")), **r, "created_at": r["created_at"].isoformat()} for r in rows]


@router.delete("/api/saved-searches/{sid}")
async def saved_search_delete(sid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.saved_searches.delete_one({"_id": ObjectId(sid), "user_id": user["id"]})
    return {"ok": True}


# ---------------- Comments ----------------
@router.post("/api/comments")
async def add_comment(payload: CommentIn, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {"property_id": payload.property_id, "body": payload.body[:1000],
           "user_id": user["id"], "user_name": user.get("name", "Guest"),
           "hidden": False, "created_at": datetime.now(timezone.utc)}
    result = await db.comments.insert_one(doc)
    await db.properties.update_one({"_id": ObjectId(payload.property_id)}, {"$inc": {"comments_count": 1}})
    return {"id": str(result.inserted_id), "body": doc["body"], "user_name": doc["user_name"],
            "created_at": doc["created_at"].isoformat()}


@router.delete("/api/comments/{cid}")
async def delete_comment(cid: str, _admin=Depends(require_admin)):
    db = get_db()
    await db.comments.update_one({"_id": ObjectId(cid)}, {"$set": {"hidden": True}})
    return {"ok": True}


# ---------------- Notifications ----------------
@router.get("/api/notifications")
async def notifications_list(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    out = []
    for r in rows:
        r["id"] = str(r.pop("_id"))
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
        out.append(r)
    return out


@router.post("/api/notifications/{nid}/read")
async def notification_read(nid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_one({"_id": ObjectId(nid), "user_id": user["id"]}, {"$set": {"unread": False}})
    return {"ok": True}


# ---------------- Contact ----------------
@router.post("/api/contact")
async def contact(payload: ContactIn):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    await db.contacts.insert_one(doc)
    return {"ok": True, "message": "Thank you. Nest Services will reach out shortly."}
