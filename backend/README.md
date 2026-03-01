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

## Project Structure

```
backend/
├── src/          # Application source code
├── prisma/       # Prisma schema & migrations
├── .env.example  # Environment variable template
└── README.md
```
