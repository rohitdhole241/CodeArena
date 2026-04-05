# CodeArena — Algorithmic Practice Ground

## Project Description

**CodeArena** is a web application for practicing coding and algorithm problems. Users can create an account, browse curated challenges by difficulty and topic, open a problem in a code workspace, and track their activity on a personal dashboard.

The project helps learners **practice structured problem-solving** in one place instead of scattering notes across documents or disconnected sites. It is useful for **building a daily coding habit**, seeing problems grouped by difficulty and category, and experimenting with solutions in a simple browser-based workflow.

**How it works today:** the live server stores users and problems in **MongoDB** and exposes a small **REST API** for authentication and problem data. **Code runs and submissions are handled in the browser** (including simulated judging and history in `localStorage`), so you can explore the full UI without a separate code-execution service. The repository also contains **additional backend modules** (routes, controllers, a judge simulator) that are prepared for future integration but are **not** wired into the main server file yet.

---

## Features

- **User registration and login** with JSON Web Tokens (JWT) stored in the browser
- **Problem catalog** loaded from the database with search, difficulty filter, and category filter
- **Problem detail page** with description, examples, constraints, and a multi-language code editor (UI)
- **Run code** and **submit** flows with client-side simulation and feedback
- **Submissions list** with search and filters; data persisted in **browser localStorage** (with optional demo/sample entries)
- **Dashboard** showing welcome text and stats derived from profile and local activity
- **Health check endpoint** for monitoring API and database connectivity
- **Seed data**: default admin and test users plus classic-style sample problems when the database is empty
- **Admin and registration HTML** under `frontend/` for extended UI (admin uses simulated data unless you connect APIs later)
- **Reference SQL files** under `database/` describing a possible relational schema (not used by the running Node app)
- **Jenkins pipeline** example for install and static frontend deploy steps

---

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| **Runtime** | Node.js |
| **Web framework** | Express.js |
| **Database** | MongoDB with Mongoose |
| **Authentication** | JWT (`jsonwebtoken`), password hashing with `bcryptjs` |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), no bundler (static files served by Express) |
| **HTTP / utilities** | `cors`, `body-parser`, `dotenv` |
| **Dev workflow** | `nodemon` for development restarts |

**Also in `package.json` (available for modular/refactored server code):** `express-validator`, `express-rate-limit`, `helmet`, `morgan`, `validator`. The current `backend/server.js` entry point uses a minimal middleware set; these can be adopted when routes are consolidated.

---

## Project Structure

```
CodeArena/
├── backend/
│   ├── server.js              # Main entry: Express app, MongoDB models, API routes, static frontend
│   ├── config/
│   │   └── database.js        # Reusable MongoDB connection helper (optional; not required by server.js)
│   ├── controllers/           # Logic for auth, problems, submissions, admin (for modular setup)
│   ├── middleware/            # JWT auth, validation helpers
│   ├── models/                # Mongoose models (User, Problem, Submission, Hint, Note)
│   ├── routes/                # Express routers (auth, problems, submissions, users, admin)
│   └── utils/                 # judgeSimulator, validation helpers, recommendations
├── frontend/
│   ├── *.html                 # Pages: landing, login, register, dashboard, problems, problem detail, submissions, admin
│   ├── css/                   # Stylesheets (main, dashboard, problems, admin)
│   └── js/                    # Page logic: auth, API helper, dashboard, problems, problem-detail, submissions, admin
├── database/
│   ├── schema.sql             # SQL-style reference schema (documentation / migration ideas)
│   ├── seed.sql               # Sample SQL-oriented seed (not used by Mongoose app)
│   └── view_tables.sql        # Example views
├── package.json               # Scripts and dependencies
├── package-lock.json
├── Jenkinsfile                # CI: npm install, copy frontend to nginx html (customize paths)
└── README.md
```

**Important:** Running `npm start` or `npm run dev` executes **`backend/server.js`**. The files under `backend/routes/` and `backend/controllers/` implement a richer API surface (including submissions and admin) but must be **mounted in `server.js`** (or a new bootstrap) to become active.

---

## Installation & Setup

### Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **MongoDB** running locally or a hosted MongoDB connection string

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd CodeArena
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file in the project root (same folder as `package.json`). Example:

   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-long-random-secret
   MONGODB_URI=mongodb://127.0.0.1:27017/codearena
   ```

   Optional (used by `backend/config/database.js` if you switch to that helper):

   ```env
   DB_MAX_POOL_SIZE=10
   DB_CONNECTION_TIMEOUT=30000
   DB_SOCKET_TIMEOUT=30000
   ```

4. **Start MongoDB**

   - **Windows (local service):** ensure the MongoDB service is running (the server logs suggest `net start MongoDB` when needed).
   - **macOS/Linux:** start `mongod` according to your install.

5. **Run the application**

   **Development (auto-restart on file changes):**

   ```bash
   npm run dev
   ```

   **Production-style (single process):**

   ```bash
   npm start
   ```

6. **Open the app**

   In your browser, go to `http://localhost:3000` (or the port you set in `PORT`).

