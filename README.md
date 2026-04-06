# HW#2 – Microservice Integration & Distributed Communication

## Project Overview

This project extends a single microservice architecture into a **distributed microservice-based system**.

The system demonstrates key distributed software architecture concepts including:

- Microservice architecture
- API Gateway pattern
- Service-to-service communication
- JWT authentication
- Protected routes
- Distributed service design

The system is composed of four independent services:

- **API Gateway**
- **Auth Service**
- **Task Service**
- **Notification Service**

Each service runs independently and communicates using REST APIs.

---

## HW#3 – Deployment (Docker Compose & CI/CD)

### Configuration

Each service reads environment variables (see `.env.example` in that service’s folder). Shared values for local development:

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port for that service |
| `JWT_SECRET` | Must match between **auth-service** and **task-service** for valid tokens |
| `AUTH_SERVICE_URL` | Base URL of the auth service (used by **api-gateway**) |
| `TASK_SERVICE_URL` | Base URL of the task service (used by **api-gateway**) |
| `NOTIFICATION_SERVICE_URL` | Base URL of the notification service (**api-gateway** and **task-service**) |

Copy `.env.example` to `.env` where you need custom values.

Optional: add a `.env` file in the **repository root** with `JWT_SECRET=your_value` to override the default secret used by Docker Compose for **auth-service** and **task-service** (see `docker-compose.yml`).

### Run the full stack with Docker Compose

From the repository root (Docker Desktop or Docker Engine required):

```bash
docker compose up --build
```

Or use the helper script (Unix shell / Git Bash):

```bash
chmod +x deploy.sh
./deploy.sh
```

Only the **API Gateway** is published to the host on port **3000**. Internal services talk over the Compose network using service names (for example `http://auth-service:3001`). Docker Desktop (or another Docker engine) must be running for `docker compose` commands to work.

Example after the stack is up:

```http
GET http://localhost:3000/health
POST http://localhost:3000/auth/login
```

### Run automated tests

Tests use Node’s built-in test runner (`node --test`) and **supertest** (no running Docker required for unit/smoke tests).

From each service directory:

```bash
cd api-gateway && npm install && npm test
cd ../auth-service && npm install && npm test
cd ../task-service && npm install && npm test
cd ../notification-service && npm install && npm test
```

Each service includes at least a **GET /health** test; **auth-service** also includes a small **login** integration-style test.

### CI/CD (GitHub Actions)

Workflow file: `.github/workflows/ci-cd.yml`.

On every push or pull request to `main` / `master` it:

1. Checks out the code
2. Sets up Node.js 20
3. Runs `npm ci` and `npm test` in **api-gateway**, **auth-service**, **task-service**, and **notification-service** (in that order)
4. After tests pass, runs **`docker compose build`** to verify all images build

You need a GitHub repository with Actions enabled for this to run on push.

---

## System Architecture

![Microservice Architecture](docs/architecture-diagram.png)

# Architecture Explanation

### Client

The client (Postman or any frontend application) sends all requests to the **API Gateway**.

The client never communicates directly with internal services.

---

### API Gateway

The **API Gateway** acts as the single entry point for the system.

Responsibilities:

- Receives all client requests
- Routes requests to the appropriate microservice
- Simplifies communication between client and services

Gateway routes:


/auth
/tasks
/notifications
/health


Port:


3000


---

### Auth Service

Auth Service is responsible for **authentication and token generation**.

Responsibilities:

- User login
- JWT token generation
- Authentication handling

Example users:


admin / admin123
user / user123


Port:


3001


Endpoint:


POST /auth/login
GET /health


---

### Task Service

Task Service is responsible for **task management**.

Responsibilities:

- Create task
- List tasks
- Get task by ID
- Update task
- Delete task

Protected operations require **JWT authentication**.

Port:


8080


Endpoints:


GET /tasks
GET /tasks/:id
POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id
GET /health


---

### Notification Service

Notification Service stores notifications generated when tasks are created.

Responsibilities:

- Store notifications
- List notifications
- Health check

Port:


3003


Endpoints:


GET /notifications
POST /notifications
GET /health


---

# Service Communication

The services communicate using **REST-based service-to-service communication**.

### Communication Flow

1. The client sends login request to **API Gateway**


POST /auth/login


2. API Gateway forwards the request to **Auth Service**

3. Auth Service verifies credentials and returns a **JWT token**

4. The client sends task requests with the JWT token


Authorization: Bearer <token>


5. API Gateway forwards the request to **Task Service**

6. When a new task is created, Task Service sends a request to **Notification Service**


POST /notifications


7. Notification Service stores the notification and returns a response.

---

# Authentication and Authorization

Authentication is implemented using **JWT (JSON Web Token)**.

### Authentication Flow

1. User logs in via:


POST /auth/login


2. Auth Service generates a **JWT token**

3. The client includes the token in future requests:


Authorization: Bearer <token>


4. Task Service validates the token before executing protected operations.

---

### Protected Endpoints

The following operations require authentication:


POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id


If no token is provided, the server returns:


401 Unauthorized


---

# API Endpoints

## API Gateway


GET /health
POST /auth/login
GET /tasks
GET /tasks/:id
POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id
GET /notifications


---

## Auth Service


GET /health
POST /auth/login


---

## Task Service


GET /health
GET /tasks
GET /tasks/:id
POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id


---

## Notification Service


GET /health
POST /notifications
GET /notifications


---

# Technologies Used

The project is built using the following technologies:


Node.js
Express.js
JWT Authentication
Axios
REST APIs
Microservice Architecture
API Gateway Pattern


---

# How to Run the Project

Each service must be started in a separate terminal.

---

## Start Auth Service


cd auth-service
npm install
npm start


Runs on:


http://localhost:3001


---

## Start Task Service


cd task-service
npm install
npm start


Runs on:


http://localhost:8080


---

## Start Notification Service


cd notification-service
npm install
npm start


Runs on:


http://localhost:3003


---

## Start API Gateway


cd api-gateway
npm install
npm start


Runs on:


http://localhost:3000


---

# Example Test Flow

### 1 Login


POST http://localhost:3000/auth/login


Body:


{
"username": "admin",
"password": "admin123"
}


Returns:


JWT Token


---

### 2 Create Task


POST http://localhost:3000/tasks


Headers:


Authorization: Bearer <token>


Body:


{
"title": "Finish HW2",
"description": "Create distributed system",
"status": "todo"
}


---

### 3 Check Notifications


GET http://localhost:3000/notifications


A notification appears when a task is created.

---

### 4 Unauthorized Test

If the token is missing:


POST /tasks


The response will be:


401 Unauthorized


---

# Project Structure


hw2-microservices
│
├── api-gateway
│ ├── server.js
│ └── package.json
│
├── auth-service
│ ├── server.js
│ ├── package.json
│ └── .env
│
├── task-service
│ ├── src
│ ├── index.js
│ ├── package.json
│ └── .env
│
├── notification-service
│ ├── server.js
│ ├── package.json
│ └── .env
│
└── README.md


---

# Conclusion

This project successfully demonstrates a distributed microservice architecture.

Key concepts implemented in the system include:

- API Gateway pattern
- REST-based service communication
- JWT authentication
- Microservice separation
- Protected endpoints
- Event-like service interaction between services

The system shows how independent services can collaborate to build a scalable distributed application.