# main.py
# This is the entry point of our FastAPI backend.
# It creates the FastAPI app, sets up CORS (so the frontend can talk
# to the backend), and includes all our route files.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import users, events, registrations

# Create the FastAPI application
app = FastAPI(
    title="Event Management & Registration System API",
    description="A simple beginner-friendly API for managing events and registrations.",
    version="1.0.0",
)

# -----------------------------
# CORS Setup
# -----------------------------
# CORS = Cross-Origin Resource Sharing.
# Since our frontend (HTML/CSS/JS files opened in the browser) runs on
# a different "origin" than our backend (FastAPI server), the browser
# will block requests unless we explicitly allow them here.
# For this beginner project, we allow all origins to keep things simple.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Include Routers
# -----------------------------
# Each router file groups related endpoints together.
app.include_router(users.router)
app.include_router(events.router)
app.include_router(registrations.router)


@app.get("/")
def read_root():
    """A simple welcome route to check that the API is running."""
    return {
        "message": "Welcome to the Event Management & Registration System API!",
        "docs": "Visit /docs to see the interactive API documentation (Swagger UI).",
    }
