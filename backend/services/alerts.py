"""Saved-search matcher + Resend email dispatch (in-app notifications always fire;
email is opt-in and gracefully no-ops if RESEND_API_KEY is not configured)."""
from __future__ import annotations
import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any

from db import get_db
from timezones import now_ist

log = logging.getLogger("nest.alerts")

# Resend is imported lazily so a missing key never crashes the app.
try:
    import resend  # type: ignore
except Exception:  # pragma: no cover
    resend = None


def _matches(query: dict, prop: dict) -> bool:
    """Return True if a saved-search query matches a property document."""
    if not query:
        return False
    q = (query.get("q") or "").strip().lower()
    if q:
        haystack = " ".join(str(prop.get(k, "")) for k in ("title", "locality", "city", "description")).lower()
        if q not in haystack:
            return False
    city = query.get("city")
    if city and city.lower() not in ("", "all", "all cities") and prop.get("city", "").lower() != city.lower():
        return False
    ptype = query.get("property_type")
    if ptype and ptype.lower() not in ("", "all", "all types") and prop.get("property_type") != ptype:
        return False
    beds = query.get("bedrooms")
    if beds:
        try:
            if int(prop.get("bedrooms", 0)) < int(beds):
                return False
        except Exception:
            return False
    baths = query.get("bathrooms")
    if baths:
        try:
            if int(prop.get("bathrooms", 0)) < int(baths):
                return False
        except Exception:
            return False
    furn = query.get("furnished")
    if furn and furn.lower() != "any" and prop.get("furnished") != furn:
        return False
    pet = query.get("pet_friendly")
    if pet is not None:
        if bool(prop.get("pet_friendly")) != bool(pet):
            return False
    max_rent = query.get("max_rent")
    if max_rent:
        try:
            if int(prop.get("monthly_rent", 0)) > int(max_rent):
                return False
        except Exception:
            return False
    min_rent = query.get("min_rent")
    if min_rent:
        try:
            if int(prop.get("monthly_rent", 0)) < int(min_rent):
                return False
        except Exception:
            return False
    move_in = query.get("move_in")
    if move_in and (prop.get("available_from") or "") > move_in:
        return False
    return True


def _email_html(user_name: str, prop: dict) -> str:
    app_url = os.environ.get("APP_URL", "").rstrip("/")
    link = f"{app_url}/property/{prop.get('id', '')}" if app_url else "#"
    rent = f"₹{int(prop.get('monthly_rent', 0)):,}".replace(",", ",")  # simple INR
    title = prop.get("title", "A new residence")
    locality = prop.get("locality", "")
    cover = prop.get("cover_image") or (prop.get("images") or [""])[0]
    if cover and cover.startswith("/api/"):
        cover = f"{app_url}{cover}"
    return f"""
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F7F5F0;padding:32px 0;font-family:Inter,Arial,sans-serif;color:#1A1A1A">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background:#ffffff;border:1px solid #E8E1D3">
      <tr><td style="padding:28px 32px 8px">
        <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;letter-spacing:2px;font-size:11px;color:#B76C3D;text-transform:uppercase">Nest Services · Saved-search match</div>
        <h1 style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-weight:500;font-size:28px;margin:12px 0 4px;color:#1A1A1A">Hi {user_name}, a new home fits your search.</h1>
        <p style="color:#3A3A3A;font-size:14px;line-height:1.6;margin:8px 0 0">We just added a residence that matches one of your saved searches. Have a look — visits open on the spot.</p>
      </td></tr>
      {"<tr><td style='padding:16px 32px'><img src='" + cover + "' alt='" + title + "' width='496' style='width:100%;max-width:496px;display:block;border:1px solid #E8E1D3'/></td></tr>" if cover else ""}
      <tr><td style="padding:8px 32px 24px">
        <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:22px;color:#1A1A1A">{title}</div>
        <div style="color:#3A3A3A;font-size:13px;margin-top:4px">{locality}</div>
        <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:20px;color:#B76C3D;margin-top:14px">{rent} <span style="font-size:12px;color:#3A3A3A">/ month</span></div>
        <a href="{link}" style="display:inline-block;margin-top:20px;background:#1A1A1A;color:#F7F5F0;padding:12px 20px;text-decoration:none;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px">View residence →</a>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #E8E1D3;color:#8A7458;font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:1.5px;text-transform:uppercase">Nest Services · find your nest, secure your space</td></tr>
    </table>
  </td></tr>
</table>
""".strip()


async def _send_email(to: str, subject: str, html: str) -> bool:
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not api_key or resend is None:
        log.info("Email skipped (no RESEND_API_KEY set) to=%s subject=%s", to, subject)
        return False
    resend.api_key = api_key
    sender = os.environ.get("SENDER_EMAIL", "Nest Services <onboarding@resend.dev>")
    try:
        await asyncio.to_thread(
            resend.Emails.send,
            {"from": sender, "to": [to], "subject": subject, "html": html},
        )
        return True
    except Exception as e:
        log.warning("Email send failed to=%s err=%s", to, e)
        return False


async def dispatch_new_property_alerts(prop: dict) -> dict:
    """Run after a new property is created. Returns a small stats dict."""
    db = get_db()
    stats: dict[str, Any] = {"matched_searches": 0, "notifications_created": 0, "emails_sent": 0}
    # Only alert for available properties
    if prop.get("status") not in (None, "available"):
        return stats

    saved = await db.saved_searches.find({"alerts_enabled": {"$ne": False}}).to_list(500)
    now = now_ist()
    for s in saved:
        if not _matches(s.get("query") or {}, prop):
            continue
        stats["matched_searches"] += 1

        # in-app notification (idempotent per user+property+search)
        await db.notifications.insert_one({
            "user_id": s["user_id"],
            "title": "A new home matches your search",
            "body": f"'{prop.get('title')}' in {prop.get('locality')} matches your saved search '{s.get('name', 'Custom search')}'.",
            "meta": {"saved_search_id": str(s["_id"]), "property_id": prop.get("id")},
            "unread": True,
            "created_at": now,
        })
        stats["notifications_created"] += 1

        # email (optional)
        try:
            user = await db.users.find_one({"_id": __import__("bson").ObjectId(s["user_id"])})
        except Exception:
            user = None
        if user and user.get("email"):
            sent = await _send_email(
                to=user["email"],
                subject=f"New match for '{s.get('name', 'your saved search')}' — {prop.get('title')}",
                html=_email_html(user.get("name", "there"), prop),
            )
            if sent:
                stats["emails_sent"] += 1
    return stats
