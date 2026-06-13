function setMessage(element, message, type) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `message ${type ? `is-${type}` : ""}`.trim();
}

function clearInputErrors(inputs) {
  inputs.forEach((input) => input.classList.remove("input-error"));
}

function showInputErrors(inputs) {
  inputs.forEach((input) => input.classList.add("input-error"));
}

function setLoading(isLoading) {
  const overlay = document.getElementById("loading-overlay");

  if (!overlay) {
    return;
  }

  overlay.classList.toggle("is-visible", isLoading);
  overlay.setAttribute("aria-hidden", String(!isLoading));
}

async function readJsonResponse(response) {
  const responseText = await response.text();

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      "Server JSON response nahi bhej raha. App ko http://localhost:3000 se open karo aur Express server running rakho."
    );
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("loginMessage");
  const submitButton = document.getElementById("submitBtn");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const inputs = [usernameInput, passwordInput];

  clearInputErrors(inputs);

  const username = usernameInput.value;
  const password = passwordInput.value;

  if (username.trim().length === 0 || password.trim().length === 0) {
    showInputErrors(inputs);
    setMessage(message, "Please enter both username and password.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Saving...";
  setLoading(true);
  setMessage(message, "", "");

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const result = await readJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to save the login information.");
    }

    form.reset();
    setMessage(message, result.message, "success");
  } catch (error) {
    setMessage(
      message,
      error.message || "The server could not be reached. Please try again.",
      "error"
    );
  } finally {
    setLoading(false);
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function renderUsers(users) {
  const tableBody = document.getElementById("usersTableBody");

  if (!tableBody) {
    return;
  }

  if (!users.length) {
    tableBody.innerHTML = '<tr><td colspan="4">No records found.</td></tr>';
    return;
  }

  tableBody.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");
    const cells = [
      user.id,
      user.username,
      user.password,
      formatDateTime(user.created_at)
    ];

    cells.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

async function loadUsers() {
  const message = document.getElementById("adminMessage");

  try {
    const response = await fetch("/users", {
      credentials: "same-origin"
    });
    const result = await readJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load user records.");
    }

    renderUsers(result.users);
    setMessage(message, `Loaded ${result.users.length} record(s).`, "success");
  } catch (error) {
    renderUsers([]);
    setMessage(
      message,
      error.message || "The server could not be reached. Please try again.",
      "error"
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usersTableBody = document.getElementById("usersTableBody");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (usersTableBody) {
    loadUsers();
  }
});
