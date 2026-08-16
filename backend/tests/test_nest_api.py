"""Nest Services v2 API regression suite (pytest)."""
import os
import io
import uuid
import time

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@nestservices.in"
ADMIN_PASSWORD = "Nest@Admin2026"
DEMO_EMAIL = "tanya@nestservices.in"
DEMO_PASSWORD = "Tanya@2026"


# ----- fixtures -----
@pytest.fixture(scope="session")
def s():
    ses = requests.Session()
    ses.headers.update({"Content-Type": "application/json"})
    return ses


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    return data["access_token"], data["user"]


@pytest.fixture(scope="session")
def admin_token():
    tok, _ = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    return tok


@pytest.fixture(scope="session")
def user_token():
    tok, _ = _login(DEMO_EMAIL, DEMO_PASSWORD)
    return tok


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health / root ----------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Properties ----------
def test_list_properties_seeded():
    r = requests.get(f"{API}/properties")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 6
    titles = {p["title"] for p in data}
    for expected in [
        "Ujjayanta Residency", "Rabindra Bhavan Retreat", "Neermahal Courtyard House",
        "Melarmath Studio", "Battala Independent Floor", "Airport Road Villa",
    ]:
        assert expected in titles, f"missing seed: {expected}"


def test_facets():
    r = requests.get(f"{API}/properties/facets")
    assert r.status_code == 200
    data = r.json()
    assert "Agartala" in data["cities"]
    assert len(data["types"]) >= 1


