# CF Sheet — Codeforces Problem Tracker

> Practice. Improve. Repeat. — by Bhargav Dubey

A public Codeforces problem sheet with secure admin management. Public visitors can browse and solve problems; only the admin can add, edit, or delete them.

## Project Structure

```
cp-sheet/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProblemCard.jsx
│   │   │   ├── RatingSection.jsx
│   │   │   ├── PasskeyModal.jsx
│   │   │   └── AddProblem.jsx
│   │   ├── App.jsx
│   │   └── App.css
│   └── vite.config.js
│
└── server/                  # Node.js + Express backend
    ├── models/Problem.js
    ├── routes/problemRoutes.js
    ├── middleware/adminAuth.js
    ├── server.js
    └── .env                 # ← never commit this
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Configure environment

Edit `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/cpsheet
ADMIN_PASSKEY=your_secret_passkey_here
PORT=5000
```

**Using MongoDB Atlas (recommended for cloud):**
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/cpsheet
```

### 2. Start the backend
```bash
cd server
npm install   # already done
npm run dev   # starts with auto-reload
```

### 3. Start the frontend
```bash
cd client
npm install   # already done
npm run dev   # starts on http://localhost:5173
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/problems/passkey-status` | Public | Check if master passkey has been initialized |
| POST | `/api/problems/setup-passkey` | Public (First-time only) | Set passkey in MongoDB (locked immediately after) |
| POST | `/api/problems/verify-passkey` | — | Validate admin passkey against MongoDB hash |
| GET | `/api/problems` | Public | List problems (supports `?search=`, `?rating=`, `?tag=`) |
| GET | `/api/problems/:id` | Public | Get single problem |
| POST | `/api/problems` | Admin | Create problem |
| PUT | `/api/problems/:id` | Admin | Update problem |
| DELETE | `/api/problems/:id` | Admin | Delete problem |

Admin endpoints require `Authorization: Bearer <passkey>` header.

## Security Design

- **One-time Creation Lock** — Only you can create the passkey on first setup; the backend permanently locks the setup endpoint in MongoDB so nobody else can ever create or overwrite it.
- **Cryptographic Hashing** — Passkey is salted and hashed using `crypto.scrypt` before saving to MongoDB (raw passkey is never saved in the database).
- **Timing-safe Verification** — Uses `crypto.timingSafeEqual` to prevent timing attacks.
- **Backend validates every write request** — `adminAuth.js` middleware checks against the hashed MongoDB passkey.
- **Frontend session** — Passkey stored in `sessionStorage` (cleared on tab close).

---
© Bhargav Dubey
