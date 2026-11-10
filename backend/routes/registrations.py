# routes/registrations.py
# This file contains all the API endpoints related to event registrations:
# - Register the logged-in user for an event
# - Cancel a registration
# - Get all events the logged-in user has registered for
# - Get the list of participants for a specific event (for the event creator)

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from database import registrations_collection, events_collection, users_collection
from schemas import RegistrationCreate
from models import registration_helper, event_helper, user_helper
from auth import get_current_user

router = APIRouter(prefix="/api/registrations", tags=["Registrations"])


@router.post("")
def register_for_event(registration: RegistrationCreate, current_user=Depends(get_current_user)):
    """
    Register the logged-in user for an event.
    Steps:
    1. Make sure the event exists.
    2. Make sure there are seats available.
    3. Make sure the user hasn't already registered for this event.
    4. Save the registration and reduce available_seats by 1.
    """
    try:
        event = events_collection.find_one({"_id": ObjectId(registration.event_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event id.")

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event["available_seats"] <= 0:
        raise HTTPException(status_code=400, detail="Sorry, this event is fully booked.")

    user_id = str(current_user["_id"])

    # Check if the user already registered for this event
    existing = registrations_collection.find_one({
        "user_id": user_id,
        "event_id": registration.event_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="You are already registered for this event.")

    # Create the registration
    new_registration = {
        "user_id": user_id,
        "event_id": registration.event_id,
        "registered_at": datetime.utcnow().isoformat(),
    }
    registrations_collection.insert_one(new_registration)

    # Reduce the available seats by 1
    events_collection.update_one(
        {"_id": ObjectId(registration.event_id)},
        {"$inc": {"available_seats": -1}},
    )

    return {"message": "You have successfully registered for this event!"}


@router.delete("/{event_id}")
def cancel_registration(event_id: str, current_user=Depends(get_current_user)):
    """
    Cancel the logged-in user's registration for a specific event.
    This also gives back the seat (increases available_seats by 1).
    """
    user_id = str(current_user["_id"])

    registration = registrations_collection.find_one({
        "user_id": user_id,
        "event_id": event_id,
    })

    if not registration:
        raise HTTPException(status_code=404, detail="You are not registered for this event.")

    registrations_collection.delete_one({"_id": registration["_id"]})

    # Give the seat back to the event
    try:
        events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$inc": {"available_seats": 1}},
        )
    except InvalidId:
        pass  # If the event was already deleted, we just skip this step

    return {"message": "Your registration has been cancelled."}


@router.get("/my-events")
def get_my_registered_events(current_user=Depends(get_current_user)):
    """
    Get the full list of events the logged-in user has registered for.
    """
    user_id = str(current_user["_id"])

    my_registrations = registrations_collection.find({"user_id": user_id})

    my_events = []
    for reg in my_registrations:
        try:
            event = events_collection.find_one({"_id": ObjectId(reg["event_id"])})
        except InvalidId:
            event = None

        if event:
            my_events.append(event_helper(event))

    return my_events


@router.get("/event/{event_id}")
def get_event_participants(event_id: str, current_user=Depends(get_current_user)):
    """
    Get the list of users registered for a specific event.
    Only the event creator is allowed to see this list.
    """
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event id.")

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event["created_by"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You are not allowed to view these participants.")

    registrations = registrations_collection.find({"event_id": event_id})

    participants = []
    for reg in registrations:
        try:
            user = users_collection.find_one({"_id": ObjectId(reg["user_id"])})
        except InvalidId:
            user = None

        if user:
            participants.append(user_helper(user))

    return participants
