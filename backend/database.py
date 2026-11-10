
import os
from pymongo import MongoClient

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = MongoClient(MONGO_URL)

db = client["event_management"]

# Collections
users_collection = db["users"]
events_collection = db["events"]
registrations_collection = db["registrations"]
