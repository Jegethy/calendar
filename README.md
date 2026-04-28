# Shared Calendar App

A full-stack shared calendar application built with Next.js 14, Prisma, and PostgreSQL.

## Tech Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Prisma 7** ORM with `@prisma/adapter-pg` for PostgreSQL
- **JWT** authentication via `jose` with HttpOnly cookies
- **rrule** for recurring event expansion

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your database URL:
   ```bash
   cp .env.example .env
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Seed the database with demo users:
   ```bash
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

| User  | Email                  | Password  |
|-------|------------------------|-----------|
| Scott | scott@calendar.app     | scott123  |
| Sue   | sue@calendar.app       | sue123    |

## Features

- Monthly calendar view with color-coded events per user
- Create, edit, and delete events (own events only)
- Recurring events: daily, weekly, monthly
- User-customizable event colors
- Shared view showing all users' events
- JWT-based authentication with protected routes
