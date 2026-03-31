# PHOTobooth Native

Monorepo MVP gá»“m 4 khá»‘i cháº¡y Ä‘Æ°á»£c:
- `apps/web`: Next.js web app cho user flow vÃ  admin
- `apps/api`: NestJS backend API `v1`
- `packages/db`: Prisma schema, migrations, seed vÃ  PG boss helper
- `apps/photo-worker`: worker xá»­ lÃ½ áº£nh báº¥t Ä‘á»“ng bá»™

## Prerequisites

- Node.js 22+
- PostgreSQL local
- `corepack` kháº£ dá»¥ng

## Setup

```powershell
$env:COREPACK_HOME="H:\photobooth\.corepack"
corepack pnpm install
Copy-Item .env.example .env
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

## Seed accounts

- Admin: `admin@photobooth.local` / `Admin123!`
- Demo user: `demo@photobooth.local` / `Demo123!`
