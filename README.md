
# TaskFlow — Full-Stack Task Manager

TaskFlow is a task management application built with React, TypeScript, FastAPI, and SQLite.

## Features

- Create, view, complete, and delete tasks
- Organize tasks by category
- Filter tasks by today, upcoming, and completed status
- Store tasks persistently in SQLite
- REST API with interactive Swagger documentation

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite

**Backend**
- Python
- FastAPI
- SQLite

## Project Structure

```text
TaskFlow/
├── frontend/
├── backend/
└── README.md
```

## Getting Started

### 1. Start the backend

Open a terminal in the project root:

```powershell
cd backend
python -m venv .venv
```

Activate the virtual environment in PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use the environment's Python directly instead.

Install dependencies:

```powershell
python -m pip install "fastapi[standard]"
```

Start the API:

```powershell
python -m uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### 2. Start the frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Database

SQLite stores tasks in a local database file created by the backend.

## Future Improvements

- Better error handling and loading states
- Automated tests
- User authentication
- Deployment

## Author

Vaibhav
