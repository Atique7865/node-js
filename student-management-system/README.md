# 🎓 Student Management System
### 3-Tier Node.js Application

A full-stack **Student Management System** built with a classic 3-tier architecture:

| Tier | Technology | Responsibility |
|------|------------|----------------|
| **Tier 1 – Presentation** | HTML5 + Bootstrap 5 + Vanilla JS | User interface (served as static files) |
| **Tier 2 – Application** | Node.js + Express.js REST API | Business logic, routing, validation |
| **Tier 3 – Data** | PostgreSQL | Persistent data storage |

### Features
- ✅ Add, Edit, Delete, and Search students
- ✅ Dashboard stats (total students, subjects, grades, enrollments)
- ✅ Responsive UI with Bootstrap 5
- ✅ REST API with proper HTTP status codes
- ✅ Input validation on both frontend and backend
- ✅ Dockerized with multi-stage build

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
│   │   └── server.js                 # Express app entry point
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
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v    # should print v20.x.x
npm -v     # should print 10.x.x
```

### Step 3 — Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it is running
sudo systemctl status postgresql
```

---

## Database Setup

### Step 4 — Create the database and user

```bash
# Switch to the postgres system user
sudo -i -u postgres

# Open PostgreSQL shell
psql
```

Inside the `psql` shell, run:

```sql
-- Create the database
CREATE DATABASE student_management;

-- Set a password for the default postgres user
ALTER USER postgres WITH PASSWORD 'yourpassword';

-- Verify the database was created
\l

-- Exit psql
\q
```

Then exit the postgres user session:

```bash
exit
```

### Step 5 — Run the database init script (creates table + seed data)

```bash
# Navigate to the project root
cd ~/student-management-system

psql -U postgres -d student_management -f database/init.sql
```

When prompted, enter the password you set in Step 4 (`yourpassword`).

**Verify the seed data:**

```bash
psql -U postgres -d student_management -c "SELECT * FROM students;"
```

---

## Run the Backend

### Step 6 — Install Node.js dependencies

```bash
cd ~/student-management-system/backend

npm install
```

### Step 7 — Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit it with your values
nano .env
```

Set the contents to match your setup:

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_management
DB_USER=postgres
DB_PASSWORD=yourpassword
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### Step 8 — Start the server

```bash
# Production start
npm start

# OR development start with auto-reload
npm run dev
```

You should see:

```
✅ Connected to PostgreSQL database
🚀 Server running on http://localhost:3000
📋 API base URL : http://localhost:3000/api/students
💊 Health check : http://localhost:3000/api/health
🌐 Frontend     : http://localhost:3000
```

### Step 9 — Open the application

Open your browser and go to:

```
http://localhost:3000
```

---

## ✅ Test the API (optional)

```bash
# Health check
curl http://localhost:3000/api/health

# Get all students
curl http://localhost:3000/api/students

# Get stats
curl http://localhost:3000/api/students/stats

# Search students
curl "http://localhost:3000/api/students?search=Alice"

# Add a student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Tom","last_name":"Hanks","email":"tom@example.com","subject":"Drama","grade":"A"}'

# Update a student (replace 1 with actual ID)
curl -X PUT http://localhost:3000/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Tom","last_name":"Hanks","email":"tom@example.com","grade":"A+"}'

# Delete a student (replace 1 with actual ID)
curl -X DELETE http://localhost:3000/api/students/1
```

---

# 🐳 PART 2: Run with Docker (Without Docker Compose)

## Prerequisites

### Step 1 — Install Docker on Ubuntu

```bash
# Remove old versions (if any)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install required packages
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Allow running Docker without sudo (optional but recommended)
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker
docker --version
```

---

## Run 3 Containers Manually (No Compose)

> All 3 containers will communicate over a custom Docker network.

### Step 2 — Create a dedicated Docker network

```bash
docker network create sms-network
```

---

### Step 3 — Run the PostgreSQL container (Tier 3 — Data)

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

**Wait ~10 seconds for PostgreSQL to start**, then verify:

```bash
docker ps              # sms_db should show status "Up"
docker logs sms_db     # look for "database system is ready to accept connections"
```

---

### Step 4 — Load the database schema and seed data

```bash
# Navigate to your project directory
cd ~/student-management-system

