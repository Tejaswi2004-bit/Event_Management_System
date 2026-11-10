// events.js
// This file handles everything related to EVENTS:
// - Showing featured events on the home page
// - Showing the full list of events with search/filter
// - Showing one event's details
// - Creating and editing events
// - Deleting events
// - The dashboard (stats + "my created events" + participants)

// -----------------------------
// Helper: read a value from the page URL
// -----------------------------
// Example: event-details.html?id=123  ->  getQueryParam("id") returns "123"
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// -----------------------------
// Helper: build the HTML for one event card
// -----------------------------
function buildEventCardHTML(event) {
  let seatsClass = "seats-left";
  let seatsText = event.available_seats + " seats left";

  if (event.available_seats <= 0) {
    seatsClass = "seats-left full";
    seatsText = "Fully booked";
  }

  let registerButton = "";

  if (event.available_seats <= 0) {
    registerButton = `
      <button class="btn btn-outline btn-small" disabled>
        Fully Booked
      </button>
    `;
  } else if (!isLoggedIn()) {
    registerButton = `
      <a class="btn btn-primary btn-small" href="login.html">
        Login to Register
      </a>
    `;
  } else {
    registerButton = `
      <a class="btn btn-primary btn-small" href="event-details.html?id=${event.id}">
        Register
      </a>
    `;
  }

  return `
    <div class="event-card">
      <span class="category-tag">${event.category}</span>

      <h3>${event.title}</h3>

      <p class="event-meta">
        ${formatDate(event.date)} at ${event.time}
      </p>

      <p class="event-meta">
        ${event.location}
      </p>

      <p class="${seatsClass}">
        ${seatsText}
      </p>

      <div class="card-actions">
        <a class="btn btn-outline btn-small"
           href="event-details.html?id=${event.id}">
          View Details
        </a>

        ${registerButton}
      </div>
    </div>
  `;
}

// -----------------------------
// Home page: show a few featured/recent events
// -----------------------------
function loadFeaturedEvents() {
  const container = document.getElementById("featuredEvents");
  if (!container) {
    return;
  }

  fetch(API_BASE_URL + "/api/events")
    .then(function (response) {
      return response.json();
    })
    .then(function (events) {
      if (events.length === 0) {
        container.innerHTML = '<p class="empty-state">No events yet. Be the first to create one!</p>';
        return;
      }

      // Only show the first 3 events on the home page
      const featured = events.slice(0, 3);
      let html = "";
      for (let i = 0; i < featured.length; i++) {
        html += buildEventCardHTML(featured[i]);
      }
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<p class="empty-state">Could not load events. Is the backend running?</p>';
    });
}

// -----------------------------
// Events page: full list with search + category filter
// -----------------------------
function loadEventsList() {
  const container = document.getElementById("eventsList");
  if (!container) {
    return;
  }

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  const searchValue = searchInput ? searchInput.value : "";
  const categoryValue = categoryFilter ? categoryFilter.value : "";

  // Build the URL with query parameters
  let url = API_BASE_URL + "/api/events?";
  if (searchValue) {
    url += "search=" + encodeURIComponent(searchValue) + "&";
  }
  if (categoryValue) {
    url += "category=" + encodeURIComponent(categoryValue) + "&";
  }

  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (events) {
      if (events.length === 0) {
        container.innerHTML = '<p class="empty-state">No events match your search.</p>';
        return;
      }

      let html = "";
      for (let i = 0; i < events.length; i++) {
        html += buildEventCardHTML(events[i]);
      }
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<p class="empty-state">Could not load events. Is the backend running?</p>';
    });
}

