# auth.py
# This file handles everything related to security:
# 1. Hashing passwords (so we never store plain text passwords)
# 2. Creating JWT tokens (so users stay "logged in")
# 3. Checking/decoding tokens (so we know who is making a request)
#
# We keep this beginner-friendly by using well-known libraries
# (passlib for password hashing, python-jose for JWT tokens)
# so we don't have to write any complicated security code ourselves.

from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Header, HTTPException
from bson import ObjectId

from database import users_collection

# -----------------------------
# Password Hashing Setup
# -----------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -----------------------------
# JWT Settings
# -----------------------------
# In a real production app, this SECRET_KEY should be kept private
# (for example, in an environment variable). For this beginner
# project, we keep it simple and just write it here.
SECRET_KEY = "beginner-event-management-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # token lasts 1 day


def hash_password(password: str) -> str:
    """Turn a plain text password into a secure hashed password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain text password matches the stored hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a JWT token that stores some data (like the user's id)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def get_current_user(authorization: str = Header(None)):
    """
    This function reads the "Authorization" header sent by the frontend,
    checks the JWT token, and returns the logged-in user's data.

    The frontend must send the header like this:
    Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")

    # The header looks like: "Bearer eyJhbGciOiJ..."
    # We split it to get just the token part.
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format.")

    token = parts[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please log in again.")

    # Look up the user in the database
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")

    return user
