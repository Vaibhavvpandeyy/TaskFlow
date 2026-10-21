
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()
import jwt
import psycopg
from pwdlib import PasswordHash
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

app = FastAPI(title="TaskFlow API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://taskflow-frontend-yq2i.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


password_hash = PasswordHash.recommended()
security = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TOKEN_HOURS = 12


def get_connection():
    database_url = os.environ.get("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is missing")

    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://"):]

    return psycopg.connect(database_url, row_factory=dict_row)


def init_db():
    admin_username = os.environ.get("ADMIN_USERNAME")
    admin_password = os.environ.get("ADMIN_PASSWORD")

    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET environment variable is missing")

    if not admin_username or not admin_password:
        raise RuntimeError("ADMIN_USERNAME and ADMIN_PASSWORD are required")

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('admin', 'junior')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )

        connection.execute(
            """
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS assigned_to BIGINT
            REFERENCES users(id) ON DELETE SET NULL
            """
        )

        connection.execute(
            """
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS assigned_by BIGINT
            REFERENCES users(id) ON DELETE SET NULL
            """
        )
        
        connection.execute(
            """
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Medium'
            """
        )

        connection.execute(
            """
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending'
            """
        )


        existing_admin = connection.execute(
            "SELECT id FROM users WHERE username = %s",
            (admin_username,),
        ).fetchone()

        if not existing_admin:
            connection.execute(
                """
                INSERT INTO users (username, password_hash, role)
                VALUES (%s, %s, 'admin')
                 """,
                (admin_username, password_hash.hash(admin_password)),
            )


@app.on_event("startup")
def startup():
    init_db()


class LoginInput(BaseModel):
    username: str
    password: str


class JuniorCreate(BaseModel):
    username: str
    password: str



class TaskCreate(BaseModel):
    title: str
    category: str = "Work"
    due_date: str
    assigned_to: int
    priority: str = "Medium"


class TaskEdit(BaseModel):
    title: str
    category: str
    due_date: str
    assigned_to: int
    priority: str = "Medium"



class TaskUpdate(BaseModel):
    completed: bool | None = None
    status: str | None = None



def create_token(user):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user["id"]),
            "role": user["role"],
            "iat": now,
            "exp": now + timedelta(hours=TOKEN_HOURS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, username, role FROM users WHERE id = %s",
            (user_id,),
        ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_admin(user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user



def format_task(task):
    return {
        "id": task["id"],
        "title": task["title"],
        "category": task["category"],
        "due_date": task["due_date"],
        "completed": bool(task["completed"]),
        "status": task.get("status") or ("Completed" if task["completed"] else "Pending"),
        "priority": task.get("priority") or "Medium",
        "assigned_to": task["assigned_to"],
        "assigned_by": task["assigned_by"],
        "assigned_username": task.get("assigned_username"),
    }


@app.get("/")
def home():
    return {"message": "TaskFlow API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(data: LoginInput):
    with get_connection() as connection:
        user = connection.execute(
            "SELECT * FROM users WHERE username = %s",
            (data.username.strip(),),
        ).fetchone()

    if not user or not password_hash.verify(
        data.password, user["password_hash"]
    ):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
        },
    }


@app.get("/auth/me")
def me(user=Depends(current_user)):
    return user


@app.post("/users/juniors", status_code=201)
def create_junior(data: JuniorCreate, admin=Depends(require_admin)):
    username = data.username.strip()

    if len(username) < 3 or len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Username must be 3+ characters and password 8+ characters",
        )

    try:
        with get_connection() as connection:
            user = connection.execute(
                """
                INSERT INTO users (username, password_hash, role)
                VALUES (%s, %s, 'junior')
                RETURNING id, username, role
                """,
                (username, password_hash.hash(data.password)),
            ).fetchone()
            return user
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Username already exists")


@app.get("/users/juniors")
def get_juniors(admin=Depends(require_admin)):
    with get_connection() as connection:
        return connection.execute(
            "SELECT id, username, role FROM users WHERE role = 'junior' ORDER BY username"
        ).fetchall()