// -----------------------------
// Event details page
// -----------------------------
function loadEventDetails() {
  const container = document.getElementById("eventDetailsBox");
  if (!container) {
    return;
  }

  const eventId = getQueryParam("id");
  if (!eventId) {
    container.innerHTML = '<p class="empty-state">No event was specified.</p>';
    return;
  }

  fetch(API_BASE_URL + "/api/events/" + eventId)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Event not found");
      }
      return response.json();
    })
    .then(function (event) {
      const currentUser = getUser();
      const isOwner = currentUser && currentUser.id === event.created_by;

      let seatsText = event.available_seats + " of " + event.total_seats + " seats available";
      let registerButtonHTML = "";

      if (!isLoggedIn()) {
        registerButtonHTML = '<a href="login.html" class="btn btn-primary">Log in to Register</a>';
      } else if (isOwner) {
        registerButtonHTML = `
          <a href="create-event.html?id=${event.id}" class="btn btn-outline">Edit Event</a>
          <button class="btn btn-danger" id="deleteEventBtn">Delete Event</button>
        `;
      } else if (event.available_seats <= 0) {
        registerButtonHTML = '<button class="btn btn-outline" disabled>Fully Booked</button>';
      } else {
        registerButtonHTML = '<button class="btn btn-primary" id="registerBtn">Register for this Event</button>';
      }

      container.innerHTML = `
        <div class="event-details-box card">
          <span class="category-tag">${event.category}</span>
          <h1>${event.title}</h1>
          <p>${event.description}</p>
          <ul class="event-meta-list">
            <li><strong>Date:</strong> ${formatDate(event.date)}</li>
            <li><strong>Time:</strong> ${event.time}</li>
            <li><strong>Location:</strong> ${event.location}</li>
            <li><strong>Seats:</strong> ${seatsText}</li>
          </ul>
          <div id="messageBox" class="message"></div>
          <div class="card-actions">${registerButtonHTML}</div>
        </div>
      `;

      // Attach the register button behavior (function lives in registrations.js)
      const registerBtn = document.getElementById("registerBtn");
      if (registerBtn) {
        registerBtn.addEventListener("click", function () {
          registerForEvent(event.id);
        });
      }

      // Attach the delete button behavior
      const deleteBtn = document.getElementById("deleteEventBtn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
          deleteEventById(event.id, true);
        });
      }
    })
    .catch(function () {
      container.innerHTML = '<p class="empty-state">This event could not be found.</p>';
    });
}

// -----------------------------
// Delete an event (used on event-details page and dashboard)
// -----------------------------
function deleteEventById(eventId, redirectAfter) {
  const confirmDelete = confirm("Are you sure you want to delete this event? This cannot be undone.");
  if (!confirmDelete) {
    return;
  }

  fetch(API_BASE_URL + "/api/events/" + eventId, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  })
    .then(function (response) {
      return response.json().then(function (data) {
        return { status: response.status, body: data };
      });
    })
    .then(function (result) {
      if (result.status === 200) {
        alert("Event deleted successfully.");
        if (redirectAfter) {
          window.location.href = "dashboard.html";
        } else {
          loadDashboard(); // refresh the dashboard list
        }
      } else {
        alert(result.body.detail || "Could not delete this event.");
      }
    })
    .catch(function () {
      alert("Could not connect to the server.");
    });
}

// -----------------------------
// Create / Edit event form (create-event.html)
// -----------------------------
function setupEventForm() {
  const eventForm = document.getElementById("eventForm");
  if (!eventForm) {
    return;
  }

  // Require login to access this page
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const eventId = getQueryParam("id"); // if present, we are EDITING, not creating
  const pageTitle = document.getElementById("formTitle");
  const submitBtn = document.getElementById("submitBtn");

  if (eventId) {
    // EDIT MODE: fetch the existing event and pre-fill the form
    if (pageTitle) {
      pageTitle.textContent = "Edit Event";
    }
    if (submitBtn) {
      submitBtn.textContent = "Save Changes";
    }

    fetch(API_BASE_URL + "/api/events/" + eventId)
      .then(function (response) {
        return response.json();
      })
      .then(function (event) {
        document.getElementById("title").value = event.title;
        document.getElementById("description").value = event.description;
        document.getElementById("date").value = event.date;
        document.getElementById("time").value = event.time;
        document.getElementById("location").value = event.location;
        document.getElementById("category").value = event.category;
        document.getElementById("total_seats").value = event.total_seats;
      });
  }

  eventForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const location = document.getElementById("location").value;
    const category = document.getElementById("category").value;
    const totalSeats = document.getElementById("total_seats").value;

    // Basic validation
    if (title === "" || description === "" || date === "" || time === "" || location === "" || category === "") {
      showMessage("messageBox", "Please fill in all fields.", "error");
      return;
    }

    if (totalSeats <= 0) {
      showMessage("messageBox", "Total seats must be at least 1.", "error");
      return;
    }

    const eventData = {
      title: title,
      description: description,
      date: date,
      time: time,
      location: location,
      category: category,
      total_seats: Number(totalSeats),
    };

    // Decide whether to CREATE (POST) or UPDATE (PUT)
    let url = API_BASE_URL + "/api/events";
    let method = "POST";
    if (eventId) {
      url = API_BASE_URL + "/api/events/" + eventId;
      method = "PUT";
    }

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify(eventData),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { status: response.status, body: data };
        });
      })
      .then(function (result) {
        if (result.status === 200) {
          showMessage("messageBox", "Event saved successfully! Redirecting...", "success");
          setTimeout(function () {
            window.location.href = "dashboard.html";
          }, 1200);
        } else {
          showMessage("messageBox", result.body.detail || "Could not save this event.", "error");
        }
      })
      .catch(function () {
        showMessage("messageBox", "Could not connect to the server.", "error");
      });
  });
}

