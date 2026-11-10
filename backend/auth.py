
# auth.py

# This file handles security:
# 1. Password hashing
# 2. JWT token creation
# 3. JWT token verification

import os
from datetime import datetime, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Header, HTTPException
from bson import ObjectId

from database import users_collection

# -----------------------------
# Password Hashing Setup
# -----------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# -----------------------------
# JWT Settings
# -----------------------------

# Read SECRET_KEY from environment variable.
# If not available, use a default key for local development.

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "local-development-secret-key"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day


def hash_password(password: str) -> str:
    """Hash the user's password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify the user's password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


def get_current_user(authorization: str = Header(None)):
    """Verify JWT token and get the logged-in user."""

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please log in."
        )

    parts = authorization.split(" ")

    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format."
        )

    token = parts[1]

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token."
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please log in again."
        )

    user = users_collection.find_one(
        {"_id": ObjectId(user_id)}
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found."
        )

    return user

