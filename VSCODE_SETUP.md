# VS Code Startup Guide — CV Builder

A step-by-step guide to open, run, and develop the CV Builder project in Visual Studio Code on Windows.

---

## 📋 Prerequisites

Before you begin, ensure the following are installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18+ (recommended v20+) | [nodejs.org](https://nodejs.org/) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Verify installation

Open a terminal and run:

```powershell
node --version    # Should show v18+ or v20+
npm --version     # Should show 9+ or 10+
git --version     # Should show 2.x
```

---

## 🛠️ Recommended VS Code Extensions

Install these extensions for the best development experience:

| Extension | ID | Purpose |
|-----------|----|---------|
| **ES7+ React Snippets** | `dsznajder.es7-react-js-snippets` | React/JSX code snippets |
| **ESLint** | `dbaeumer.vscode-eslint` | JavaScript linting |
| **Prettier** | `esbenp.prettier-vscode` | Code formatting |
| **SQLite Viewer** | `qwtel.sqlite-viewer` | View `cv_builder.db` contents |
| **REST Client** | `humao.rest-client` | Test API endpoints from VS Code |
| **Material Icon Theme** | `pkief.material-icon-theme` | Better file icons |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Auto rename JSX tags |
| **DotENV** | `mikestead.dotenv` | Syntax highlighting for .env |

### Quick install command

Press `Ctrl+Shift+P` → type `Install Extensions` → search and install each one.

Or use the terminal:

```powershell
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension qwtel.sqlite-viewer
code --install-extension humao.rest-client
code --install-extension mikestead.dotenv
```

---

## 🚀 Step-by-Step Setup

### Step 1: Open the project

```powershell
cd C:\Users\ROG-STRIX\OneDrive\Documents\Cv\CV-BUILDER
code .
```

Or from VS Code: `File → Open Folder → select CV-BUILDER folder`

### Step 2: Configure environment variables

1. In VS Code, open `server/.env` from the Explorer sidebar
2. Review and update values as needed:

```env
NODE_ENV=development
JWT_SECRET=your-random-secret-here
REFRESH_TOKEN_SECRET=another-random-secret-here
BASE_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:3000
```

> **Tip:** In development mode, email verification is skipped — accounts are auto-verified on signup.

### Step 3: Install dependencies

Open the **integrated terminal** with `` Ctrl+` `` (backtick), then run:

```powershell
# Install backend dependencies
cd server
npm.cmd install

# Install frontend dependencies
cd ..\client
npm.cmd install

# Return to root
cd ..
```

> **Windows Note:** Use `npm.cmd` instead of `npm` if you see a PowerShell execution policy error about `npm.ps1`.

### Step 4: Start the servers

You need **two terminals** running simultaneously.

#### Terminal 1 — Backend

1. Click the `+` icon in the terminal panel to create a new terminal
2. Run:

```powershell
cd server
npm.cmd start
```

You should see:

```
🚀 Server listening on 5000
✅ Connected to SQLite database.
✅ Database schema initialized.
```

#### Terminal 2 — Frontend

1. Click `+` again for another terminal
2. Run:

```powershell
cd client
npm.cmd run dev
```

You should see:

```
VITE v5.x.x  ready in ~300ms
➜  Local:   http://localhost:3000/
```

### Step 5: Open in browser

- Hold `Ctrl` and click the `http://localhost:3000/` link in the terminal
- Or open your browser and navigate to [http://localhost:3000](http://localhost:3000)

---

## 🖥️ VS Code Workspace Tips

### Split Terminal Layout

For the best workflow, split your terminal into two panes:

1. Open the terminal with `` Ctrl+` ``
2. Right-click the terminal tab → **Split Terminal**
3. Left pane: `cd server && npm.cmd start`
4. Right pane: `cd client && npm.cmd run dev`

### Quick File Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Quick file search (type filename) |
| `Ctrl+Shift+E` | Toggle Explorer sidebar |
| `Ctrl+Shift+F` | Search across all files |
| `Ctrl+B` | Toggle sidebar |
| `F12` | Go to definition |
| `Ctrl+Shift+P` | Command palette |

### Useful files to keep open

- `server/routes/auth.js` — Authentication logic
- `server/routes/cv.js` — CV CRUD + PDF generation
- `client/src/pages/Dashboard.jsx` — Main user interface
- `client/src/components/CvBuilder.jsx` — CV form editor
- `server/.env` — Configuration

---

## 🧪 Testing the App

### Quick E2E Test

1. Go to `http://localhost:3000/signup`
2. Create an account:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@test.com`
   - Password: `TestPass123!`
3. Click **Create Account** → redirects to login
4. Login with the same credentials → redirects to dashboard
5. Fill in CV fields → click **Save**
6. Click **PDF** to download

### Test API with REST Client

If you installed the REST Client extension, create a file `test.http` in the project root:

```http
### Health Check
GET http://localhost:5000/api/cv/templates

### Signup
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@test.com",
  "password": "SecurePass123!"
}

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "jane@test.com",
  "password": "SecurePass123!"
}

### Template Preview
GET http://localhost:5000/api/cv/template-preview/1
```

Click **Send Request** above each block to test.

### View the Database

1. Install the **SQLite Viewer** extension
2. Click on `server/cv_builder.db` in the Explorer
3. Browse tables: `users`, `cvs`, `cv_templates`, `login_logs`, etc.

---

## 🔄 Development Workflow

### Making changes

- **Frontend changes** → Vite auto-reloads the browser (HMR)
- **Backend changes** → Restart the server manually (`Ctrl+C` then `npm.cmd start`)
  - Or use nodemon: `npm.cmd run dev` (auto-restarts on file changes)

### Resetting the database

If you need a fresh start:

```powershell
# Stop the backend server first (Ctrl+C)
cd server
del cv_builder.db
npm.cmd start
# Database will be recreated with fresh schema and seed templates
```

### Building for production

```powershell
cd client
npm.cmd run build
```

The production build outputs to `client/dist/`.

---

## ❓ Common Issues

| Issue | Fix |
|-------|-----|
| `npm.ps1 cannot be loaded` | Use `npm.cmd` instead of `npm` |
| `EADDRINUSE: port 5000` | Another process is using port 5000. Kill it: `npx kill-port 5000` |
| `EADDRINUSE: port 3000` | Kill port 3000: `npx kill-port 3000` |
| Backend won't start | Check `server/.env` exists and has all required keys |
| `Module not found` | Run `npm.cmd install` in both `server/` and `client/` |
| Blank page at localhost:3000 | Make sure the Vite dev server is running |
| Login fails | Check backend terminal for errors. Ensure cookies aren't blocked. |
| PDF download returns error | Puppeteer needs Chromium. Run `npm.cmd install` in server to download it. |
| Database locked | Only one backend instance should run at a time |

---

## 📊 Project Architecture

```
Browser (React SPA)
    │
    │  API calls (JSON + Cookies)
    │  Proxied by Vite (/api → :5000)
    ▼
Express Server (:5000)
    │
    ├── Auth Routes → JWT + bcrypt → SQLite (users, tokens, logs)
    ├── CV Routes → Mustache render → Puppeteer PDF
    └── Static Files → /uploads/avatars/
    │
    ▼
SQLite Database (cv_builder.db)
    ├── users
    ├── cvs (JSON data)
    ├── cv_templates (HTML + CSS)
    ├── refresh_tokens
    ├── email_verifications
    ├── login_logs
    └── signup_logs
```