# Copy the init.sql file into the container and run it
docker cp database/init.sql sms_db:/init.sql

docker exec -it sms_db psql \
  -U postgres \
  -d student_management \
  -f /init.sql
```

**Verify the data:**

```bash
docker exec -it sms_db psql \
  -U postgres \
  -d student_management \
  -c "SELECT id, first_name, last_name, email FROM students;"
```

---

### Step 5 — Build the application Docker image (Tier 2 — Backend)

```bash
# From the project root directory
cd ~/student-management-system

docker build -t sms-backend:latest .
```

You should see the multi-stage build complete:

```
[+] Building ... Successfully built ...
```

---

### Step 6 — Run the backend container (Tier 2 — Application)

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

> ⚠️ Note: `DB_HOST=sms_db` — this is the container name, not `localhost`.  
> Docker uses container names as hostnames within the same network.

---

### Step 7 — Verify all containers are running

```bash
docker ps
```

Expected output:

```
CONTAINER ID   IMAGE               PORTS                    NAMES
xxxxxxxxxxxx   sms-backend:latest  0.0.0.0:3000->3000/tcp   sms_backend
xxxxxxxxxxxx   postgres:16-alpine  0.0.0.0:5432->5432/tcp   sms_db
```

Check application logs:

```bash
docker logs sms_backend
```

You should see:

```
✅ Connected to PostgreSQL database
🚀 Server running on http://localhost:3000
```

---

### Step 8 — Open the application

```
http://localhost:3000
```

Or from another machine (replace with your Ubuntu VM's IP):

```
http://<your-vm-ip>:3000
```

Find your VM IP with:

```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

---

## 🔧 Docker Container Management Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop containers
docker stop sms_backend sms_db

# Start containers again
docker start sms_db
sleep 5
docker start sms_backend

# Remove containers (data in volume is preserved)
docker rm sms_backend sms_db

# Remove the network
docker network rm sms-network

# Remove the volume (⚠️ this deletes all database data!)
docker volume rm sms_pgdata

# View container logs (live)
docker logs -f sms_backend
docker logs -f sms_db
```

---

# 🐳 PART 3: Run with Docker Compose

Docker Compose automates everything — one command starts all 3 tiers.

### Step 1 — Install Docker Compose plugin

```bash
# Check if already installed (comes with Docker Desktop or recent Docker installs)
docker compose version

# If not installed:
sudo apt install -y docker-compose-plugin
```

### Step 2 — Start the full stack

```bash
cd ~/student-management-system

docker compose up -d --build
```

This will:
1. Pull `postgres:16-alpine` image
2. Build the `sms-backend` image from your `Dockerfile`
3. Start the `sms_db` container and run `database/init.sql` automatically
4. Wait for DB to be healthy, then start `sms_backend`

### Step 3 — Verify everything is running

```bash
docker compose ps
```

### Step 4 — Open the application

```
http://localhost:3000
```

### Step 5 — Stop and clean up

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/students` | List all students |
| `GET` | `/api/students?search=term` | Search students |
| `GET` | `/api/students/stats` | Dashboard statistics |
| `GET` | `/api/students/:id` | Get one student |
| `POST` | `/api/students` | Create a student |
| `PUT` | `/api/students/:id` | Update a student |
| `DELETE` | `/api/students/:id` | Delete a student |

---

## 🔥 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` connecting to DB | PostgreSQL is not running. Run `sudo systemctl start postgresql` or `docker start sms_db` |
| Port 3000 already in use | `sudo lsof -i :3000` then `kill -9 <PID>` |
| Port 5432 already in use | `sudo lsof -i :5432` then stop local PostgreSQL: `sudo systemctl stop postgresql` |
| `password authentication failed` | Check `.env` — DB_PASSWORD must match what you set in Step 4 |
| Docker permission denied | Run `sudo usermod -aG docker $USER` then `newgrp docker` |
| Frontend not loading | Make sure you are running the server from the `backend/` directory or the path `../../frontend` resolves correctly |

---

*Built with Node.js, Express, PostgreSQL, Bootstrap 5*
