# 🎓 Student Management System

### 3-Tier Node.js Application

A full-stack **Student Management System** built with a classic 3-tier architecture:

| Tier                      | Technology                       | Responsibility                          |
| ------------------------- | -------------------------------- | --------------------------------------- |
| **Tier 1 – Presentation** | HTML5 + Bootstrap 5 + Vanilla JS | User interface served by Nginx          |
| **Tier 2 – Application**  | Node.js + Express.js REST API    | Business logic, routing, validation     |
| **Tier 3 – Data**         | PostgreSQL                       | Persistent data storage                 |

### Features

* ✅ Add, Edit, Delete, and Search students
* ✅ Dashboard stats (total students, subjects, grades, enrollments)
* ✅ Responsive UI with Bootstrap 5
* ✅ REST API with proper HTTP status codes
* ✅ Input validation on both frontend and backend
* ✅ **Separate Dockerfile for Frontend (Nginx) and Backend (Node.js)**

---

## 📁 Project Structure

```
student-management-system/
├── backend/
│   ├── Dockerfile                    ← 🐳 Backend Docker image (Node.js)
│   ├── package.json
│   └── src/
│       ├── config/db.js              # PostgreSQL connection pool
│       ├── controllers/studentController.js
│       ├── models/studentModel.js
│       ├── routes/studentRoutes.js
│       └── server.js                 # Express app entry point
├── frontend/
│   ├── Dockerfile                    ← 🐳 Frontend Docker image (Nginx)
│   ├── nginx.conf                    # Nginx config: serve files + proxy /api/*
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── database/
│   └── init.sql                      # Table schema + seed data
├── docker-compose.yml                # Orchestrates all 3 containers together
└── .dockerignore
```

---

## 🐳 Docker Architecture Explained

This project uses **3 separate containers**, each with its own role:

```
Your Browser
     │
     │  http://localhost (port 80)
     ▼
┌──────────────────────────┐
│   frontend container     │  ← built from  frontend/Dockerfile
│   Image: Nginx           │
│   Serves: HTML/CSS/JS    │
│   Also proxies /api/*  ──┼──────────────────────────────┐
└──────────────────────────┘                              │
                                                          │ internal Docker network
                                                          ▼
                                         ┌────────────────────────────┐
                                         │   backend container        │  ← built from backend/Dockerfile
                                         │   Image: Node.js + Express │
                                         │   Port: 3000 (internal)    │
                                         └────────────────┬───────────┘
                                                          │ SQL queries
                                                          ▼
                                         ┌────────────────────────────┐
                                         │   db container             │
                                         │   Image: postgres:16-alpine│
                                         │   Port: 5432               │
                                         └────────────────────────────┘
```

### Why separate Dockerfiles?

| File                    | Base Image        | What it contains                              |
| ----------------------- | ----------------- | --------------------------------------------- |
| `backend/Dockerfile`    | `node:20-alpine`  | Node.js runtime + Express app source code     |
| `frontend/Dockerfile`   | `nginx:stable-alpine` | Nginx server + HTML/CSS/JS static files   |

Each container does **one job only** — this is the microservices principle.

---

## 🔍 Understanding Each Dockerfile

### `backend/Dockerfile` — Node.js API Server

```
Stage 1 (deps):   Install npm packages
Stage 2 (final):  Copy app source + node_modules → run Node.js
```

Key concepts:
- **Multi-stage build** — Stage 1 installs packages, Stage 2 is the lean final image
- **Non-root user** — runs as `appuser` for security
- **HEALTHCHECK** — Docker auto-checks if the API is responding

### `frontend/Dockerfile` — Nginx Static Server

```
Step 1: Start from nginx:stable-alpine
Step 2: Copy nginx.conf  (custom routing rules)
Step 3: Copy HTML/CSS/JS files into Nginx web root
Step 4: Start Nginx
```

Key concepts:
- **No build step needed** — frontend is plain HTML/CSS/JS
- **Reverse proxy** — Nginx forwards `/api/*` requests to the backend container
- The browser only talks to port 80 (Nginx), never directly to Node.js

### `frontend/nginx.conf` — How the Proxy Works

```nginx
location / {
    # Serve static HTML/CSS/JS files
}

location /api/ {
    proxy_pass http://backend:3000;
    # "backend" = service name in docker-compose.yml
    # Docker's DNS resolves it to the backend container's IP automatically
}
```

---

# 🖥️ PART 1: Run Locally (Without Docker)

## Prerequisites

### Step 1 — Update Ubuntu packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2 — Install Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v    # should print v20.x.x
npm -v     # should print 10.x.x
```

### Step 3 — Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

---

## Database Setup

### Step 4 — Create the database

```bash
sudo -i -u postgres
psql
```

Inside `psql`:

```sql
CREATE DATABASE student_management;
ALTER USER postgres WITH PASSWORD 'yourpassword';
\l     -- verify database exists
\q
exit
```

### Step 5 — Run the init script

```bash
cd student-management-system
psql -U postgres -d student_management -f database/init.sql
psql -U postgres -d student_management -c "SELECT * FROM students;"
```

---

## Run the Backend

### Step 6 — Install dependencies

```bash
cd backend
npm install
```

### Step 7 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Set:

```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_management
DB_USER=postgres
DB_PASSWORD=yourpassword
```

### Step 8 — Start the server

```bash
npm start
```

Expected output:

```
✅ Connected to PostgreSQL database
🚀 Server running on http://localhost:3000
```

Open browser: `http://localhost:3000`