@app.get("/tasks")
def get_tasks(user=Depends(current_user)):
    with get_connection() as connection:
        if user["role"] == "admin":
            tasks = connection.execute(
                """
                SELECT t.*, u.username AS assigned_username
                FROM tasks t
                LEFT JOIN users u ON u.id = t.assigned_to
                ORDER BY t.id DESC
                """
            ).fetchall()
        else:
            tasks = connection.execute(
                """
                SELECT t.*, u.username AS assigned_username
                FROM tasks t
                LEFT JOIN users u ON u.id = t.assigned_to
                WHERE t.assigned_to = %s
                ORDER BY t.id DESC
                """,
                (user["id"],),
            ).fetchall()

        return [format_task(task) for task in tasks]


@app.post("/tasks", status_code=201)
def create_task(data: TaskCreate, admin=Depends(require_admin)):
    title = data.title.strip()

    if not title:
        raise HTTPException(status_code=400, detail="Task title cannot be empty")

    with get_connection() as connection:
        junior = connection.execute(
            "SELECT id FROM users WHERE id = %s AND role = 'junior'",
            (data.assigned_to,),
        ).fetchone()

        if not junior:
            raise HTTPException(status_code=404, detail="Junior account not found")

        task = connection.execute(
            """
            INSERT INTO tasks
                (title, category, due_date, assigned_to, assigned_by, priority)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                title,
                data.category,
                data.due_date,
                data.assigned_to,
                admin["id"],
                data.priority,
            ),            
        ).fetchone()

        return format_task(task)


    
@app.patch("/tasks/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdate,
    user=Depends(current_user),
):
    if data.status is not None:
        if data.status not in ("Pending", "In Progress", "Completed"):
            raise HTTPException(
                status_code=400,
                detail="Invalid task status",
            )
        completed = data.status == "Completed"
    elif data.completed is not None:
        completed = data.completed
        status = "Completed" if completed else "Pending"
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide completed or status",
        )

    if data.status is not None:
        status = data.status

    with get_connection() as connection:
        if user["role"] == "admin":
            task = connection.execute(
                """
                UPDATE tasks
                SET completed = %s, status = %s
                WHERE id = %s
                RETURNING *
                """,
                (completed, status, task_id),
            ).fetchone()
        else:
            task = connection.execute(
                """
                UPDATE tasks
                SET completed = %s, status = %s
                WHERE id = %s AND assigned_to = %s
                RETURNING *
                """,
                (completed, status, task_id, user["id"]),
            ).fetchone()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        return format_task(task)


@app.put("/tasks/{task_id}")
def edit_task(
    task_id: int,
    data: TaskEdit,
    admin=Depends(require_admin),
):
    title = data.title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Task title cannot be empty",
        )

    if data.priority not in ("Low", "Medium", "High"):
        raise HTTPException(
            status_code=400,
            detail="Invalid task priority",
        )

    with get_connection() as connection:
        junior = connection.execute(
            "SELECT id FROM users WHERE id = %s AND role = 'junior'",
            (data.assigned_to,),
        ).fetchone()

        if not junior:
            raise HTTPException(
                status_code=404,
                detail="Junior account not found",
            )

        task = connection.execute(
            """
            UPDATE tasks
            SET title = %s,
                category = %s,
                due_date = %s,
                assigned_to = %s,
                priority = %s
            WHERE id = %s
            RETURNING *
            """,
            (
                title,
                data.category,
                data.due_date,
                data.assigned_to,
                data.priority,
                task_id,
            ),
        ).fetchone()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found",
            )

        return format_task(task)



@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, admin=Depends(require_admin)):
    with get_connection() as connection:
        task = connection.execute(
            "DELETE FROM tasks WHERE id = %s RETURNING id",
            (task_id,),
        ).fetchone()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        return {"message": "Task deleted successfully"}
