// auth.js
// This file handles the Login and Register forms.
// It only runs code for the form that actually exists on the current page.

document.addEventListener("DOMContentLoaded", function () {
  // ----- REGISTER FORM -----
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      // Stop the browser from refreshing the page (default form behavior)
      event.preventDefault();

      // Get the values the user typed in
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Basic form validation
      if (name === "" || email === "" || password === "") {
        showMessage("messageBox", "Please fill in all fields.", "error");
        return;
      }

      if (password.length < 6) {
        showMessage("messageBox", "Password must be at least 6 characters.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showMessage("messageBox", "Passwords do not match.", "error");
        return;
      }

      // Send the registration request to the backend
      fetch(API_BASE_URL + "/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { status: response.status, body: data };
          });
        })
        .then(function (result) {
          if (result.status === 200) {
            showMessage("messageBox", "Registration successful! Redirecting to login...", "success");
            // Wait 1.5 seconds, then go to the login page
            setTimeout(function () {
              window.location.href = "login.html";
            }, 1500);
          } else {
            showMessage("messageBox", result.body.detail || "Registration failed.", "error");
          }
        })
        .catch(function (error) {
          showMessage("messageBox", "Could not connect to the server. Is the backend running?", "error");
        });
    });
  }

  // ----- LOGIN FORM -----
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (email === "" || password === "") {
        showMessage("messageBox", "Please enter both email and password.", "error");
        return;
      }

      fetch(API_BASE_URL + "/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { status: response.status, body: data };
          });
        })
        .then(function (result) {
          if (result.status === 200) {
            // Save the token and user info so the rest of the site
            // knows the user is logged in.
            saveToken(result.body.access_token);
            saveUser(result.body.user);

            showMessage("messageBox", "Login successful! Redirecting...", "success");
            setTimeout(function () {
              window.location.href = "dashboard.html";
            }, 1000);
          } else {
            showMessage("messageBox", result.body.detail || "Login failed.", "error");
          }
        })
        .catch(function (error) {
          showMessage("messageBox", "Could not connect to the server. Is the backend running?", "error");
        });
    });
  }
});