---

## ✅ Test the API

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/students
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Tom","last_name":"Hanks","email":"tom@example.com","subject":"Drama","grade":"A"}'
```

---

# 🐳 PART 2: Run with Docker Compose (Recommended)

This is the easiest way to run all 3 tiers together.

### Step 1 — Install Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

---

### Step 2 — Build and start all containers

```bash
cd student-management-system
docker compose up --build
```

What this does step by step:
1. Builds `backend` image from `backend/Dockerfile`
2. Builds `frontend` image from `frontend/Dockerfile`
3. Pulls `postgres:16-alpine` image for `db`
4. Starts all 3 containers in the right order (`db` → `backend` → `frontend`)

---

### Step 3 — Open the application

```
http://localhost
```

> Port 80 (Nginx) → proxy → Port 3000 (Node.js) → SQL → PostgreSQL

---

### Step 4 — Useful Docker commands

```bash
# See running containers
docker compose ps

# See logs for all containers
docker compose logs

# See logs for one container only
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Stop all containers
docker compose down

# Stop and delete data (fresh start)
docker compose down -v
```

---

# 🐳 PART 3: Run Containers Manually (without Compose)

This shows you exactly what docker-compose does under the hood — great for learning!

### Step 1 — Create a shared Docker network

```bash
docker network create sms-network
```

> Without a network, containers cannot talk to each other by name.

---

### Step 2 — Start the database container

```bash
docker run -d \
  --name sms_db \
  --network sms-network \
  -e POSTGRES_DB=student_management \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secret123 \
  -v sms_pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

Wait ~5 seconds, then load the schema:

```bash
docker cp database/init.sql sms_db:/init.sql
docker exec -it sms_db psql -U postgres -d student_management -f /init.sql
```

---

### Step 3 — Build and run the backend container

```bash
# Build the image using backend/Dockerfile
docker build -t sms-backend:latest ./backend

# Run the backend container
docker run -d \
  --name sms_backend \
  --network sms-network \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e DB_HOST=sms_db \
  -e DB_PORT=5432 \
  -e DB_NAME=student_management \
  -e DB_USER=postgres \
  -e DB_PASSWORD=secret123 \
  sms-backend:latest
```

> `DB_HOST=sms_db` — the container name acts as a DNS hostname inside the network.

---

### Step 4 — Build and run the frontend container

```bash
# Build the image using frontend/Dockerfile
docker build -t sms-frontend:latest ./frontend

# Run the frontend container
docker run -d \
  --name sms_frontend \
  --network sms-network \
  -p 80:80 \
  sms-frontend:latest
```

> Nginx will proxy `/api/*` to `http://backend:3000` inside the Docker network.

---

### Step 5 — Verify all containers are running

```bash
docker ps
```

Expected output:

```
CONTAINER ID   IMAGE                  PORTS                  NAMES
xxxxxxxxxxxx   sms-frontend:latest    0.0.0.0:80->80/tcp     sms_frontend
xxxxxxxxxxxx   sms-backend:latest     3000/tcp               sms_backend
xxxxxxxxxxxx   postgres:16-alpine     0.0.0.0:5432->5432/tcp sms_db
```

---

### Step 6 — Open the application

```
http://localhost
```

---

# 🔧 Troubleshooting

| Problem                         | Solution                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `ECONNREFUSED` on backend start | PostgreSQL not ready yet — wait and retry, or use `depends_on` in compose    |
| Port 80 already in use          | `sudo lsof -i :80` → stop Apache/other nginx                                 |
| Port 5432 already in use        | Local PostgreSQL running — `sudo systemctl stop postgresql`                  |
| Frontend shows blank page       | Check `docker compose logs frontend` for nginx errors                        |
| API calls return 502 Bad Gateway| Backend not running — check `docker compose logs backend`                    |
| Password auth failed            | `.env` must match the `POSTGRES_PASSWORD` used when creating the container   |
| Docker permission denied        | `sudo usermod -aG docker $USER && newgrp docker`                             |

---

# 📚 What You Learned

By building this project you practised:

- ✅ **Separate Dockerfiles** — one per service (frontend, backend)
- ✅ **Multi-stage builds** — keeping the Node.js image small
- ✅ **Nginx as reverse proxy** — routing `/api/*` to the backend
- ✅ **Docker Compose** — orchestrating multiple containers
- ✅ **Docker networking** — containers talking by service name
- ✅ **Health checks** — Docker knowing when a service is truly ready
- ✅ **Named volumes** — persisting database data across restarts
