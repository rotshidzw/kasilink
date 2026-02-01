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
WHATSAPP_PROVIDER=stub
WHATSAPP_VERIFY_TOKEN=dev_verify_token
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
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

## WhatsApp setup
KasiLink ships with a stub WhatsApp provider for local MVP testing. Use the env vars below in `.env` (see `.env.example`):
- `WHATSAPP_PROVIDER` (`stub` or `meta`)
- `WHATSAPP_VERIFY_TOKEN` (used for webhook verification)
- `WHATSAPP_ACCESS_TOKEN` (Meta Cloud API access token)
- `WHATSAPP_PHONE_NUMBER_ID` (Meta Cloud API phone number ID)

Use the dev simulator endpoint in development to inject messages without Meta:
`POST /api/whatsapp/dev-simulate` with `{ "phone": "+2782...", "text": "water address: 12 Main St" }`.

## Prisma notes (Windows)
If Prisma generate or migrate fails on Windows with EPERM errors (for example, `rename query_engine-windows.dll.node`), stop the Next.js dev server before running:
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