// -----------------------------
// Dashboard page
// -----------------------------
function loadDashboard() {
  const myEventsContainer = document.getElementById("myCreatedEvents");
  if (!myEventsContainer) {
    return; // not on the dashboard page
  }

  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const currentUser = getUser();

  // Load all events, then filter to only the ones this user created
  fetch(API_BASE_URL + "/api/events")
    .then(function (response) {
      return response.json();
    })
    .then(function (allEvents) {
      const myEvents = [];
      for (let i = 0; i < allEvents.length; i++) {
        if (allEvents[i].created_by === currentUser.id) {
          myEvents.push(allEvents[i]);
        }
      }

      // Update stat: number of events created
      const createdCountEl = document.getElementById("createdCount");
      if (createdCountEl) {
        createdCountEl.textContent = myEvents.length;
      }

      if (myEvents.length === 0) {
        myEventsContainer.innerHTML = '<p class="empty-state">You have not created any events yet.</p>';
      } else {
        let html = "";
        for (let i = 0; i < myEvents.length; i++) {
          const ev = myEvents[i];
          html += `
            <div class="event-card">
              <span class="category-tag">${ev.category}</span>
              <h3>${ev.title}</h3>
              <p class="event-meta">${formatDate(ev.date)} at ${ev.time}</p>
              <p class="event-meta">${ev.available_seats} / ${ev.total_seats} seats available</p>
              <div class="card-actions">
                <a class="btn btn-outline btn-small" href="event-details.html?id=${ev.id}">View</a>
                <a class="btn btn-outline btn-small" href="create-event.html?id=${ev.id}">Edit</a>
                <button class="btn btn-danger btn-small" onclick="deleteEventById('${ev.id}', false)">Delete</button>
              </div>
              <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="toggleParticipants('${ev.id}')">View Participants</button>
              </div>
              <div id="participants-${ev.id}"></div>
            </div>
          `;
        }
        myEventsContainer.innerHTML = html;
      }
    });

  // Load registration stats (how many events this user has registered for)
  fetch(API_BASE_URL + "/api/registrations/my-events", {
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (myRegisteredEvents) {
      const registeredCountEl = document.getElementById("registeredCount");
      if (registeredCountEl) {
        registeredCountEl.textContent = myRegisteredEvents.length;
      }
    });
}

// -----------------------------
// Show/hide the participants list for one of my events (dashboard)
// -----------------------------
function toggleParticipants(eventId) {
  const box = document.getElementById("participants-" + eventId);
  if (!box) {
    return;
  }

  // If it already has content, clicking again just hides it
  if (box.innerHTML !== "") {
    box.innerHTML = "";
    return;
  }

  fetch(API_BASE_URL + "/api/registrations/event/" + eventId, {
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (participants) {
      if (participants.length === 0) {
        box.innerHTML = '<p class="empty-state">No one has registered yet.</p>';
        return;
      }

      let html = "<table><tr><th>Name</th><th>Email</th></tr>";
      for (let i = 0; i < participants.length; i++) {
        html += "<tr><td>" + participants[i].name + "</td><td>" + participants[i].email + "</td></tr>";
      }
      html += "</table>";
      box.innerHTML = html;
    });
}

// -----------------------------
// Run the right function depending on which page we're on
// -----------------------------
document.addEventListener("DOMContentLoaded", function () {
  loadFeaturedEvents();
  loadEventsList();
  loadEventDetails();
  setupEventForm();
  loadDashboard();

  // Attach search/filter listeners on the events page
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  if (searchInput) {
    searchInput.addEventListener("input", loadEventsList);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener("change", loadEventsList);
  }
});
