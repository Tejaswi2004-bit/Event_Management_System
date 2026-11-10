# EventHub — Event Management & Registration System

A beginner-friendly, full-stack web application for creating events, browsing
events, and registering to attend them.

This project was built to be **simple enough for a beginner to understand**,
but **polished enough to use as a portfolio project**.

---

## 1. Project Description

EventHub lets users:

- Create an account and log in
- Browse and search upcoming events
- View full event details
- Register (and cancel registration) for events
- Create, edit, and delete their own events
- See a personal dashboard with stats and event management tools

The project is split into three independent parts: a **plain HTML/CSS/JS
frontend**, a **FastAPI backend**, and a **MongoDB database**.

---

## 2. Features

**Visitor / User**
- Register and log in (JWT-based authentication)
- Browse all events
- Search events by title
- Filter events by category
- View full event details, including seats remaining
- Register for an event / cancel a registration
- View "My Events" (events they registered for)

**Event Creator**
- Create a new event
- Edit an existing event (only the creator can edit)
- Delete an event (only the creator can delete)
- View the list of participants registered for their event
- View dashboard stats (events created, events registered for)

---

## 3. Technologies Used

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Frontend  | HTML, CSS, Vanilla JavaScript        |
| Backend   | Python, FastAPI, Pydantic            |
| Database  | MongoDB (via PyMongo)                |
| Auth      | JWT (python-jose) + bcrypt (passlib) |

No frontend frameworks (React/Angular/Vue), no CSS frameworks
(Bootstrap/Tailwind), and no SQL databases are used, by design — this keeps
the project approachable for beginners.

---

## 4. Project Structure

```text
EventManagementSystem/
│
├── frontend/
│   ├── index.html            # Home / featured events
│   ├── login.html            # Login form
│   ├── register.html         # Registration form
│   ├── events.html           # Browse all events (search + filter)
│   ├── event-details.html    # Single event details + register/edit/delete
│   ├── create-event.html     # Create OR edit an event (?id=... = edit mode)
│   ├── my-events.html        # Events the user registered for
│   ├── dashboard.html        # Stats + events the user created
│   │
│   ├── css/
│   │   └── style.css         # All styling for the site
│   │
│   └── js/
│       ├── main.js           # Shared helpers (auth storage, navbar, messages)
│       ├── auth.js           # Login / Register form logic
│       ├── events.js         # Event listing/details/create/edit/delete/dashboard
│       └── registrations.js  # Register/cancel/my-events logic
│
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── database.py            # MongoDB connection (PyMongo)
│   ├── models.py               # Helpers to convert MongoDB docs -> JSON
│   ├── schemas.py              # Pydantic request/response models
│   ├── auth.py                 # Password hashing + JWT logic
│   ├── requirements.txt        # Python dependencies
│   │
│   └── routes/
│       ├── users.py            # /api/users - register, login, me
│       ├── events.py           # /api/events - CRUD + search/filter
│       └── registrations.py    # /api/registrations - register/cancel/lists
│
├── README.md
└── .gitignore
```

---

## 5. MongoDB Setup

You need MongoDB installed and running locally (or a MongoDB Atlas cloud
cluster).

**Option A — Local MongoDB (recommended for beginners)**

1. Download and install MongoDB Community Server:
   https://www.mongodb.com/try/download/community
2. Start the MongoDB service. On Windows, MongoDB usually installs as a
   background service and starts automatically. On Mac/Linux you can run:
   ```bash
   mongod
   ```
3. By default MongoDB runs at `mongodb://localhost:27017`, which is already
   configured in `backend/database.py`. No changes needed.

**Option B — MongoDB Atlas (cloud)**

1. Create a free cluster at https://www.mongodb.com/atlas
2. Get your connection string (it looks like
   `mongodb+srv://user:password@cluster.mongodb.net`)
3. Open `backend/database.py` and replace the `MONGO_URL` value with your
   connection string.

You do **not** need to manually create the database or collections —
MongoDB and PyMongo create them automatically the first time data is saved.

---

## 6. Python Virtual Environment Setup

It's good practice to use a virtual environment so your Python packages
don't clash with other projects.

