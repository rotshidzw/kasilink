# KasiLink

KasiLink is a full-stack T3-style MVP built with Next.js App Router, tRPC, Prisma, NextAuth, Tailwind, and shadcn/ui.

## Features
- Role-based flows: RESIDENT, BUSINESS, YOUTH, ADMIN.
- Service requests: residents submit, youth/business claim and update status.
- Cleanup events: create, list, RSVP, and upload proof images.
- Admin dashboard with stats.
- Seeded demo data.

## Getting Started

### 1. Start Postgres
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the repo root:
```bash
DATABASE_URL="postgresql://kasilink:kasilink@localhost:5432/kasilink"
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
- `resident@kasilink.local`
- `youth@kasilink.local`
- `business@kasilink.local`
- `admin@kasilink.local`

## Proof Image Storage
Proof uploads are handled by a storage provider abstraction in `src/server/providers/storage.ts`. The default is `LocalStorageProvider`, which saves files to `/public/uploads` and returns a public URL. A `HuaweiOBSProvider` stub is included for future integration.
