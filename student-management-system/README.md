# 🎓 Student Management System

### 3-Tier Node.js Application

A full-stack **Student Management System** built with a classic 3-tier architecture:

| Tier                      | Technology                       | Responsibility                          |
| ------------------------- | -------------------------------- | --------------------------------------- |
| **Tier 1 – Presentation** | HTML5 + Bootstrap 5 + Vanilla JS | User interface (served as static files) |
| **Tier 2 – Application**  | Node.js + Express.js REST API    | Business logic, routing, validation     |
| **Tier 3 – Data**         | PostgreSQL                       | Persistent data storage                 |

### Features

* ✅ Add, Edit, Delete, and Search students
* ✅ Dashboard stats (total students, subjects, grades, enrollments)
* ✅ Responsive UI with Bootstrap 5
* ✅ REST API with proper HTTP status codes
* ✅ Input validation on both frontend and backend
* ✅ Dockerized with multi-stage build

---

## 📁 Project Structure

```
student-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   └── studentController.js  # Request handlers
│   │   ├── models/
│   │   │   └── studentModel.js       # SQL queries
│   │   ├── routes/
│   │   │   └── studentRoutes.js      # API route definitions
│   │   └── app.js                     # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html                    # Single-page UI
│   ├── css/style.css
│   └── js/app.js                     # Fetch API + DOM logic
├── database/
│   └── init.sql                      # Table schema + seed data
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # Full-stack compose file
└── .dockerignore
```

---

# 🖥️ PART 1: Run Locally on Ubuntu (Without Docker)

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

### Step 4 — Create the database and user

```bash
sudo -i -u postgres
psql
```

Inside `psql`:

```sql
CREATE DATABASE student_management;
ALTER USER postgres WITH PASSWORD 'yourpassword';
\l  -- verify database
\q
exit
```

### Step 5 — Run the database init script

```bash
cd ~/node-js/student-management-system
psql -U postgres -d student_management -f database/init.sql
```

Verify seed data:

```bash
psql -U postgres -d student_management -c "SELECT * FROM students;"
```

---

## Run the Backend

### Step 6 — Install Node.js dependencies

```bash
cd ~/node-js/student-management-system/backend
npm install
```

### Step 7 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Set the contents:

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_management
DB_USER=postgres
DB_PASSWORD=yourpassword
```

> Make sure the DB credentials match what you created earlier.

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### Step 8 — Start the server

```bash
npm start   # runs backend/app.js
```

You should see:

```
✅ Connected to PostgreSQL database
🚀 Server running on http://localhost:3000
📋 API base URL : http://localhost:3000/api/students
💊 Health check : http://localhost:3000/api/health
🌐 Frontend     : http://localhost:3000
```

Open in browser: `http://localhost:3000`

---

## ✅ Test the API

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/students
curl "http://localhost:3000/api/students?search=Alice"
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Tom","last_name":"Hanks","email":"tom@example.com","subject":"Drama","grade":"A"}'
curl -X PUT http://localhost:3000/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Tom","last_name":"Hanks","grade":"A+"}'
curl -X DELETE http://localhost:3000/api/students/1
```

---

# 🐳 PART 2: Run with Docker

### Step 1 — Install Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

---

### Step 2 — Create Docker network

```bash
docker network create sms-network
```

---

### Step 3 — Run PostgreSQL container

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

Verify:

```bash
docker logs sms_db
```

---

### Step 4 — Load database schema

```bash
docker cp database/init.sql sms_db:/init.sql
docker exec -it sms_db psql -U postgres -d student_management -f /init.sql
docker exec -it sms_db psql -U postgres -d student_management -c "SELECT id, first_name, last_name FROM students;"
```

---

### Step 5 — Build backend Docker image

```bash
docker build -t sms-backend:latest .
```

---

### Step 6 — Run backend container

```bash
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
  -p 3000:3000 \
  sms-backend:latest
```

> DB_HOST=sms_db — container name inside network, not localhost

---

### Step 7 — Verify containers

```bash
docker ps
docker logs sms_backend
```

---

### Step 8 — Open application

```
http://localhost:3000
```

---

# 🔧 Troubleshooting

| Problem                  | Solution                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `ECONNREFUSED`           | PostgreSQL not running → `sudo systemctl start postgresql` or `docker start sms_db` |
| Port 3000/5432 in use    | `sudo lsof -i :3000` → kill PID / stop other DB                                     |
| Password auth failed     | `.env` must match DB user password                                                  |
| Frontend not loading     | Make sure server runs from `backend/` directory                                     |
| Docker permission denied | `sudo usermod -aG docker $USER && newgrp docker`                                    |

---

This README now matches **your working setup**:

* Node.js app starts via `backend/app.js`
* `.env` explained and required
* PostgreSQL authentication fixed
* Docker instructions updated for network/container-based DB
