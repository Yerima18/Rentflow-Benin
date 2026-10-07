# RentFlow Benin

A property management web application for landlords in Benin. Manage properties, tenants, rent payments, and expenses from a single dashboard — with bilingual support (French / English).

## Features

- **Authentication** — Secure landlord accounts with email/password (JWT sessions)
- **Properties** — Add, edit, and delete rental properties
- **Tenants** — Register tenants with lease details, rent amount, and due date
- **Payments** — Record and track rent payments (PAID / PENDING / OVERDUE) with WhatsApp receipt generation
- **Expenses** — Log property expenses by category (Maintenance, Taxes, Utilities, Insurance, Other)
- **Reports** — Financial overview with total revenue, expenses, and net profit
- **Bilingual** — Full French and English interface (FR/EN switcher)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon / Supabase) |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Auth | NextAuth v4 (credentials + JWT) |
| Passwords | bcrypt (12 rounds) |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Yerima18/Rentflow-Benin.git
cd Rentflow-Benin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Local PostgreSQL only. Replace with your own local development database.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rentflow_dev?schema=public"

# Local-only placeholder. Generate a real value with: openssl rand -base64 32
NEXTAUTH_SECRET="replace-with-a-random-local-secret"

# Local development URL
NEXTAUTH_URL="http://localhost:3000"
```

The values above are examples for local development only. Do not use them in
production or commit your `.env` file.

### 4. Run database migrations

```bash
npm run db:migrate:dev
```

This applies the checked-in migrations to your local database. `npm run build`
only builds the application and does not connect to PostgreSQL; migrations are
an explicit step.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

```
Landlord
  └── Property (many)
        ├── Tenant (many)
        │     └── Payment (many)
        └── Expense (many)
```

| Model | Key Fields |
|---|---|
| `Landlord` | email, password (hashed), name |
| `Property` | name, address, units |
| `Tenant` | fullName, phone, unitNumber, rentAmount, dueDate (1–31), leaseStart |
| `Payment` | amount, date, status (PAID/PENDING/OVERDUE), month (YYYY-MM) |
| `Expense` | amount, date, description, category |

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new landlord |
| GET/POST | `/api/properties` | List / create properties |
| PUT/DELETE | `/api/properties/[id]` | Edit / delete a property |
| GET/POST | `/api/tenants` | List / create tenants |
| PUT/DELETE | `/api/tenants/[id]` | Edit / delete a tenant |
| GET/POST | `/api/payments` | List / record payments |
| PUT | `/api/payments/[id]` | Update payment status or amount |
| GET/POST | `/api/expenses` | List / create expenses |
| PUT/DELETE | `/api/expenses/[id]` | Edit / delete an expense |
| PUT | `/api/settings` | Update profile and password |

## Project Structure

```
src/
├── app/
│   ├── api/              # API route handlers
│   ├── dashboard/        # Protected dashboard pages
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── page.tsx          # Landing page
├── components/           # Sidebar, Navbar, DatePicker, Providers
└── lib/
    ├── auth.ts           # NextAuth configuration
    ├── prisma.ts         # PrismaClient singleton
    └── i18n/             # EN/FR dictionaries and LanguageProvider
prisma/
├── schema.prisma         # Database models
├── migrations/           # Versioned PostgreSQL schema changes
└── seed.ts               # Optional seed data
prisma.config.ts          # Prisma v7 datasource config
```

## Deployment

This app is designed to deploy on **Vercel** with a managed PostgreSQL database (Neon or Supabase recommended).

1. Import the repo on [vercel.com](https://vercel.com).
2. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in Vercel's **Production** environment. Use the production database URL and a newly generated secret; never use the local example values.
3. Deploy. `vercel.json` selects `npm run vercel-build`: on production deployments it runs `prisma migrate deploy` before the normal build. Preview deployments build without running migrations. The `postinstall` script generates Prisma Client and does not need a database.

### Existing production database

The initial migration describes the schema that existed when migrations were
introduced. A database previously created with `prisma db push` has no migration
history, so do not run `npm run db:migrate:deploy` against it until you have
verified that its schema matches `prisma/migrations/20261007202000_initial_schema/migration.sql`
and taken a backup. For a matching existing database only, mark that initial
migration as already applied once, using its production `DATABASE_URL` in a
secure environment:

```bash
npx prisma migrate resolve --applied 20261007202000_initial_schema
```

Do not run this baseline command on a new or schema-mismatched database. New
databases should use `npm run db:migrate:deploy` to create their schema from the
versioned migrations.

## License

MIT
