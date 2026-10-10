import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const DEMO_LANDLORD_ID = "rentflow-demo-landlord-v1";
const DEMO_LANDLORD_NAME = "Bailleur Démo — données fictives";
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const propertyFixtures = [
  {
    id: "rentflow-demo-property-residence-v1",
    name: "Résidence Démo 01",
    address: "Adresse fictive — Cotonou (démo 01)",
    units: 10,
  },
  {
    id: "rentflow-demo-property-villa-v1",
    name: "Villa Démo 02",
    address: "Adresse fictive — Cotonou (démo 02)",
    units: 4,
  },
];

const tenantFixtures = [
  {
    id: "rentflow-demo-tenant-01-v1",
    fullName: "Locataire Démo 01 (fictif)",
    phone: "DEMO-ONLY-01",
    unitNumber: "A1",
    rentAmount: 150_000,
    dueDate: 5,
    propertyId: propertyFixtures[0].id,
  },
  {
    id: "rentflow-demo-tenant-02-v1",
    fullName: "Locataire Démo 02 (fictif)",
    phone: "DEMO-ONLY-02",
    unitNumber: "A2",
    rentAmount: 150_000,
    dueDate: 5,
    propertyId: propertyFixtures[0].id,
  },
  {
    id: "rentflow-demo-tenant-03-v1",
    fullName: "Locataire Démo 03 (fictif)",
    phone: "DEMO-ONLY-03",
    unitNumber: "Villa 1",
    rentAmount: 250_000,
    dueDate: 1,
    propertyId: propertyFixtures[1].id,
  },
];

function readSeedConfig() {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (isProduction && process.env.DEMO_SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error(
      "Refusing to seed in production. Only enable this for a dedicated demo database.",
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the local demo database.");
  }

  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
    throw new Error("DATABASE_URL must use PostgreSQL.");
  }

  const isLocalDatabase = LOCAL_DATABASE_HOSTS.has(parsedDatabaseUrl.hostname);
  if (!isLocalDatabase && process.env.DEMO_SEED_ALLOW_REMOTE_DATABASE !== "true") {
    throw new Error(
      "Refusing to seed a remote database. Set DEMO_SEED_ALLOW_REMOTE_DATABASE=true only for an isolated demo database.",
    );
  }

  const email = process.env.DEMO_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_SEED_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set DEMO_SEED_EMAIL to a valid development/demo email address.");
  }
  if (!password || password.length < 12) {
    throw new Error("Set DEMO_SEED_PASSWORD to a development/demo password of at least 12 characters.");
  }

  return { databaseUrl, email, password };
}

function monthWithOffset(offset: number) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function firstDayOfMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1, 12));
}

async function main() {
  const config = readSeedConfig();
  const adapter = new PrismaPg({ connectionString: config.databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingDemoLandlord = await prisma.landlord.findUnique({
      where: { id: DEMO_LANDLORD_ID },
    });
    const existingEmailOwner = await prisma.landlord.findUnique({
      where: { email: config.email },
    });

    if (existingDemoLandlord && existingDemoLandlord.name !== DEMO_LANDLORD_NAME) {
      throw new Error("The demo landlord ID belongs to another record; refusing to update it.");
    }
    if (existingEmailOwner && existingEmailOwner.id !== DEMO_LANDLORD_ID) {
      throw new Error("DEMO_SEED_EMAIL already belongs to another landlord; refusing to reuse it.");
    }

    const hashedPassword = await bcrypt.hash(config.password, 12);
    const landlord = await prisma.landlord.upsert({
      where: { id: DEMO_LANDLORD_ID },
      update: {
        email: config.email,
        name: DEMO_LANDLORD_NAME,
        password: hashedPassword,
      },
      create: {
        id: DEMO_LANDLORD_ID,
        email: config.email,
        name: DEMO_LANDLORD_NAME,
        password: hashedPassword,
      },
    });

    for (const property of propertyFixtures) {
      const existingProperty = await prisma.property.findUnique({
        where: { id: property.id },
      });
      if (existingProperty && existingProperty.landlordId !== landlord.id) {
        throw new Error(`Demo property ${property.id} belongs to another landlord; refusing to update it.`);
      }

      await prisma.property.upsert({
        where: { id: property.id },
        update: { ...property, landlordId: landlord.id },
        create: { ...property, landlordId: landlord.id },
      });
    }

    for (const tenant of tenantFixtures) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { id: tenant.id },
      });
      if (existingTenant && existingTenant.propertyId !== tenant.propertyId) {
        throw new Error(`Demo tenant ${tenant.id} belongs to another property; refusing to update it.`);
      }

      await prisma.tenant.upsert({
        where: { id: tenant.id },
        update: tenant,
        create: tenant,
      });
    }

    const previousMonth = monthWithOffset(-1);
    const currentMonth = monthWithOffset(0);
    const paymentFixtures = [
      { tenantId: tenantFixtures[0].id, amount: 150_000, status: "PAID", month: previousMonth },
      { tenantId: tenantFixtures[0].id, amount: 150_000, status: "PENDING", month: currentMonth },
      { tenantId: tenantFixtures[1].id, amount: 150_000, status: "PAID", month: currentMonth },
      { tenantId: tenantFixtures[2].id, amount: 250_000, status: "PAID", month: previousMonth },
    ];

    for (const payment of paymentFixtures) {
      const id = `rentflow-demo-payment-${payment.tenantId}-${payment.month}`;
      const existingPayment = await prisma.payment.findUnique({ where: { id } });
      if (existingPayment && existingPayment.tenantId !== payment.tenantId) {
        throw new Error(`Demo payment ${id} belongs to another tenant; refusing to update it.`);
      }

      await prisma.payment.upsert({
        where: { id },
        update: { ...payment, date: firstDayOfMonth(payment.month) },
        create: { id, ...payment, date: firstDayOfMonth(payment.month) },
      });
    }

    console.log("Fictional Rentflow demo fixtures are ready.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Demo seed failed.");
  process.exitCode = 1;
});
