# Educational Login Lab

This project is a local educational demo for practicing a simple login form, Express API routes, and SQLite storage. It stores submitted passwords as plain text only because the requested goal is a local testing exercise. Do not use this pattern for production authentication.

## Project Structure

```text
frontend/
  index.html
  admin.html
  style.css
  script.js
backend/
  server.js
  database.js
package.json
```

## Install Dependencies

```bash
npm install
```

## Run Locally

```bash
npm start
```

Then open:

- Login page: `http://localhost:3000`
- Admin page: `http://localhost:3000/admin.html`
- Users API: `http://localhost:3000/users`

The login page does not show a public admin link. The admin page and users API are protected with Basic Admin Login.
Every successful form submission is saved in SQLite. The admin page loads records from the database each time it opens or refreshes, so saved records remain visible after refresh.

Default local admin credentials:

```text
Username: admin
Password: admin123
```

To change them before running the server in PowerShell:

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="your-strong-local-password"
cmd /c npm start
```

The SQLite database file is created automatically at `backend/users.db`.

## Hosting Notes

This project is safe only for local/demo use because it stores passwords as plain text for learning. Do not ask real users to enter real passwords.

For a simple Node host such as Render:

```text
Build Command: npm install
Start Command: npm start
```

Set these environment variables on the host:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-admin-password
DATABASE_PATH=/var/data/users.db
```

If you want SQLite records to stay saved after deploys/restarts, attach a persistent disk and mount it at `/var/data`. Without persistent storage, hosted SQLite data can be lost when the service restarts or redeploys.
