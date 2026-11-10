# routes/users.py
# This file contains all the API endpoints related to users:
# - Register a new user
# - Login an existing user
# - Get the currently logged-in user's info

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from database import users_collection
from schemas import UserRegister, UserLogin
from models import user_helper
from auth import hash_password, verify_password, create_access_token, get_current_user

# An APIRouter lets us group related endpoints together.
# We will "include" this router inside main.py
router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/register")
def register_user(user: UserRegister):
    """
    Register a new user.
    Steps:
    1. Check if the email is already used.
    2. Hash the password (never store plain text passwords!).
    3. Save the new user in the database.
    """
    # Step 1: Check if a user with this email already exists
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Step 2: Hash the password before saving
    hashed_pw = hash_password(user.password)

    # Step 3: Build the new user document and insert it into MongoDB
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "role": "user",
        "created_at": datetime.utcnow().isoformat(),
    }

    result = users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id

    return {
        "message": "Registration successful! You can now log in.",
        "user": user_helper(new_user),
    }


@router.post("/login")
def login_user(credentials: UserLogin):
    """
    Log in an existing user.
    Steps:
    1. Find the user by email.
    2. Check the password matches.
    3. Create and return a JWT token.
    """
    # Step 1: Find the user
    user = users_collection.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    # Step 2: Check the password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    # Step 3: Create a token that stores the user's id
    token = create_access_token({"user_id": str(user["_id"])})

    return {
        "message": "Login successful!",
        "access_token": token,
        "token_type": "bearer",
        "user": user_helper(user),
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    """
    Get information about the currently logged-in user.
    The 'Depends(get_current_user)' automatically checks the
    Authorization header and finds the logged-in user for us.
    """
    return user_helper(current_user)
