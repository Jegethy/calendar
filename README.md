# Shared Calendar App

A full-stack shared calendar application built with Next.js 15, Prisma 7, and PostgreSQL. Two users (Scott and Sue) share a single monthly calendar view and can each manage their own color-coded events, including recurring ones.

## Features

- **Shared monthly calendar** — all users' events displayed together, color-coded per user
- **Full event CRUD** — create, edit, and delete events (own events only)
- **Recurring events** — set daily, weekly, or monthly recurrence rules via the [rrule](https://github.com/jakubroztocil/rrule) standard
- **User-customizable event color** — each user picks their own accent color from the profile settings
- **JWT authentication** — stateless session stored in an HttpOnly cookie; all routes are protected by edge middleware
- **Instant redirects** — unauthenticated users are redirected to `/login`; authenticated users are redirected away from `/login`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL |
| Auth | `jose` (JWT, HS256, 7-day expiry) |
| Recurrence | `rrule` |

## Getting Started

### Prerequisites

- **Node.js 18+**
- **PostgreSQL** database (local or hosted)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** — copy the example file and fill in your values:
   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/calendar` |
   | `JWT_SECRET` | A long, random secret string used to sign JWT tokens |

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database** with two demo users:
   ```bash
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

The build outputs a standalone Next.js server. Set the same environment variables (`DATABASE_URL`, `JWT_SECRET`) in your production environment before starting.

### Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the environment variables `DATABASE_URL` and `JWT_SECRET` under **Settings → Environment Variables**.
4. Vercel auto-detects Next.js and deploys on every push.

> **Note:** Make sure your PostgreSQL database accepts connections from Vercel's IP ranges (or use a connection pooler such as [Supabase](https://supabase.com) or [Neon](https://neon.tech)).

### Deploying to a VPS / Docker

1. Build the image or run `npm run build` directly on the server.
2. Export environment variables and run `npm start`.
3. Optionally, use a process manager such as PM2:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name calendar
   pm2 save
   ```

## Demo Accounts

These accounts are created by `npx prisma db seed`:

| User  | Email              | Password |
|-------|--------------------|----------|
| Scott | scott@calendar.app | scott123 |
| Sue   | sue@calendar.app   | sue123   |

## Project Structure

```
app/
  api/
    auth/         # login, logout, me endpoints
    events/       # CRUD for events
    users/[id]/   # user color update
  login/          # login page
  page.tsx         # main calendar page
components/
  Calendar.tsx    # monthly grid with event expansion
  EventModal.tsx  # create/edit event form
  Header.tsx      # top navigation bar
lib/
  auth.ts         # JWT sign/verify helpers
  prisma.ts       # Prisma client singleton
middleware.ts     # edge auth guard
prisma/
  schema.prisma   # database schema
  seed.ts         # demo data seed
prisma.config.ts  # Prisma 7 datasource config
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Authenticate and set cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Return current user |
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create an event |
| `PUT` | `/api/events/[id]` | Update an event (owner only) |
| `DELETE` | `/api/events/[id]` | Delete an event (owner only) |
| `PUT` | `/api/users/[id]` | Update user color (self only) |
