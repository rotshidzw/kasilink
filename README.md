# KasiLink

KasiLink is a community-based service + delivery platform built with Next.js App Router, Prisma, NextAuth, Tailwind, and shadcn/ui.

## Features
- Role-based dashboards for residents, spaza shops, drivers, and admins.
- Service requests (water, gas, bulk grocery, handyman) with status tracking.
- Spaza inventory management and restock day announcements.
- Delivery jobs with OTP confirmation.
- Seeded demo data and modern dashboard UI.

## Getting Started

### 1. Start Postgres
```bash
npm run db:up
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the repo root:
```bash
DATABASE_URL="postgresql://kasilink:kasilink@127.0.0.1:5433/kasilink?schema=public"
NEXTAUTH_SECRET="dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run migrations and seed data
```bash
npm run prisma:migrate
npm run seed
```

### 5. Run the app
```bash
npm run dev
```

## Demo Accounts
All demo users share the password `Password123!`:
- `resident@kasilink.local`
- `business@kasilink.local`
- `driver@kasilink.local`
- `admin@kasilink.local`

## Prisma notes (Windows)
If Prisma generate or migrate fails on Windows with EPERM errors, stop the Next.js dev server before running:
```bash
npm run prisma:generate
npm run prisma:migrate
```
Then restart the dev server.

## Useful scripts
- `npm run db:up` / `npm run db:down`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run seed`

## Troubleshooting
If sign-in fails, confirm Postgres is running, run migrations + seed, and verify your `DATABASE_URL` value.
