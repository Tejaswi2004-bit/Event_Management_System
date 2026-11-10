# models.py
# MongoDB documents use a special "_id" field (of type ObjectId) which
# cannot be sent directly as JSON. These helper functions convert
# MongoDB documents into plain Python dictionaries with a simple
# string "id" field, so they can be safely returned by our API.


def user_helper(user) -> dict:
    """Convert a user document from MongoDB into a safe dictionary.
    Notice we do NOT include the password here for security reasons."""
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
    }


def event_helper(event) -> dict:
    """Convert an event document from MongoDB into a plain dictionary."""
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "description": event["description"],
        "date": event["date"],
        "time": event["time"],
        "location": event["location"],
        "category": event["category"],
        "total_seats": event["total_seats"],
        "available_seats": event["available_seats"],
        "created_by": event["created_by"],
        "created_at": event["created_at"],
    }


def registration_helper(registration) -> dict:
    """Convert a registration document from MongoDB into a plain dictionary."""
    return {
        "id": str(registration["_id"]),
        "user_id": registration["user_id"],
        "event_id": registration["event_id"],
        "registered_at": registration["registered_at"],
    }
