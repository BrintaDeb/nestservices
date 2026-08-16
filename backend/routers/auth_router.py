"""Auth routes: register, login, logout, me."""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from auth import (clear_auth_cookies, create_access_token, create_refresh_token,
                  get_current_user, hash_password, sanitize_user, set_auth_cookies,
                  verify_password)
from db import get_db
from models import LoginIn, RegisterIn

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(payload: RegisterIn, response: Response):
    db = get_db()
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    doc = {
        "name": payload.name.strip(),
        "email": email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    access = create_access_token(uid, email, "user")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    doc["_id"] = uid
    return {"user": sanitize_user(doc), "access_token": access}


@router.post("/login")
async def login(payload: LoginIn, request: Request, response: Response):
    db = get_db()
    email = payload.email.lower().strip()

    # brute-force guard — derive real client IP behind ingress/proxy
    fwd = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip") or ""
    real_ip = (fwd.split(",")[0].strip() if fwd else "") or (request.client.host if request.client else "unknown")
    ident = f"{real_ip}:{email}"
    email_ident = f"email:{email}"
    attempts_doc = await db.login_attempts.find_one({"identifier": ident}) or {}
    email_attempts = await db.login_attempts.find_one({"identifier": email_ident}) or {}
    now = datetime.now(timezone.utc)
    for doc in (attempts_doc, email_attempts):
        if doc.get("count", 0) >= 5:
            locked_until = doc.get("locked_until")
            if locked_until is not None:
                if locked_until.tzinfo is None:
                    locked_until = locked_until.replace(tzinfo=timezone.utc)
                if locked_until > now:
                    raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts. Try again in a few minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        # record failed attempt on both keys
        from datetime import timedelta
        lock_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        for key in (ident, email_ident):
            await db.login_attempts.update_one(
                {"identifier": key},
                {"$inc": {"count": 1}, "$set": {"locked_until": lock_until}},
                upsert=True,
            )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    await db.login_attempts.delete_many({"identifier": {"$in": [ident, email_ident]}})
    uid = str(user["_id"])
    access = create_access_token(uid, email, user["role"])
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"user": sanitize_user(user), "access_token": access}


@router.post("/logout")
async def logout(response: Response, _user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}
