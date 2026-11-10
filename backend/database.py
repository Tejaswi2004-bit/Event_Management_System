# database.py
# This file handles the connection to our MongoDB database.
# We use PyMongo to connect Python/FastAPI to MongoDB.

from pymongo import MongoClient

# -----------------------------
# MongoDB Connection Settings
# -----------------------------
# By default, MongoDB runs locally on this address.
# If you use MongoDB Atlas (cloud), replace this with your connection string.
MONGO_URL = "mongodb://localhost:27017"

# Create a connection client to MongoDB
client = MongoClient(MONGO_URL)

# Select (or create) the database named "event_management"
db = client["event_management"]

# -----------------------------
# Collections
# -----------------------------
# Think of a "collection" like a table in SQL databases.
users_collection = db["users"]
events_collection = db["events"]
registrations_collection = db["registrations"]
