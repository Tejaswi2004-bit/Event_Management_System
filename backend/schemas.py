# schemas.py
# This file defines the "shape" of the data our API expects and returns.
# We use Pydantic models for automatic validation.
# For example, if someone tries to register without an email, FastAPI
# will automatically send back an error - we don't have to check manually.

from pydantic import BaseModel
from typing import Optional


# -----------------------------
# USER SCHEMAS
# -----------------------------

class UserRegister(BaseModel):
    """Data needed when a new user signs up."""
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    """Data needed when a user logs in."""
    email: str
    password: str


class UserOut(BaseModel):
    """Data we send back about a user (never send the password back!)."""
    id: str
    name: str
    email: str
    role: str


# -----------------------------
# EVENT SCHEMAS
# -----------------------------

class EventCreate(BaseModel):
    """Data needed to create a new event."""
    title: str
    description: str
    date: str           # example: "2026-10-15"
    time: str            # example: "14:30"
    location: str
    category: str
    total_seats: int


class EventUpdate(BaseModel):
    """Data allowed when updating an event.
    All fields are optional because the user might only want to
    update one or two fields (like just the location)."""
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    total_seats: Optional[int] = None


# -----------------------------
# REGISTRATION SCHEMAS
# -----------------------------

class RegistrationCreate(BaseModel):
    """Data needed when a user registers for an event."""
    event_id: str
