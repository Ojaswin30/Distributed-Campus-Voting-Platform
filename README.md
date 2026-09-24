# 🗳️ Campus Digital Voting Platform

A modern, secure, and distributed university election platform built with **Python FastAPI**, **SQLite (WAL Mode)**, **React**, and **Vite**. Features strict multi-campus isolation, Google OAuth 2.0 student verification, atomic multi-club ballot submission, and a real-time election administration console.

---

## 🌟 Key Features

- **Multi-Campus Architecture**: Dynamically manages multiple university campuses (e.g., Bengaluru, Noida, Pune, Lucknow). Students and candidates are strictly isolated to their registered campus ballot.
- **Unified Multi-Club Ballot**: Students review and cast votes across all available campus club elections in a single atomic transaction.
- **Google OAuth 2.0 Authentication**: Seamless student sign-in with verified token authentication against pre-registered student rosters.
- **Real-Time Turnout & Leaderboards**: Live participation metrics, dynamic turnout percentage bars, and instant candidate leaderboards.
- **Role-Based Admin Console**:
  - Campus lifecycle management (Add / Edit / Delete).
  - Club creation & candidate assignment.
  - Student registry with individual and bulk CSV import.
  - Immutable audit logs with verifiable batch receipt codes.
- **Modular & Maintainable**: Clean separation into domain repositories, validation schemas, business logic services, and reusable React components.

---

## 📁 Project Architecture

```text
Distributed-Campus-Voting-Platform/
├── backend/
│   ├── config.py                      # Database paths & application settings
│   ├── core/                          # DB connection manager & schema migrations
│   ├── models/                        # Pydantic request/response validation schemas
│   ├── repositories/                  # Domain Data Access Layer (Admin, Campus, Club, Student, Vote)
│   ├── services/                      # Google Auth token verification & ballot builders
│   ├── routers/                       # FastAPI APIRouters (Admin & Voter endpoints)
│   ├── database.py                    # Unified facade for backward compatibility
│   └── main.py                        # FastAPI application entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/                       # Centralized HTTP client (adminApi, voterApi)
│   │   ├── utils/                     # CSV parser & JWT helper utilities
│   │   ├── components/
│   │   │   ├── common/                # Shared UI (AlertBanner, Modal)
│   │   │   ├── voter/                 # Voter Portal components & wizard steps
│   │   │   ├── admin/                 # Admin console tabs, headers & dialog modals
│   │   │   ├── VoterPortal.jsx        # High-level voter coordinator
│   │   │   └── AdminPortal.jsx        # High-level admin coordinator
│   │   ├── App.jsx                    # Root layout & role navigation
│   │   ├── main.jsx                   # React DOM entry point
│   │   └── index.css                  # Global styles & responsive theme
│
├── data/                              # SQLite database file (election.db)
├── scripts/
│   └── import_students.py             # CLI bulk student importer
├── run.bat                            # Windows 1-click launcher
├── run.ps1                            # PowerShell launcher
├── start.py                           # Cross-platform concurrent runner
├── requirements.txt                   # Python backend dependencies
└── package.json                       # Root script orchestrator
```

---

## 🚀 Quick Start Guide

### Option 1: Windows 1-Click Launcher (Recommended)
Double-click [`run.bat`](file:///e:/java/Distributed-Campus-Voting-Platform/run.bat) or execute in Command Prompt:
```cmd
.\run.bat
```

### Option 2: PowerShell Launcher
```powershell
.\run.ps1
```

### Option 3: Cross-Platform Python / npm Runner
```bash
python start.py
# or
npm start
```

---

## 🛠️ Manual Installation & Setup

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher and `npm`

### 2. Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux / macOS:
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Start backend server
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## 🔐 Default Credentials

| Portal | Identifier / Username | Password | Role |
| :--- | :--- | :--- | :--- |
| **Admin Console** | `ADM-OFFICER-01` (or `admin`) | `admin123` | Chief Election Officer |
| **Admin Console** | `ADM-SUPER-01` (or `superadmin`) | `supersecret123` | System Administrator |
| **Student Portal** | Registered Student Email / ID | Google OAuth 2.0 | Verified Voter |

---

## 🌐 Endpoints & Ports

- **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend Server**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Redoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📄 License
This project is licensed under the MIT License - see the [`LICENSE`](file:///e:/java/Distributed-Campus-Voting-Platform/LICENSE) file for details.