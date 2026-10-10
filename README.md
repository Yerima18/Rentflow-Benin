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
- **Public demo** — Passwordless guest access to fictional Cotonou properties, tenants, rent payments, receipts, and expenses in a read-only sample account

## Public demo

Open the live demo at [rentflow-benin.vercel.app](https://rentflow-benin.vercel.app/)
and choose **Explore the public demo**, then **Continue as guest** on the login
page. No shared email or password is needed. All names and records are
fictional; demo mutations and registration are blocked at the API and hidden
or replaced in the interface.

For a Vercel deployment that already has a `DATABASE_URL`, set
`DEMO_MODE=true` in the Production environment and redeploy before sharing the
demo. This PR does not change Vercel settings or verify the live URL; confirm
the homepage, sample login, dashboard, and property detail page after deploy.

When `DEMO_MODE=true` (or when `DATABASE_URL` is absent), the app serves bundled
fictional fixtures without connecting to PostgreSQL. The demo covers 12
properties in Fidjrossè, Akpakpa, Cadjehoun, Calavi, and nearby Cotonou areas.
These fixtures are not a database seed and contain no landlord or tenant data.

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

Copy `.env.example` to `.env`:

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

# Use isolated sample data; no database is needed in this mode
DEMO_MODE="true"

# Optional local demo fixture credentials (set a password of 12+ characters)
DEMO_SEED_EMAIL="demo@example.invalid"
DEMO_SEED_PASSWORD=""
```

The values above are examples for local development only. Public demo access is
passwordless and read-only. Do not commit your `.env` file.

### 4. Run database migrations

```bash
npm run db:migrate:dev
```

This applies the checked-in migrations to your local database. `npm run build`
only builds the application and does not connect to PostgreSQL; migrations are
an explicit step.

To use the normal database-backed app locally, create a local PostgreSQL
database and set `DEMO_MODE=false` before applying migrations. Demo mode keeps
the public sample account isolated from normal landlord accounts.

To create the optional, clearly fictional demo landlord, properties, tenants,
and sample payments after migrating the local database, set `DEMO_SEED_EMAIL`
and `DEMO_SEED_PASSWORD` in `.env`, then run:

```bash
npm run db:seed
```

The seed uses stable fixture IDs and can be run repeatedly without adding
duplicate demo records. Sample payment months track the current and previous
month. It refuses production environments by default and refuses remote
databases unless `DEMO_SEED_ALLOW_REMOTE_DATABASE=true` is explicitly set.
Only enable remote seeding for a separate, isolated demo database; never point
the seed at a database containing real landlords or tenants. Production also
requires `DEMO_SEED_ALLOW_PRODUCTION=true` as a separate explicit opt-in.

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

This app can deploy on **Vercel** as a no-database read-only demo or as a
database-backed landlord app.

### Vercel read-only demo

Set `DEMO_MODE=true` in the Vercel **Production** environment, then redeploy.
This selects only fictional in-app fixtures, blocks mutations and registration,
and skips production migrations; `DATABASE_URL` is not required for the demo.
The same mode is selected automatically if no database URL is present. The
login page offers public guest access without a shared password. Do not add
tenant records to a demo deployment.

Set `NEXTAUTH_SECRET` to a generated value and `NEXTAUTH_URL` to the canonical
site URL when available. Isolated demo mode has a public, read-only fallback
signing key so a missing secret cannot take the sample site offline; that
fallback is not suitable for database-backed accounts.

### Vercel database-backed app

1. Import the repo on [vercel.com](https://vercel.com).
2. Set `DEMO_MODE=false`, `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in Vercel's **Production** environment. Use the production database URL and a newly generated secret; never use local example values.
3. Deploy. `vercel.json` selects `npm run vercel-build`: production deployments outside demo mode run `prisma migrate deploy` before the normal build. Demo mode and preview builds do not run migrations. The `postinstall` script generates Prisma Client and does not need a database.

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

Do not run `npm run db:seed` against a production landlord database. The seed
requires demo credentials in environment variables, uses clearly fictional
names and addresses with non-dialable contact placeholders, and refuses
production by default. Remote/production opt-ins are only for a separate demo
database.

## Smoke checks

`npm run smoke:demo` starts a production server without a database and checks
the homepage, public sample login, dashboard, one property detail page, sample
records, and rejected property/tenant/payment/expense/profile writes. CI runs
the production build and these smoke checks on pull requests and pushes to
`main`.

The public demo uses bundled fixtures, not a live or seeded database. A
database-backed deployment, its credentials, migration baseline, and the live
Vercel deployment must be verified separately before real landlord use.

## License

MIT
