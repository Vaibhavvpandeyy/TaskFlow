import os
from urllib.parse import urlparse, urlunparse

import psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://taskflow-frontend-yq2i.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection():
    database_url = os.environ.get("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is missing")

    # Render may provide a URL beginning with postgres://
    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://"):]

    return psycopg.connect(database_url, row_factory=dict_row)


def init_db():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id BIGSERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'Work',
                due_date TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE
            )
            """
        )


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
    with get_connection() as connection:
        tasks = connection.execute(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).fetchall()

        return [format_task(task) for task in tasks]


@app.post("/tasks")
def create_task(task: TaskCreate):
    title = task.title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Task title cannot be empty",
        )

    with get_connection() as connection:
        saved_task = connection.execute(
            """
            INSERT INTO tasks (title, category, due_date)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (title, task.category, task.due_date),
        ).fetchone()

        return format_task(saved_task)


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    with get_connection() as connection:
        updated_task = connection.execute(
            """
            UPDATE tasks
            SET completed = %s
            WHERE id = %s
            RETURNING *
            """,
            (task.completed, task_id),
        ).fetchone()

        if updated_task is None:
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        return format_task(updated_task)


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    with get_connection() as connection:
        deleted_task = connection.execute(
            """
            DELETE FROM tasks
            WHERE id = %s
            RETURNING id
            """,
            (task_id,),
        ).fetchone()

        if deleted_task is None:
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        return {"message": "Task deleted successfully"}
