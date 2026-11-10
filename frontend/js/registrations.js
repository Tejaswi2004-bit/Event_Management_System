// registrations.js
// This file handles:
// - Registering the logged-in user for an event (called from event-details.html)
// - Showing the "My Events" page (events the user registered for)
// - Cancelling a registration

// -----------------------------
// Register for an event
// -----------------------------
// This function is called by the "Register" button on event-details.html
// (the button and its click listener are set up in events.js)
function registerForEvent(eventId) {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  fetch(API_BASE_URL + "/api/registrations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify({ event_id: eventId }),
  })
    .then(function (response) {
      return response.json().then(function (data) {
        return { status: response.status, body: data };
      });
    })
    .then(function (result) {
      if (result.status === 200) {
        showMessage("messageBox", result.body.message, "success");
        // Reload the page after a short delay so the seat count updates
        setTimeout(function () {
          window.location.reload();
        }, 1200);
      } else {
        showMessage("messageBox", result.body.detail || "Could not register for this event.", "error");
      }
    })
    .catch(function () {
      showMessage("messageBox", "Could not connect to the server.", "error");
    });
}

// -----------------------------
// My Events page
// -----------------------------
function loadMyEvents() {
  const container = document.getElementById("myEventsList");
  if (!container) {
    return; // not on the my-events page
  }

  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  fetch(API_BASE_URL + "/api/registrations/my-events", {
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (events) {
      if (events.length === 0) {
        container.innerHTML = '<p class="empty-state">You haven\'t registered for any events yet. <a href="events.html">Browse events</a></p>';
        return;
      }

      let html = "";
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        html += `
          <div class="event-card">
            <span class="category-tag">${ev.category}</span>
            <h3>${ev.title}</h3>
            <p class="event-meta">${formatDate(ev.date)} at ${ev.time}</p>
            <p class="event-meta">${ev.location}</p>
            <div class="card-actions">
              <a class="btn btn-outline btn-small" href="event-details.html?id=${ev.id}">View Details</a>
              <button class="btn btn-danger btn-small" onclick="cancelRegistration('${ev.id}')">Cancel Registration</button>
            </div>
          </div>
        `;
      }
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<p class="empty-state">Could not load your events. Is the backend running?</p>';
    });
}

// -----------------------------
// Cancel a registration
// -----------------------------
function cancelRegistration(eventId) {
  const confirmCancel = confirm("Cancel your registration for this event?");
  if (!confirmCancel) {
    return;
  }

  fetch(API_BASE_URL + "/api/registrations/" + eventId, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function () {
      loadMyEvents(); // refresh the list
    })
    .catch(function () {
      alert("Could not connect to the server.");
    });
}

document.addEventListener("DOMContentLoaded", function () {
  loadMyEvents();
});
