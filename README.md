# Failsafe

Failsafe is a two-part student risk assessment system with a Python FastAPI backend and a React + TypeScript frontend. It helps professors track student risk, store assessment results, and lets HODs review departmental professor analytics.

## Project overview

- **Backend:** FastAPI, SQLAlchemy, JWT authentication, XGBoost risk scoring, SHAP-based feature explanations.
- **Frontend:** React 19, TypeScript, Vite, TanStack Router, React Query, Tailwind CSS.
- **Use case:** Professors submit student assessment data, receive risk classification and intervention guidance, and view only their own assessments. HOD users can view department professor summaries and analytics.

## Repository structure

- `backend/` – Python API server, database models, ML engine, authentication, assessment endpoints.
- `failsafe_frontend/` – React application, UI components, routes, and API client logic.
- `.gitignore` – ignores temporary and generated files such as `node_modules`, virtual environments, caches, and local databases.

## Setup instructions

### 1. Backend setup

1. Open a terminal in `backend/`.
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - Windows Command Prompt:
     ```cmd
     .\venv\Scripts\activate.bat
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

## Running the application

1. Start the backend API server first.
2. Start the frontend development server.
3. Use the frontend UI to register or log in.
4. Professors can submit assessments and view their own student records.
5. HOD users can access department-wide professor analytics.

## Key features

- Secure JWT-based authentication for all protected routes.
- Assessment storage with professor-level data isolation.
- Department professor listing for HOD users.
- Risk analytics and progress summaries for selected professors.
- Python ML engine with explainable risk factors.

