# CV Builder

A full-stack professional CV builder platform with dual-theme UI (dark/light), glassmorphism design, 5 designer-crafted templates, instant live preview, secure authentication, email verification, and server-rendered PDF export.

## ✨ Features

- **5 Professional Templates** — Modern Slate, Executive Ivory, Neon Pulse, Minimal Breeze, Royal Azure
- **Live CV Preview** — Real-time preview updates instantly as you type (client-side rendering)
- **Dark / Light Theme** — Toggle between premium dark mode and high-contrast light mode
- **PDF Export** — Server-rendered PDF via Puppeteer with print-ready quality
- **19 Colour Themes** — Including white/clean option for minimal designs
- **CV Completeness Score** — Animated progress indicator
- **Secure Authentication** — JWT + HttpOnly cookies, bcrypt password hashing
- **Email Verification** — Token-based verification via SMTP
- **Brute-Force Protection** — Account lockout after 5 failed login attempts
- **Rate Limiting** — Global + per-route rate limits
- **Audit Logging** — Login and signup attempts logged with IP and user agent
- **Avatar Upload** — Profile photo upload with image validation (shown in all templates)
- **Modern Date Pickers** — Month/year pickers for education and experience dates
- **Template Gallery** — Browse all templates with live previews before signing up
- **Legal & Ethics Page** — Covering data privacy, ethical AI, and social impact
- **Smart Redirects** — Auto-redirect to dashboard if already logged in

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Material UI 5 |
| Backend | Node.js, Express 4 |
| Database | SQLite (via `sqlite3`) |
| Auth | JWT, bcryptjs, HttpOnly cookies |
| PDF | Puppeteer (headless Chromium) |
| Templating | Mustache (server + client) |
| Email | Nodemailer |
| Security | Helmet, CORS, express-rate-limit, sanitize-html, express-validator |

## 📁 Project Structure

```
cv-builder/
├── client/                    ← React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Navbar + drawer + theme toggle
│   │   │   ├── CvBuilder.jsx       # CV form editor + colour themes
│   │   │   ├── CvPreview.jsx       # Live preview iframe
│   │   │   └── TemplatePicker.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx            # 3D animated landing page
│   │   │   ├── Login.jsx           # Glass auth card
│   │   │   ├── Signup.jsx          # Auth card + password meter
│   │   │   ├── Dashboard.jsx       # Split-pane editor + live preview
│   │   │   ├── About.jsx           # Clickable feature cards
│   │   │   ├── Templates.jsx       # Template gallery
│   │   │   ├── BlogSecurity.jsx    # Security blog page
│   │   │   ├── BlogPerformance.jsx # Performance blog page
│   │   │   ├── Legal.jsx           # Legal & ethics page
│   │   │   └── NotFound.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx     # Auth state management
│   │   │   └── ThemeContext.jsx    # Dark/light theme toggle
│   │   ├── theme.js                # MUI theme factory (dark + light)
│   │   ├── index.css               # Global CSS + dual-theme variables
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                    ← Node.js + Express backend
│   ├── routes/
│   │   ├── auth.js                 # Signup, login, verify, refresh, logout, me
│   │   ├── cv.js                   # Templates, save, preview, raw template, download PDF
│   │   └── admin.js                # Audit log viewer (admin only)
│   ├── middleware/
│   │   └── auth.js                 # JWT verify + role guard
│   ├── db/
│   │   ├── schema.sql              # Original PostgreSQL schema (reference)
│   │   └── schema_sqlite.sql       # Active SQLite schema + seed templates
│   ├── uploads/                    # Avatar uploads directory
│   ├── server.js                   # Express app entry point
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example                # Template for .env
│   └── package.json
│
├── HOSTING_GUIDE.md           # Free hosting deployment guide
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (recommended v20+) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

> **⚠️ Windows Users:** If you see `npm.ps1 cannot be loaded` or execution policy errors in PowerShell, use `npm.cmd` instead of `npm` for ALL commands below. This is a common Windows PowerShell restriction.

### 1. Clone and configure

```powershell
git clone <repository-url>
cd cv-builder
```

Copy the environment file:

```powershell
# Windows (PowerShell)
Copy-Item server\.env.example server\.env

# Mac/Linux
cp server/.env.example server/.env
```

### 2. Edit `server/.env`

Open `server/.env` in a text editor and set these values:

```env
NODE_ENV=development
JWT_SECRET=your-random-secret-here
REFRESH_TOKEN_SECRET=another-random-secret-here
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-password
BASE_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:3000
```

> **Note:** In development mode (`NODE_ENV=development`), new accounts are automatically verified so you can test without SMTP credentials.

### 3. Install dependencies

> **Important:** Run each command separately. Do NOT chain commands with `&&`.

**Install backend dependencies:**

```powershell
# Navigate to server directory and install
cd server
npm.cmd install
```

If `npm.cmd install` does not work, try:
```powershell
npm install
```

**Install frontend dependencies:**

```powershell
# Navigate to client directory and install
cd ..\client
npm.cmd install
```

If `npm.cmd install` does not work, try:
```powershell
npm install
```

> **Troubleshooting `npm`:**
> - If you get `npm.ps1 cannot be loaded`, run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` then try again.
> - Or simply use `npm.cmd` instead of `npm` for every command.
> - On Mac/Linux, `npm install` works directly — no `.cmd` needed.

