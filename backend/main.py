
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "tasks.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Work',
            due_date TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    connection.commit()
    connection.close()


init_db()


class TaskCreate(BaseModel):
    title: str
    category: str = "Work"
    due_date: str


class TaskUpdate(BaseModel):
    completed: bool


def format_task(task):
    return {
        "id": task["id"],
        "title": task["title"],
        "category": task["category"],
        "due_date": task["due_date"],
        "completed": bool(task["completed"]),
    }


@app.get("/")
def home():
    return {"message": "TaskFlow API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/tasks")
def get_tasks():
    connection = get_connection()
    try:
        tasks = connection.execute(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).fetchall()
        return [format_task(task) for task in tasks]
    finally:
        connection.close()


@app.post("/tasks")
def create_task(task: TaskCreate):
    title = task.title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Task title cannot be empty",
        )

    connection = get_connection()
    try:
        cursor = connection.execute(
            """
            INSERT INTO tasks (title, category, due_date)
            VALUES (?, ?, ?)
            """,
            (title, task.category, task.due_date),
        )
        connection.commit()

        saved_task = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

        return format_task(saved_task)
    finally:
        connection.close()


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    connection = get_connection()
    try:
        cursor = connection.execute(
            "UPDATE tasks SET completed = ? WHERE id = ?",
            (int(task.completed), task_id),
        )
        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        updated_task = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

        return format_task(updated_task)
    finally:
        connection.close()


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    connection = get_connection()
    try:
        cursor = connection.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,),
        )
        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        return {"message": "Task deleted successfully"}
    finally:
        connection.close()