def test_filter_city():
    r = requests.get(f"{API}/properties", params={"city": "Agartala"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 6
    assert all(p["city"] == "Agartala" for p in data)


def test_filter_max_rent():
    r = requests.get(f"{API}/properties", params={"max_rent": 20000})
    assert r.status_code == 200
    data = r.json()
    assert all(p["monthly_rent"] <= 20000 for p in data)


def test_filter_bedrooms():
    r = requests.get(f"{API}/properties", params={"bedrooms": 3})
    assert r.status_code == 200
    data = r.json()
    assert all(p["bedrooms"] >= 3 for p in data)


def test_search_query():
    r = requests.get(f"{API}/properties", params={"q": "Ujjayanta"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert any("Ujjayanta" in p["title"] for p in data)


def test_get_single_property():
    r = requests.get(f"{API}/properties")
    pid = r.json()[0]["id"]
    r2 = requests.get(f"{API}/properties/{pid}")
    assert r2.status_code == 200
    doc = r2.json()
    assert doc["id"] == pid
    assert isinstance(doc.get("comments"), list)


# ---------- Auth ----------
def test_register_returns_token():
    email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "name": "TEST Reg", "email": email, "password": "Passw0rd!", "phone": "+919000000000",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "user"
    assert data.get("access_token")


def test_admin_login_and_me():
    tok, user = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    assert user["role"] == "admin"
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["user"]["email"] == ADMIN_EMAIL


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_logout(user_token):
    r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200


def test_brute_force_lockout():
    # Use unique email so we don't pollute the real accounts' counter
    email = f"lock_{uuid.uuid4().hex[:6]}@example.com"
    codes = []
    for _ in range(6):
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "bad"})
        codes.append(r.status_code)
    # after 5 fails, should include 429
    assert 429 in codes, f"expected 429 in {codes}"


# ---------- Property CRUD RBAC ----------
def test_user_cannot_create_property(user_token):
    payload = {"title": "TEST unauth", "city": "Agartala", "locality": "x",
               "monthly_rent": 1000, "property_type": "Apartment"}
    r = requests.post(f"{API}/properties", json=payload, headers=auth_headers(user_token))
    assert r.status_code == 403


def test_admin_property_crud(admin_token):
    payload = {
        "title": f"TEST Nest {uuid.uuid4().hex[:6]}",
        "description": "TEST", "property_type": "Apartment",
        "city": "Agartala", "locality": "TEST Locality",
        "monthly_rent": 15000, "security_deposit": 30000,
        "bedrooms": 2, "bathrooms": 2, "furnished": "Furnished",
        "pet_friendly": True, "available_from": "2026-05-01",
        "amenities": ["TEST"], "rules": ["TEST"], "images": [], "cover_image": None,
    }
    r = requests.post(f"{API}/properties", json=payload, headers=auth_headers(admin_token))
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    # verify persistence via GET
    r2 = requests.get(f"{API}/properties/{pid}")
    assert r2.status_code == 200
    assert r2.json()["title"] == payload["title"]

    # update
    payload["monthly_rent"] = 17000
    r3 = requests.put(f"{API}/properties/{pid}", json=payload, headers=auth_headers(admin_token))
    assert r3.status_code == 200
    assert r3.json()["monthly_rent"] == 17000

    # delete
    r4 = requests.delete(f"{API}/properties/{pid}", headers=auth_headers(admin_token))
    assert r4.status_code == 200

    r5 = requests.get(f"{API}/properties/{pid}")
    assert r5.status_code == 404


# ---------- Uploads ----------
def test_upload_requires_auth():
    r = requests.post(f"{API}/uploads/images",
                      files={"files": ("t.png", b"\x89PNG\r\n\x1a\n", "image/png")})
    assert r.status_code == 401


def test_upload_image_and_serve(user_token):
    # a tiny valid-ish png-like byte blob (server does not validate content, only extension)
    fname = f"test_{uuid.uuid4().hex[:6]}.png"
    r = requests.post(f"{API}/uploads/images",
                      files={"files": (fname, b"\x89PNG\r\n\x1a\nTESTBYTES", "image/png")},
                      headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200, r.text
    urls = r.json()["urls"]
    assert len(urls) == 1 and urls[0].startswith("/api/uploads/file/")
    r2 = requests.get(BASE_URL + urls[0])
    assert r2.status_code == 200
    assert len(r2.content) > 0


# ---------- Wishlist ----------
def test_wishlist_toggle_and_list(user_token):
    props = requests.get(f"{API}/properties").json()
    pid = props[0]["id"]
    # ensure clean state: toggle to add
    r = requests.post(f"{API}/wishlist/toggle", json={"property_id": pid},
                      headers=auth_headers(user_token))
    assert r.status_code == 200
    added = r.json()["wishlisted"]
    r2 = requests.get(f"{API}/wishlist", headers=auth_headers(user_token))
    assert r2.status_code == 200
    ids = [p["id"] for p in r2.json()]
    if added:
        assert pid in ids
    # toggle again to remove/restore
    requests.post(f"{API}/wishlist/toggle", json={"property_id": pid},
                  headers=auth_headers(user_token))


# ---------- Saved searches ----------
def test_saved_search_crud(user_token):
    r = requests.post(f"{API}/saved-searches",
                      json={"name": f"TEST {uuid.uuid4().hex[:5]}", "query": {"city": "Agartala"}},
                      headers=auth_headers(user_token))
    assert r.status_code == 200
    sid = r.json()["id"]
    r2 = requests.get(f"{API}/saved-searches", headers=auth_headers(user_token))
    assert r2.status_code == 200
    assert any(x["id"] == sid for x in r2.json())
    r3 = requests.delete(f"{API}/saved-searches/{sid}", headers=auth_headers(user_token))
    assert r3.status_code == 200


# ---------- Comments ----------
def test_comment_flow(user_token, admin_token):
    pid = requests.get(f"{API}/properties").json()[0]["id"]
    r = requests.post(f"{API}/comments",
                      json={"property_id": pid, "body": "TEST comment"},
                      headers=auth_headers(user_token))
    assert r.status_code == 200
    cid = r.json()["id"]
    # confirm visible on detail
    detail = requests.get(f"{API}/properties/{pid}").json()
    assert any(c["id"] == cid for c in detail["comments"])
    # admin hide
    r2 = requests.delete(f"{API}/comments/{cid}", headers=auth_headers(admin_token))
    assert r2.status_code == 200
    detail2 = requests.get(f"{API}/properties/{pid}").json()
    assert not any(c["id"] == cid for c in detail2["comments"])


# ---------- Bookings ----------
def test_bookings_flow(user_token, admin_token):
    pid = requests.get(f"{API}/properties").json()[0]["id"]
    date = "2026-07-15"
    time_slot = "10:00 AM"
    # unique date+slot to avoid conflicts on reruns
    date = f"2026-07-{(int(time.time()) % 27) + 1:02d}"
    payload = {"property_id": pid, "date": date, "time_slot": time_slot,
               "name": "TEST Booker", "phone": "+919000000000", "notes": "TEST"}
    r = requests.post(f"{API}/bookings", json=payload, headers=auth_headers(user_token))
    assert r.status_code == 201, r.text
    bid = r.json()["id"]

    # duplicate blocks with 409
    r2 = requests.post(f"{API}/bookings", json=payload, headers=auth_headers(user_token))
    assert r2.status_code == 409

    # slots endpoint
    r3 = requests.get(f"{API}/bookings/slots/{pid}", params={"date": date})
    assert r3.status_code == 200
    slots = r3.json()["slots"]
    assert len(slots) == 5
    booked = [s for s in slots if s["time"] == time_slot][0]
    assert booked["available"] is False

    # my bookings
    r4 = requests.get(f"{API}/bookings/mine", headers=auth_headers(user_token))
    assert r4.status_code == 200
    assert any(b["id"] == bid for b in r4.json())

    # admin list + status update
    r5 = requests.get(f"{API}/bookings", headers=auth_headers(admin_token))
    assert r5.status_code == 200

    r6 = requests.patch(f"{API}/bookings/{bid}",
                        json={"status": "confirmed", "note": "TEST"},
                        headers=auth_headers(admin_token))
    assert r6.status_code == 200
    assert r6.json()["status"] == "confirmed"


# ---------- Applications ----------
def test_application_flow(user_token, admin_token):
    pid = requests.get(f"{API}/properties").json()[0]["id"]
    payload = {
        "property_id": pid, "full_name": "TEST Applicant",
        "email": "test_app@example.com", "phone": "+919000000000",
        "current_address": "TEST", "employment_status": "Employed",
        "employer": "TEST Co", "monthly_income": 90000,
        "occupants": 2, "move_in_date": "2026-05-01",
        "duration_months": 11, "emergency_contact": "TEST",
        "documents": [],
    }
    r = requests.post(f"{API}/applications", json=payload, headers=auth_headers(user_token))
    assert r.status_code == 201, r.text
    aid = r.json()["id"]
    assert r.json()["status"] == "Submitted"

    r2 = requests.get(f"{API}/applications/mine", headers=auth_headers(user_token))
    assert r2.status_code == 200 and any(a["id"] == aid for a in r2.json())

    r3 = requests.get(f"{API}/applications", headers=auth_headers(admin_token))
    assert r3.status_code == 200

    r4 = requests.patch(f"{API}/applications/{aid}",
                        json={"status": "Approved", "note": "TEST"},
                        headers=auth_headers(admin_token))
    assert r4.status_code == 200
    assert r4.json()["status"] == "Approved"


# ---------- Maintenance ----------
def test_maintenance_flow(user_token, admin_token):
    pid = requests.get(f"{API}/properties").json()[0]["id"]
    r = requests.post(f"{API}/maintenance",
                      json={"property_id": pid, "category": "Plumbing",
                            "title": "TEST tap", "description": "TEST leak",
                            "priority": "Medium", "photos": []},
                      headers=auth_headers(user_token))
    assert r.status_code == 201
    mid = r.json()["id"]

    r2 = requests.get(f"{API}/maintenance/mine", headers=auth_headers(user_token))
    assert r2.status_code == 200 and any(m["id"] == mid for m in r2.json())

    r3 = requests.patch(f"{API}/maintenance/{mid}",
                        json={"status": "In Progress"},
                        headers=auth_headers(admin_token))
    assert r3.status_code == 200
    assert r3.json()["status"] == "In Progress"


# ---------- Notifications ----------
def test_notifications(user_token):
    r = requests.get(f"{API}/notifications", headers=auth_headers(user_token))
    assert r.status_code == 200
    items = r.json()
    if items:
        nid = items[0]["id"]
        r2 = requests.post(f"{API}/notifications/{nid}/read",
                           headers=auth_headers(user_token))
        assert r2.status_code == 200


# ---------- Contact ----------
def test_contact():
    r = requests.post(f"{API}/contact", json={
        "name": "TEST", "email": "test@example.com",
        "subject": "TEST", "message": "TEST body",
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


# ---------- Admin analytics ----------
def test_admin_stats_and_users(admin_token, user_token):
    r = requests.get(f"{API}/admin/stats", headers=auth_headers(admin_token))
    assert r.status_code == 200
    data = r.json()
    for k in ("total_properties", "occupancy_rate", "users", "applications",
              "tours", "open_maintenance", "rent_collected"):
        assert k in data

    # user cannot access
    r2 = requests.get(f"{API}/admin/stats", headers=auth_headers(user_token))
    assert r2.status_code == 403

    r3 = requests.get(f"{API}/admin/users", headers=auth_headers(admin_token))
    assert r3.status_code == 200
    users = r3.json()
    assert all("password_hash" not in u for u in users)