Open a terminal **inside the `backend/` folder** and run:

```bash
python -m venv venv
```

**Activate the virtual environment:**

Windows (Command Prompt):
```bash
venv\Scripts\activate
```

Windows (PowerShell):
```bash
venv\Scripts\Activate.ps1
```

Mac / Linux:
```bash
source venv/bin/activate
```

You'll know it worked because your terminal prompt will show `(venv)` at
the start.

---

## 7. Installation Commands

With your virtual environment activated, install all backend dependencies:

```bash
pip install -r requirements.txt
```

---

## 8. How to Start FastAPI

Still inside the `backend/` folder, with the virtual environment activated,
run:

```bash
uvicorn main:app --reload
```

You should see output like:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

The `--reload` flag automatically restarts the server whenever you change
the code — very useful while learning/developing.

---

## 9. How to Open the Frontend

The frontend is plain HTML/CSS/JS, so it doesn't need a build step.

**Easiest way (VS Code):**
1. Open the `frontend/` folder in VS Code.
2. Install the "Live Server" extension (if you don't already have it).
3. Right-click `index.html` → "Open with Live Server".

**Alternative way:**
Just double-click `frontend/index.html` to open it directly in your
browser. This also works, though Live Server gives you auto-refresh on
save.

> Make sure the FastAPI backend (step 8) is running **before** you use the
> frontend, otherwise API calls will fail.

---

## 10. API Documentation / Swagger URL

Once the backend is running, FastAPI automatically generates interactive
API documentation. Visit:

```text
http://127.0.0.1:8000/docs
```

From there you can see and test every endpoint directly in the browser.

---

## 11. Example API Requests

**Register a user**
```bash
POST http://127.0.0.1:8000/api/users/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "mypassword"
}
```

**Log in**
```bash
POST http://127.0.0.1:8000/api/users/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "mypassword"
}
```
This returns an `access_token` — copy it and use it in the
`Authorization: Bearer <token>` header for protected requests below.

**Create an event** (requires login token)
```bash
POST http://127.0.0.1:8000/api/events
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "title": "Community Music Night",
  "description": "An evening of live local music.",
  "date": "2026-11-15",
  "time": "18:30",
  "location": "City Community Hall",
  "category": "Music",
  "total_seats": 100
}
```

**Get all events**
```bash
GET http://127.0.0.1:8000/api/events
```

**Search events by title**
```bash
GET http://127.0.0.1:8000/api/events?search=music
```

**Register for an event** (requires login token)
```bash
POST http://127.0.0.1:8000/api/registrations
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "event_id": "<event_id_here>"
}
```

---

## 12. Common Errors and Solutions

| Problem | Likely Cause | Solution |
|---|---|---|
| `Could not connect to the server` (in the browser) | FastAPI backend isn't running | Run `uvicorn main:app --reload` inside `backend/` |
| `ServerSelectionTimeoutError` in the terminal | MongoDB isn't running | Start MongoDB (`mongod`) or check your Atlas connection string |
| CORS error in the browser console | Frontend opened without Live Server, or backend CORS misconfigured | Make sure `main.py`'s CORS middleware is unchanged; try using Live Server |
| `401 Unauthorized` on create/edit/delete/register | You're not logged in, or your token expired | Log out and log back in to get a fresh token |
| `Invalid event id` | The URL is missing `?id=...` or the event was deleted | Go back to the Events page and click into an event again |
| `ModuleNotFoundError` when running `uvicorn` | Virtual environment not activated, or dependencies not installed | Activate `venv` and re-run `pip install -r requirements.txt` |
| Port `8000` already in use | Another program (or another backend instance) is using it | Stop the other process, or run `uvicorn main:app --reload --port 8001` and update `API_BASE_URL` in `frontend/js/main.js` to match |

---

## Notes

- Passwords are hashed with bcrypt before being stored — plain text
  passwords are never saved.
- The JWT secret key in `backend/auth.py` is hardcoded for simplicity in
  this beginner project. In a real production app, this should come from
  an environment variable and never be committed to source control.
- Only the user who created an event can edit, delete it, or view its
  participant list.

Enjoy building on top of EventHub!
