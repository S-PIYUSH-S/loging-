const path = require("node:path");
const express = require("express");
const { createUser, getUsers, getDatabaseStatus } = require("./database");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const frontendPath = path.join(__dirname, "..", "frontend");
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function sendServerError(res, error, fallbackMessage) {
  console.error(error);

  const databaseUnavailable =
    error instanceof Error && error.message.includes("Database");

  res.status(500).json({
    success: false,
    message: databaseUnavailable
      ? "The database is unavailable. Please check the server and try again."
      : fallbackMessage
  });
}

function rejectAdminRequest(req, res) {
  res.set("WWW-Authenticate", 'Basic realm="Educational Login Lab Admin"');

  if (req.path === "/users") {
    return res.status(401).json({
      success: false,
      message: "Admin access required."
    });
  }

  return res.status(401).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Access Required</title>
      <style>
        body {
          min-height: 100vh;
          margin: 0;
          display: grid;
          place-items: center;
          font-family: Arial, sans-serif;
          background: #f5f7fb;
          color: #20242c;
        }

        main {
          width: min(440px, calc(100% - 32px));
          padding: 28px;
          border: 1px solid #d7deea;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 18px 60px rgba(27, 39, 64, 0.14);
        }

        a {
          color: #146ef5;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <main>
        <h1>Admin access required</h1>
        <p>Please enter the admin username and password to view saved records.</p>
        <p><a href="/">Back to login page</a></p>
      </main>
    </body>
    </html>
  `);
}

function requireAdminAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, encodedCredentials] = header.split(" ");

  if (scheme !== "Basic" || !encodedCredentials) {
    return rejectAdminRequest(req, res);
  }

  let decodedCredentials = "";

  try {
    decodedCredentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
  } catch (error) {
    return rejectAdminRequest(req, res);
  }

  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex === -1) {
    return rejectAdminRequest(req, res);
  }

  const username = decodedCredentials.slice(0, separatorIndex);
  const password = decodedCredentials.slice(separatorIndex + 1);

  if (username !== adminUsername || password !== adminPassword) {
    return rejectAdminRequest(req, res);
  }

  return next();
}

app.get("/api/health", (req, res) => {
  const database = getDatabaseStatus();

  res.status(database.ok ? 200 : 503).json({
    success: database.ok,
    database
  });
});

app.post("/login", (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (isBlank(username) || isBlank(password)) {
      return res.status(400).json({
        success: false,
        message: "Please enter both username and password."
      });
    }

    const savedUser = createUser(username, password);

    return res.status(201).json({
      success: true,
      message: "Submitted login information was saved successfully.",
      id: savedUser.id
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Something went wrong while saving the login information."
    );
  }
});

app.get(["/admin", "/admin.html"], requireAdminAuth, (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

app.get("/users", requireAdminAuth, (req, res) => {
  try {
    return res.json({
      success: true,
      users: getUsers()
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Something went wrong while loading users."
    );
  }
});

app.use(express.static(frontendPath));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "The requested page or endpoint was not found."
  });
});

app.use((error, req, res, next) => {
  sendServerError(res, error, "Unexpected server error.");
});

app.listen(PORT, () => {
  console.log(`Educational login lab is running at http://localhost:${PORT}`);
});
