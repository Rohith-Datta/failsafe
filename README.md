# Failsafe

Failsafe is an AI-powered student risk assessment platform. By combining a predictive Machine Learning engine with a modern web architecture (FastAPI + React/TypeScript), it transforms raw student data into actionable insights. Professors receive instant risk scores and customized intervention strategies, while HODs gain access to high-level departmental analytics to ensure no student slips through the cracks.

## Project overview

- **Backend:** FastAPI, SQLAlchemy, JWT authentication, XGBoost risk scoring, SHAP-based feature explanations.
- **Frontend:** React 19, TypeScript, Vite, TanStack Router, React Query, Tailwind CSS.
- **Use case:** Professors submit student assessment data, receive risk classification and intervention guidance, and view only their own assessments. HOD users can view department professor summaries and analytics.

## Repository structure

- `backend/` – Python API server, database models, ML engine, authentication, assessment endpoints.
- `failsafe_frontend/` – React application, UI components, routes, and API client logic.
- `.gitignore` – ignores temporary and generated files such as `node_modules`, virtual environments, caches, and local databases.
- `failsafe_MLmodel.ipynb` - Jupyter notebook containing the ML model used with detailed explanation.

## Setup instructions

### Prerequisites

**Python Version:** Python 3.10 or 3.11 is **recommended** for the best compatibility. While Python 3.12 works, it may have compatibility issues with the `numba` package (which is used by SHAP and XGBoost). Avoid Python 3.13+ for now.

To check your Python version:
```bash
python --version
```

### 1. Backend setup

1. Open a terminal in `backend/`.
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows PowerShell:**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt:**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the backend server:
   ```bash
   python -m uvicorn main:app --reload
   ```
6. The API will be available at `http://127.0.0.1:8000`.

### 2. Frontend setup

1. Open a terminal in `failsafe_frontend/`.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The frontend will typically run at `http://localhost:5173`.

### 3. API URL Configuration

**⚠️ Important:** The API URL is currently hardcoded in the frontend as `http://127.0.0.1:8000`. This **may not work** if:
- Running the backend on a different machine or computer
- Running on macOS or Linux (where the port or IP may differ)
- Running the backend remotely or on a server

**To fix this for your setup:**

1. Open `failsafe_frontend/src/lib/assessments.functions.ts` and update the API URL:
   ```typescript
   const API_BASE_URL = "http://127.0.0.1:8000"; // Change this to your backend URL
   ```

2. Also update the hardcoded URLs in `failsafe_frontend/src/routes/auth.tsx`:
   - Line 53: `http://127.0.0.1:8000/login`
   - Line 90: `http://127.0.0.1:8000/register`
   - Line 102: `http://127.0.0.1:8000/login`

**Common configurations:**
- **Same computer (localhost):** `http://127.0.0.1:8000` or `http://localhost:8000`
- **Different computer on same network:** `http://<backend-ip>:8000` (replace with actual IP)
- **macOS/Linux:** Use `http://localhost:8000` instead of `127.0.0.1` if connecting locally

**To find your backend IP address:**
- **Windows:** Run `ipconfig` in PowerShell
- **macOS/Linux:** Run `ifconfig` in terminal and look for the local IP address

## Running the application

1. Start the backend API server first.
2. Start the frontend development server.
3. Use the frontend UI to register or log in.
4. Professors can submit assessments and view their own student records.
5. HOD users can access department-wide professor analytics.

## Key features

- **Explainable AI Engine:** Python-driven XGBoost model utilizing SHAP values to mathematically isolate the exact driving factors behind student risk.
- **Active Intervention Pipeline:** Interactive task management allowing professors to track, execute, and complete AI-generated student action plans.
- **Targeted Professor Analytics:** Real-time visual tracking of individual intervention completion rates and dominant classroom risk trends.
- **Departmental Command Center:** Top-down visibility for HODs to monitor faculty engagement, compare risk aggregates, and audit department-wide progress.
- **Strict Data Isolation:** JWT-secured, role-based architecture guaranteeing complete privacy between individual professor workloads and departmental oversight.

