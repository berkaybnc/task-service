# Task Service – Cloud-Ready Intelligent Microservice

## Project Overview

Task Service is a cloud-ready, production-oriented microservice developed to demonstrate modern software engineering practices.

This project was implemented as part of the assignment **“Design and Prototype a Cloud-Ready Intelligent Microservice”**.  
The main goal is to showcase how a real-world microservice can be designed using industry-standard concepts and tools.

The project focuses on the following topics:

- Clean Architecture
- RESTful API Design
- Containerization with Docker
- CI/CD Concepts
- Observability (Logging and Health Checks)
- Security Basics using JWT Authentication

The service provides a simple task management API with authentication and interactive documentation.

---

## Architecture

The project follows **Clean Architecture** principles to ensure a clear separation of concerns, maintainability, and scalability.

### Architectural Layers

**API Layer**
- Express routes and controllers
- Authentication and error-handling middlewares
- Swagger (OpenAPI) documentation

**Application Layer**
- Use cases
- Business logic

**Domain Layer**
- Core entities
- Domain rules and validations

**Infrastructure Layer**
- Logging with Pino
- In-memory data persistence
- Environment-based configuration

This layered approach ensures that business logic remains independent from frameworks and infrastructure details.

---

## REST API Design

The service exposes a RESTful API using JSON over HTTP.

### Available Endpoints

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /health | Service health check |
| POST | /auth/login | Generate JWT token |
| GET | /tasks | List all tasks |
| POST | /tasks | Create a new task (secured) |
| GET | /tasks/{id} | Get task by ID |
| PATCH | /tasks/{id} | Update a task (secured) |
| DELETE | /tasks/{id} | Delete a task (secured) |

---

## API Documentation

Interactive API documentation is provided using **Swagger (OpenAPI 3.0)**.

The documentation is available at:

http://localhost:8080/docs

Swagger allows testing endpoints directly from the browser and supports JWT authorization.

---

## Security

The following security mechanisms are implemented:

- JWT-based authentication
- Protected endpoints for creating, updating, and deleting tasks
- Environment variables for sensitive configuration
- No hard-coded secrets in the source code

---

## Observability

The service includes basic observability features:

- Structured logging using **Pino**
- Centralized error-handling middleware
- Health monitoring endpoint:

GET /health

---

## Containerization (Docker)

The application is fully containerized and ready for cloud environments.

### Build and Run with Docker

docker compose up --build

After the container starts, the service is accessible at:

http://localhost:8080/health  
http://localhost:8080/docs

---

## CI/CD (Concept)

A Continuous Integration pipeline is implemented using **GitHub Actions**.

On every push or pull request to the `master` branch, the pipeline performs the following steps:

1. Install project dependencies  
2. Run automated tests  
3. Build the Docker image  

This setup demonstrates CI/CD concepts and automated build validation.

---

## Technologies Used

- Node.js (v20)
- Express.js
- Docker and Docker Compose
- GitHub Actions
- Swagger / OpenAPI
- JSON Web Token (JWT)
- Pino Logger

---

## Running Locally (Without Docker)

npm install  
npm run dev

---

## Author

Berkay Binici

This project was developed for educational purposes to demonstrate cloud-ready microservice design and modern software engineering practices.