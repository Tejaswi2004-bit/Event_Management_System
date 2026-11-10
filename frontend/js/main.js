// main.js
// This file has small helper functions that are shared by every page.
// It handles things like:
// - the backend API address
// - saving/reading the login token from the browser
// - updating the navbar (Login/Logout links)
// - showing success/error messages

// -----------------------------
// 1. Backend API base URL
// -----------------------------
// Change this if your FastAPI server runs on a different address.
const API_BASE_URL = "https://eventhub-backend-rrxi.onrender.com";

// -----------------------------
// 2. Token helper functions
// -----------------------------
// We use the browser's localStorage to remember the user is logged in,
// even after they close and reopen the browser tab.

function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function removeToken() {
  localStorage.removeItem("token");
}

function saveUser(user) {
  // We store the user object as text (JSON), since localStorage
  // can only store strings.
  localStorage.setItem("user", JSON.stringify(user));
}

function getUser() {
  const userText = localStorage.getItem("user");
  if (userText) {
    return JSON.parse(userText);
  }
  return null;
}

function removeUser() {
  localStorage.removeItem("user");
}

function isLoggedIn() {
  const token = getToken();
  if (token) {
    return true;
  }
  return false;
}

function logout() {
  removeToken();
  removeUser();
  window.location.href = "login.html";
}

// -----------------------------
// 3. Navbar helper
// -----------------------------
// Every page has a <div id="navLinks"> where we show either
// "Login / Register" or "Dashboard / My Events / Logout" depending
// on whether the user is logged in.

function setupNavbar() {
  const navLinks = document.getElementById("navLinks");
  const userGreeting = document.getElementById("userGreeting");

  if (!navLinks) {
    return; // this page doesn't have a navbar placeholder
  }

  if (isLoggedIn()) {
    const user = getUser();

    if (userGreeting && user) {
      userGreeting.textContent = "Hi, " + user.name;
    }

    navLinks.innerHTML = `
      <a href="index.html">Home</a>
      <a href="events.html">Events</a>
      <a href="create-event.html">Create Event</a>
      <a href="my-events.html">My Events</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="#" id="logoutLink">Logout</a>
    `;

    // Add the click event for the logout link
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", function (event) {
        event.preventDefault(); // stop the link from jumping the page
        logout();
      });
    }
  } else {
    navLinks.innerHTML = `
      <a href="index.html">Home</a>
      <a href="events.html">Events</a>
      <a href="login.html">Login</a>
      <a href="register.html">Register</a>
    `;
  }
}

// -----------------------------
// 4. Message helper (success / error banners)
// -----------------------------
// Usage: showMessage("messageBox", "Something went wrong", "error")

function showMessage(elementId, text, type) {
  const box = document.getElementById(elementId);
  if (!box) {
    return;
  }
  box.textContent = text;
  box.className = "message show " + type; // type is "success" or "error"
}

function hideMessage(elementId) {
  const box = document.getElementById(elementId);
  if (!box) {
    return;
  }
  box.className = "message";
}

// -----------------------------
// 5. Simple date formatter
// -----------------------------
function formatDate(dateString) {
  if (!dateString) {
    return "";
  }
  const parts = dateString.split("-"); // expects "YYYY-MM-DD"
  if (parts.length !== 3) {
    return dateString;
  }
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

// Run the navbar setup automatically on every page as soon as it loads.
document.addEventListener("DOMContentLoaded", function () {
  setupNavbar();
});
