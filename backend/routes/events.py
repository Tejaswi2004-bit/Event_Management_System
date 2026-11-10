# routes/events.py
# This file contains all the API endpoints related to events:
# - Create an event
# - Get all events (with optional search/filter)
# - Get a single event
# - Update an event
# - Delete an event

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional

from database import events_collection
from schemas import EventCreate, EventUpdate
from models import event_helper
from auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.post("")
def create_event(event: EventCreate, current_user=Depends(get_current_user)):
    """
    Create a new event.
    Only a logged-in user can create an event.
    The 'available_seats' starts out equal to 'total_seats'.
    """
    new_event = {
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "time": event.time,
        "location": event.location,
        "category": event.category,
        "total_seats": event.total_seats,
        "available_seats": event.total_seats,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow().isoformat(),
    }

    result = events_collection.insert_one(new_event)
    new_event["_id"] = result.inserted_id

    return {
        "message": "Event created successfully!",
        "event": event_helper(new_event),
    }


@router.get("")
def get_all_events(search: Optional[str] = None, category: Optional[str] = None):
    """
    Get all events.
    Supports two optional query parameters:
    - search: search events by title (example: /api/events?search=music)
    - category: filter events by category (example: /api/events?category=Tech)

    Example combined: /api/events?search=music&category=Concert
    """
    # Build a simple MongoDB filter (query) based on what was provided
    query_filter = {}

    if search:
        # "$regex" lets us do a simple "contains" text search.
        # "$options": "i" makes the search case-insensitive.
        query_filter["title"] = {"$regex": search, "$options": "i"}

    if category:
        query_filter["category"] = category

    events = []
    for event in events_collection.find(query_filter).sort("created_at", -1):
        events.append(event_helper(event))

    return events


@router.get("/{event_id}")
def get_single_event(event_id: str):
    """Get the details of one specific event by its id."""
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event id.")

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    return event_helper(event)


@router.put("/{event_id}")
def update_event(event_id: str, event_update: EventUpdate, current_user=Depends(get_current_user)):
    """
    Update an existing event.
    Only the user who created the event is allowed to update it.
    """
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event id.")

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    # Check that the current user owns this event
    if event["created_by"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You are not allowed to edit this event.")

    # Only update the fields the user actually provided
    update_data = {}
    for field, value in event_update.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value

    # If total_seats is being changed, adjust available_seats too
    # (keep the number of already-registered people consistent)
    if "total_seats" in update_data:
        seats_difference = update_data["total_seats"] - event["total_seats"]
        update_data["available_seats"] = event["available_seats"] + seats_difference

    if update_data:
        events_collection.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})

    updated_event = events_collection.find_one({"_id": ObjectId(event_id)})

    return {
        "message": "Event updated successfully!",
        "event": event_helper(updated_event),
    }


@router.delete("/{event_id}")
def delete_event(event_id: str, current_user=Depends(get_current_user)):
    """
    Delete an event.
    Only the user who created the event is allowed to delete it.
    """
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event id.")

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event["created_by"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You are not allowed to delete this event.")

    events_collection.delete_one({"_id": ObjectId(event_id)})

    return {"message": "Event deleted successfully!"}
