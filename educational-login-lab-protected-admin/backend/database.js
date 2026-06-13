const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "users.db");

let db;
let databaseError = null;

function initializeDatabase() {
  try {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    db = new DatabaseSync(databasePath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  } catch (error) {
    databaseError = error;
    console.error("Database initialization failed:", error.message);
  }
}

function ensureDatabaseReady() {
  if (!db || databaseError) {
    const error = new Error("Database is unavailable.");
    error.cause = databaseError;
    throw error;
  }
}

function createUser(username, password) {
  ensureDatabaseReady();

  const createdAt = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO users (username, password, created_at)
    VALUES (?, ?, ?)
  `);

  const result = insert.run(username, password, createdAt);

  return {
    id: Number(result.lastInsertRowid),
    username,
    password,
    created_at: createdAt
  };
}

function getUsers() {
  ensureDatabaseReady();

  return db
    .prepare(
      "SELECT id, username, password, created_at FROM users ORDER BY id DESC"
    )
    .all();
}

function getDatabaseStatus() {
  return {
    ok: Boolean(db && !databaseError),
    path: databasePath,
    error: databaseError ? databaseError.message : null
  };
}

initializeDatabase();

module.exports = {
  createUser,
  getUsers,
  getDatabaseStatus
};