### 4. Start the servers

Open **two separate terminal windows**:

**Terminal 1 — Backend:**
```powershell
cd server
npm.cmd start
```
Expected output:
```
🚀 Server listening on 5000
✅ Connected to SQLite database.
✅ Database schema initialized.
```

**Terminal 2 — Frontend:**
```powershell
cd client
npm.cmd run dev
```
Expected output:
```
VITE v5.x.x  ready in 300 ms
➜  Local:   http://localhost:3000/
```

### 5. Open in browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Create account | — |
| POST | `/api/auth/login` | Login (sets cookies) | — |
| GET | `/api/auth/verify?token=` | Email verification | — |
| POST | `/api/auth/refresh` | Refresh access token | Cookie |
| POST | `/api/auth/logout` | Logout (clears cookies) | Cookie |
| GET | `/api/auth/me` | Get current user | Cookie |

### CV Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cv/templates` | List active templates | — |
| GET | `/api/cv/template-preview/:id` | Preview template with sample data | — |
| GET | `/api/cv/template-raw/:id` | Get raw template + stylesheet | — |
| GET | `/api/cv/my` | Get user's saved CV | Cookie |
| POST | `/api/cv/save` | Save CV data | Cookie |
| GET | `/api/cv/preview` | Get rendered CV HTML | Cookie |
| GET | `/api/cv/download/:cvId` | Download PDF | Cookie + Verified |
| POST | `/api/cv/upload-avatar` | Upload profile photo | Cookie |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/login-logs` | View login audit logs | Cookie + Admin |

## 🔒 Security Features

- **JWT Authentication** — Short-lived access tokens (15 min) + refresh tokens (7 days)
- **HttpOnly Cookies** — Tokens stored in HttpOnly cookies, not localStorage
- **Password Hashing** — bcrypt with 12 salt rounds
- **Input Validation** — express-validator on all endpoints
- **XSS Protection** — sanitize-html on all user content
- **SQL Injection Prevention** — Parameterized queries throughout
- **Rate Limiting** — 1000 req/15 min global, 5 req/10 min on login/signup
- **Brute-Force Lockout** — Account locked for 30 minutes after 5 failed attempts
- **Helmet** — CSP, HSTS, X-Frame-Options, referrer policy
- **Audit Logging** — All login/signup attempts logged with IP and user agent

## 🗃️ CV Templates

| # | Template | Style |
|---|----------|-------|
| 1 | **Modern Slate** | Dark, polished with gradient header |
| 2 | **Executive Ivory** | Light, serif typography for corporate roles |
| 3 | **Neon Pulse** | Cyberpunk monospace with neon accents |
| 4 | **Minimal Breeze** | Ultra-clean with generous whitespace |
| 5 | **Royal Azure** | Two-column sidebar layout in blue tones |

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm.ps1 cannot be loaded` on Windows | Use `npm.cmd` instead of `npm`, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `&&` not working in PowerShell | Run commands one at a time — do not chain with `&&` |
| Frontend can't connect to backend | Check `server/.env` has `FRONTEND_ORIGIN=http://localhost:3000` |
| Login fails after signup | In dev mode accounts are auto-verified. In production, check email verification. |
| 404 on frontend root | Ensure Vite is running; use the port shown in the console |
| PDF download fails | Ensure Puppeteer/Chromium can launch (`--no-sandbox` flag is set) |
| PDF shows "failed to load" | The download uses `arraybuffer` response — check browser console for errors |
| Avatar not showing in preview | Ensure both servers are running; Vite proxies `/uploads` to backend |
| Database errors after schema changes | Delete `server/cv_builder.db` and restart backend to reinitialize |
| Cookies not sent | Ensure `sameSite: 'lax'` in dev; browser must not block third-party cookies |
| `node_modules` errors | Delete `node_modules` folder and `package-lock.json`, then run `npm.cmd install` again |

## 📦 Production Deployment

For production:

1. Set `NODE_ENV=production` in `.env`
2. Generate strong random secrets for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
3. Configure real SMTP credentials
4. Build the frontend: `cd client && npm.cmd run build`
5. Serve the `client/dist/` folder via Nginx or similar
6. Set up HTTPS (required for `secure: true` cookies)
7. Run `npm.cmd audit fix` on both packages
8. See [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) for free hosting options

## 📄 License

Private — All rights reserved.
