"""Gemini AI-powered features for Nest Services.

- POST /api/ai/property-description  — admin generates a polished description from a brief
- POST /api/ai/search-parse           — parses a natural-language rental query into filters
"""
from __future__ import annotations
import json
import logging
import os
import re
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import get_current_user, require_admin

log = logging.getLogger("nest.ai")
router = APIRouter(prefix="/api/ai", tags=["ai"])


def _model() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")


def _key() -> str:
    key = os.environ.get("EMERGENT_LLM_KEY", "").strip()
    if not key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI service not configured")
    return key


def _new_chat(session_id: str, system_message: str):
    from emergentintegrations.llm.chat import LlmChat  # lazy import
    return LlmChat(
        api_key=_key(),
        session_id=session_id,
        system_message=system_message,
    ).with_model("gemini", _model())


async def _ask(session_id: str, system: str, user_text: str) -> str:
    """Non-streaming helper — returns concatenated model text."""
    from emergentintegrations.llm.chat import UserMessage  # lazy import
    chat = _new_chat(session_id, system)
    try:
        resp = await chat.send_message(UserMessage(text=user_text))
    except Exception as e:
        log.exception("Gemini call failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"AI provider error: {e}")
    # SDK returns either a string or an object with .content — normalise.
    if isinstance(resp, str):
        return resp.strip()
    return str(getattr(resp, "content", resp)).strip()


# ---------- Property description ----------
class PropertyBrief(BaseModel):
    title: Optional[str] = None
    property_type: Optional[str] = "Apartment"
    city: Optional[str] = "Agartala"
    locality: Optional[str] = None
    bedrooms: int = 1
    bathrooms: int = 1
    furnished: Optional[str] = "Furnished"
    monthly_rent: Optional[int] = None
    amenities: list[str] = Field(default_factory=list)
    highlights: Optional[str] = ""  # optional freeform hints from the admin
    tone: Optional[str] = "premium, understated, cinematic"


DESC_SYSTEM = (
    "You are a senior copywriter for Nest Services, a premium Indian rental marketplace based in "
    "Agartala with the tagline 'find your nest, secure your space'. Write concise, sensory, "
    "cinematic residence descriptions in British English. Focus on how the home feels — light, "
    "materials, neighbourhood mood — never sales-speak. 2–3 short paragraphs, no emojis, no "
    "headings, no bullet lists, no prices, no phone numbers, no marketing exclamations."
)


@router.post("/property-description")
async def generate_property_description(brief: PropertyBrief, _admin=Depends(require_admin)):
    ams = ", ".join(brief.amenities) if brief.amenities else "no listed amenities"
    prompt = (
        f"Write a residence description for a Nest Services listing with this brief:\n"
        f"- Title: {brief.title or 'Untitled residence'}\n"
        f"- Type: {brief.property_type}\n"
        f"- City / Locality: {brief.city} · {brief.locality or 'central neighbourhood'}\n"
        f"- Bedrooms / Bathrooms: {brief.bedrooms} bed, {brief.bathrooms} bath\n"
        f"- Furnishing: {brief.furnished}\n"
        f"- Amenities: {ams}\n"
        f"- Extra highlights: {brief.highlights or 'none supplied'}\n"
        f"- Tone: {brief.tone}\n\n"
        f"Return only the finished description text — no preface, no closing lines."
    )
    text = await _ask(f"desc-{uuid.uuid4().hex[:8]}", DESC_SYSTEM, prompt)
    # Strip accidental wrapping quotes / markdown fences
    text = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", text).strip().strip('"').strip()
    return {"description": text, "model": _model()}


# ---------- Natural-language search ----------
class SearchQueryIn(BaseModel):
    query: str


SEARCH_SYSTEM = (
    "You translate natural-language Indian rental searches into a JSON filter object for the "
    "Nest Services property API. Respond with a single JSON object and no prose. "
    "Allowed keys: city (string; one of Agartala, Guwahati, Shillong, or empty), "
    "property_type (Apartment, House, Villa, Studio, PG, Independent Floor, or empty), "
    "bedrooms (integer; minimum requested), bathrooms (integer), "
    "furnished (Furnished, Semi-furnished, Unfurnished, or empty), "
    "pet_friendly (true/false, omit if unspecified), "
    "max_rent (integer in INR — convert '25k' to 25000, '1.5 lakh' to 150000), "
    "min_rent (integer in INR), q (free-text keywords useful for locality / landmark matching). "
    "Only include keys you can confidently infer from the user's message; leave the rest out."
)


def _extract_json(raw: str) -> dict:
    """Grab the first {...} block from the model output."""
    if not raw:
        return {}
    # strip fences
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    m = re.search(r"\{.*\}", cleaned, re.S)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


ALLOWED_FILTER_KEYS = {
    "city", "property_type", "bedrooms", "bathrooms", "furnished",
    "pet_friendly", "max_rent", "min_rent", "q",
}


def _sanitize_filters(raw: dict) -> dict:
    out: dict[str, Any] = {}
    if not isinstance(raw, dict):
        return out
    for k, v in raw.items():
        if k not in ALLOWED_FILTER_KEYS or v in (None, "", []):
            continue
        if k in ("bedrooms", "bathrooms", "max_rent", "min_rent"):
            try:
                out[k] = int(v)
            except Exception:
                continue
        elif k == "pet_friendly":
            out[k] = bool(v)
        else:
            out[k] = str(v).strip()
    return out


@router.post("/search-parse")
async def parse_search(payload: SearchQueryIn, _user: dict = Depends(get_current_user)):
    text = payload.query.strip()
    if not text:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Query is empty")
    if len(text) > 400:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Query too long")
    raw = await _ask(f"search-{uuid.uuid4().hex[:8]}", SEARCH_SYSTEM, text)
    parsed = _sanitize_filters(_extract_json(raw))
    return {"filters": parsed, "raw": raw, "model": _model()}
