"""Admin-editable site content (labels, contact info, WhatsApp, hero copy)."""
from __future__ import annotations
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import require_admin
from db import get_db
from timezones import now_ist

router = APIRouter(prefix="/api/settings", tags=["settings"])


# The canonical, admin-editable content of the site. Keys are stable slugs.
DEFAULT_SETTINGS: dict[str, str] = {
    "brand.name": "Nest Services",
    "brand.tagline": "find your nest, secure your space",
    "brand.city": "Agartala",
    "contact.email": "hello@nestservices.in",
    "contact.phone": "+91 90000 00000",
    "contact.address": "Agartala, Tripura, India",
    "whatsapp.number": "919000000000",
    "whatsapp.message": "Hello Nest Services",
    "whatsapp.button_label": "WhatsApp support",
    "home.hero_kicker": "The Nest promise",
    "home.hero_title": "Renting should feel",
    "home.hero_title_em": "like a beginning.",
    "home.hero_body": "Nest Services is a considered rental home for India — a cinematic way to discover residences, a modern marketplace, and a calm portal for the life that follows move-in.",
    "home.cta_title": "Find your nest.",
    "home.cta_title_em": "Secure your space.",
    "footer.about": "Find your nest, secure your space. India's cinematic rental home for renters and landlords.",
    "footer.copyright": "© 2026 Nest Services",
    "about.body": "Nest Services is a modern rental home for renters, landlords and property teams. Built from Agartala for the country, we bring a cinematic way to feel a home before you visit, a considered marketplace of curated residences, and a calm portal that quietly handles rent, maintenance and messages after move-in.",
}


class SettingUpdateIn(BaseModel):
    value: str = Field(max_length=2000)


class SettingsBulkIn(BaseModel):
    items: dict[str, str]


def _serialize(doc: dict) -> dict:
    return {"key": doc["key"], "value": doc.get("value", ""), "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else None}


async def ensure_defaults() -> None:
    db = get_db()
    existing = {d["key"] async for d in db.site_settings.find({}, {"key": 1})}
    now = now_ist()
    to_insert = [
        {"key": k, "value": v, "updated_at": now}
        for k, v in DEFAULT_SETTINGS.items()
        if k not in existing
    ]
    if to_insert:
        await db.site_settings.insert_many(to_insert)


@router.get("")
async def get_settings() -> dict[str, Any]:
    """Public read — returns every key as a flat map so the frontend can splash it."""
    db = get_db()
    rows = await db.site_settings.find().to_list(500)
    data = {**DEFAULT_SETTINGS}
    for r in rows:
        if r.get("key"):
            data[r["key"]] = r.get("value", data.get(r["key"], ""))
    return data


@router.get("/list")
async def list_settings(_admin=Depends(require_admin)):
    """Admin listing — includes updated_at metadata."""
    db = get_db()
    rows = await db.site_settings.find().sort("key", 1).to_list(500)
    return [_serialize(r) for r in rows]


@router.put("/{key:path}")
async def update_setting(key: str, payload: SettingUpdateIn, _admin=Depends(require_admin)):
    if key not in DEFAULT_SETTINGS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown setting: {key}")
    db = get_db()
    now = now_ist()
    await db.site_settings.update_one(
        {"key": key},
        {"$set": {"value": payload.value, "updated_at": now}, "$setOnInsert": {"key": key}},
        upsert=True,
    )
    return {"key": key, "value": payload.value, "updated_at": now.isoformat()}


@router.post("/bulk")
async def bulk_update_settings(payload: SettingsBulkIn, _admin=Depends(require_admin)):
    db = get_db()
    now = now_ist()
    updated = []
    for k, v in payload.items.items():
        if k not in DEFAULT_SETTINGS:
            continue
        await db.site_settings.update_one(
            {"key": k},
            {"$set": {"value": v, "updated_at": now}, "$setOnInsert": {"key": k}},
            upsert=True,
        )
        updated.append(k)
    return {"updated": updated}


@router.post("/reset/{key:path}")
async def reset_setting(key: str, _admin=Depends(require_admin)):
    if key not in DEFAULT_SETTINGS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown setting: {key}")
    db = get_db()
    now = now_ist()
    await db.site_settings.update_one(
        {"key": key}, {"$set": {"value": DEFAULT_SETTINGS[key], "updated_at": now}}, upsert=True
    )
    return {"key": key, "value": DEFAULT_SETTINGS[key]}