---

## Usage

### Typical workflow

1. **Register** a new account at `/register` or **log in** at `/login`.
2. After login, open **Problems** (`/problems`) to browse challenges from the API. Use search and filters to narrow the list.
3. Open a problem to view the full statement, examples, and constraints. Pick a language in the UI, edit code, and use **Run** / **Submit** (evaluation is simulated in the browser for the current architecture).
4. Visit **Submissions** to review past attempts stored in this browser.
5. Open **Dashboard** for a summary and profile-driven stats.

### Default accounts (created on first successful DB connection)

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@codearena.com | admin123   |
| User  | user@codearena.com  | user123    |

Change these passwords in any shared or production deployment.

### Health check

```bash
curl http://localhost:3000/health
```

Returns JSON with server status, timestamp, MongoDB connection state, and environment name.

---

## Screenshots / Output

There are no screenshot assets in this repository. After setup you should see:

- **Landing page:** welcome hero and feature cards.
- **Problems:** list of cards with title, difficulty, category, and snippet of the description.
- **Problem detail:** full HTML description, examples, code editor, and action buttons.
- **Terminal:** startup banner with URL, health link, and messages when default users/problems are created.

You can add images later under e.g. `docs/images/` and link them here.

---

## API & Functionality Details

### Implemented in `backend/server.js` (active)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service and MongoDB status |
| `POST` | `/api/auth/register` | Register with `fullName`, `username`, `email`, `password` |
| `POST` | `/api/auth/login` | Login with `email`, `password`; returns JWT and user payload |
| `GET` | `/api/auth/profile` | Current user (header `Authorization: Bearer <token>`) |
| `GET` | `/api/problems` | List active problems (list view truncates description) |
| `GET` | `/api/problems/:id` | Full problem by numeric `id` or MongoDB `_id` |

**Data model (simplified):** Users include `profileStats` (problems solved, submissions, streak fields). Problems include `difficulty` (Easy / Medium / Hard), `category`, `examples`, `constraints`, and `statistics`.

### Client-side behavior

- **Submissions** are saved under the key `submissions` in `localStorage`.
- **Admin panel** (`admin.html` / `admin.js`) uses **simulated** data loading for tables unless you connect it to real endpoints.
- **`API.logout`** in `frontend/js/api.js` calls `/api/auth/logout`, which is **not** defined on the current server (logout is effectively client-side by clearing storage).

### Modular backend (not mounted by default)

Files such as `backend/routes/submissions.js`, `backend/utils/judgeSimulator.js`, and `backend/controllers/*` define **additional** endpoints and judging logic for a future architecture where submissions are stored in MongoDB and validated on the server.

---

## Configuration

| Variable | Purpose | Default (if unset) |
|----------|---------|---------------------|
| `PORT` | HTTP port | `3000` |
| `JWT_SECRET` | Signing key for JWT | Built-in placeholder string (override in production) |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/codearena` |
| `NODE_ENV` | Environment name | `development` |
| `DB_MAX_POOL_SIZE`, `DB_CONNECTION_TIMEOUT`, `DB_SOCKET_TIMEOUT` | Pool/timeouts for `config/database.js` | Sensible defaults in code |

Never commit real secrets; keep `.env` local (it is listed in `.gitignore`).

---

## Future Improvements

- Mount **modular routes** (`backend/routes/*`) in `server.js` and unify models so one schema definition is used everywhere.
- Persist **submissions** in MongoDB and optionally use **`judgeSimulator`** or a real sandbox for execution.
- Implement **`POST /api/auth/logout`** (token blocklist or client-only contract) to match the frontend helper.
- Add **automated tests** (the `npm test` script is currently a placeholder).
- Apply **security middleware** globally (`helmet`, rate limiting, structured logging) for production.
- Replace Jenkins **hard-coded paths** with parameters or environment-specific config.
- Optional: align **`package.json` license** with the repository license if you standardize on MIT.

---

## Contributing

1. Fork the repository and create a branch for your change.
2. Keep changes focused; match existing code style and file organization.
3. Test locally: MongoDB up, `npm run dev`, exercise register/login, problems, and UI flows.
4. Open a pull request with a short description of what you changed and why.

For larger refactors (for example wiring `routes/` into the main server), open an issue first so the approach is agreed.

---

## License

This project is licensed under the **MIT License**.

---

## Author

**[Your Name Here]** — replace with your name, contact, or team attribution.
