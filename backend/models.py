"""Pydantic models for API payloads."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ----- Auth -----
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None


# ----- Property -----
class PropertyIn(BaseModel):
    title: str
    description: str = ""
    property_type: str = "Apartment"
    city: str
    locality: str
    monthly_rent: int
    security_deposit: int = 0
    bedrooms: int = 1
    bathrooms: int = 1
    furnished: str = "Furnished"
    pet_friendly: bool = False
    available_from: str = ""
    amenities: list[str] = []
    rules: list[str] = []
    images: list[str] = []
    cover_image: Optional[str] = None
    video_url: Optional[str] = None
    tour_3d_url: Optional[str] = None
    rating: float = 4.7
    status: str = "available"  # available | occupied | draft
    lat: Optional[float] = None
    lng: Optional[float] = None


# ----- Bookings / Applications / Maintenance -----
class BookingIn(BaseModel):
    property_id: str
    date: str
    time_slot: str
    name: str
    phone: str
    notes: Optional[str] = ""


class ApplicationIn(BaseModel):
    property_id: str
    full_name: str
    email: EmailStr
    phone: str
    current_address: str = ""
    employment_status: str = ""
    employer: str = ""
    monthly_income: int = 0
    occupants: int = 1
    move_in_date: str
    duration_months: int = 11
    emergency_contact: str = ""
    documents: list[str] = []


class MaintenanceIn(BaseModel):
    property_id: str
    category: str
    title: str
    description: str
    priority: str = "Medium"
    photos: list[str] = []
    preferred_time: Optional[str] = None


class WishlistToggleIn(BaseModel):
    property_id: str


class SavedSearchIn(BaseModel):
    name: str
    query: dict


class CommentIn(BaseModel):
    property_id: str
    body: str


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    subject: str
    message: str


class StatusUpdateIn(BaseModel):
    status: str
    note: Optional[str] = None
