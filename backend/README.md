# Backend

## Prerequisites

- Node.js 18+
- PostgreSQL 16 (or use Docker Compose)

## Getting Started

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Start the database:
   ```bash
   docker compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation (Swagger)

After starting the backend, open:

```text
http://localhost:3000/api-docs
```

Use the `Authorize` button and paste a `Bearer <token>` JWT for protected endpoints.

Important notes for `Try it out`:

- Paste only the raw JWT token in `Authorize`. Do not include `Bearer ` because Swagger UI adds that automatically.
- Protected endpoints return `401` until you log in and authorize.
- Endpoints with path params such as car IDs, booking IDs, and review IDs require real values from your database.

Common `Try it out` errors:

- `401 Unauthorized`: you are not logged in or the JWT token was pasted incorrectly.
- `403 Forbidden`: the endpoint is admin-only and you are using a non-admin token.
- `404 Not Found`: you used a placeholder or invalid resource ID.
- `400 Bad Request`: required fields are missing, or booking dates are invalid or in the past.

Useful helpers:

- `GET /api/cars` to find a real `carId`
- `GET /api/bookings/me` to find your booking IDs
- `GET /api/reviews/{carId}` to find review IDs
- `GET /api-docs.json` to inspect the raw OpenAPI document

## Project Structure

```
backend/
├── src/          # Application source code
├── prisma/       # Prisma schema & migrations
├── .env.example  # Environment variable template
└── README.md
```
