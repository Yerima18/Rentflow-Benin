import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  demoMode: vi.fn(),
  getServerSession: vi.fn(),
  bcryptHash: vi.fn(),
  bcryptCompare: vi.fn(),
  prisma: {
    landlord: { findUnique: vi.fn(), create: vi.fn() },
    property: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    tenant: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    payment: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    expense: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("bcrypt", () => ({ default: { hash: mocks.bcryptHash, compare: mocks.bcryptCompare } }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@/lib/demo", () => ({
  isDemoMode: mocks.demoMode,
  isDemoSession: (session) => mocks.demoMode() || Boolean(session?.user?.isDemo),
  demoReadOnlyResponse: () => Response.json({ error: "Read-only demo", readOnly: true }, { status: 403 }),
}));

import { POST as register } from "@/app/api/auth/register/route";
import { GET as getProperties } from "@/app/api/properties/route";
import { GET as getTenants, POST as createTenant } from "@/app/api/tenants/route";
import { PUT as updateTenant } from "@/app/api/tenants/[id]/route";
import { POST as createPayment } from "@/app/api/payments/route";
import { PUT as updatePayment } from "@/app/api/payments/[id]/route";
import { POST as createExpense } from "@/app/api/expenses/route";
import { authOptions } from "@/lib/auth";

const landlordSession = { user: { id: "landlord-a", name: "Test Landlord", isDemo: false } };

function jsonRequest(path, body, method = "POST") {
  return new Request(`http://rentflow.test${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function findProvider(predicate) {
  const provider = authOptions.providers.find(predicate);
  expect(provider).toBeDefined();
  expect(typeof provider.options?.authorize).toBe("function");
  return provider;
}

function authorize(provider, credentials) {
  return Reflect.apply(provider.options.authorize, provider, [credentials, {}]);
}

describe("authentication and landlord API boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DATABASE_URL = "postgresql://rentflow-test.invalid/test";
    mocks.demoMode.mockReturnValue(false);
    mocks.getServerSession.mockResolvedValue(landlordSession);
    mocks.bcryptHash.mockResolvedValue("hashed-test-password");
    mocks.bcryptCompare.mockResolvedValue(true);
    mocks.prisma.landlord.findUnique.mockResolvedValue(null);
    mocks.prisma.landlord.create.mockResolvedValue({ id: "landlord-b", email: "new@example.test", name: "New Landlord" });
    mocks.prisma.property.findFirst.mockResolvedValue({ id: "property-a", landlordId: "landlord-a" });
    mocks.prisma.property.findUnique.mockResolvedValue({ id: "property-a", landlordId: "landlord-a" });
    mocks.prisma.tenant.findFirst.mockResolvedValue({ id: "tenant-a", propertyId: "property-a" });
    mocks.prisma.tenant.findMany.mockResolvedValue([]);
    mocks.prisma.tenant.create.mockResolvedValue({ id: "tenant-created" });
    mocks.prisma.tenant.update.mockResolvedValue({ id: "tenant-a" });
    mocks.prisma.payment.findFirst.mockResolvedValue({ id: "payment-a" });
    mocks.prisma.payment.create.mockResolvedValue({ id: "payment-created", amount: 75000, status: "PAID", month: "2026-10" });
    mocks.prisma.payment.update.mockResolvedValue({ id: "payment-a", amount: 82500, status: "PAID", month: "2026-10" });
    mocks.prisma.expense.create.mockResolvedValue({ id: "expense-created", amount: 5000 });
  });

  it("registers a normal landlord without returning the password hash", async () => {
    const response = await register(jsonRequest("/api/auth/register", {
      name: "New Landlord",
      email: "new@example.test",
      password: "safe-test-password",
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "landlord-b", email: "new@example.test", name: "New Landlord" });
    expect(mocks.prisma.landlord.create).toHaveBeenCalledWith({
      data: { name: "New Landlord", email: "new@example.test", password: "hashed-test-password" },
    });
  });

  it("keeps password login for landlords separate from passwordless demo guest access", async () => {
    const landlord = findProvider((provider) => provider.options?.name === "Credentials");
    const guest = findProvider((provider) => provider.options?.id === "demo-guest");
    mocks.prisma.landlord.findUnique.mockResolvedValue({
      id: "landlord-a",
      email: "owner@example.test",
      name: "Owner",
      password: "hashed-existing-password",
    });

    const landlordUser = await authorize(landlord, { email: "owner@example.test", password: "correct-test-password" });
    expect(landlordUser).toMatchObject({ id: "landlord-a", email: "owner@example.test", name: "Owner" });

    mocks.demoMode.mockReturnValue(true);
    const guestUser = await authorize(guest, {});
    expect(guestUser).toMatchObject({ isDemo: true });
    await expect(authorize(landlord, { email: "owner@example.test", password: "correct-test-password" }))
      .rejects.toThrow("Use guest access to explore the public demo.");
  });

  it("blocks registration while the public demo is active", async () => {
    mocks.demoMode.mockReturnValue(true);
    const response = await register(jsonRequest("/api/auth/register", {
      name: "Ignored",
      email: "ignored@example.test",
      password: "safe-test-password",
    }));

    expect(response.status).toBe(403);
    expect(mocks.prisma.landlord.create).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated API reads and writes before accessing records", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const responses = await Promise.all([
      getProperties(),
      getTenants(new Request("http://rentflow.test/api/tenants")),
      createPayment(jsonRequest("/api/payments", { tenantId: "tenant-a", amount: 75000, status: "PAID", month: "2026-10" })),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
    expect(mocks.prisma.property.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.tenant.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.payment.create).not.toHaveBeenCalled();
  });

  it("scopes tenant reads and edits to the signed-in landlord", async () => {
    mocks.prisma.tenant.findMany.mockImplementation(async ({ where }) => (
      where.property.landlordId === "landlord-a" ? [{ id: "tenant-a" }] : [{ id: "tenant-a" }, { id: "tenant-b" }]
    ));
    const listResponse = await getTenants(new Request("http://rentflow.test/api/tenants"));

    expect(await listResponse.json()).toEqual([{ id: "tenant-a" }]);
    expect(mocks.prisma.tenant.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ property: { landlordId: "landlord-a" } }),
    }));

    mocks.prisma.tenant.findFirst.mockResolvedValue(null);
    const editResponse = await updateTenant(
      jsonRequest("/api/tenants/tenant-b", {
        fullName: "Tenant B", phone: "test", unitNumber: "B1", rentAmount: 75000, dueDate: 1,
      }, "PUT"),
      { params: Promise.resolve({ id: "tenant-b" }) },
    );

    expect(editResponse.status).toBe(404);
    expect(mocks.prisma.tenant.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "tenant-b", property: { landlordId: "landlord-a" } },
    }));
    expect(mocks.prisma.tenant.update).not.toHaveBeenCalled();
  });

  it("records and edits payments for an owned tenant", async () => {
    const createResponse = await createPayment(jsonRequest("/api/payments", {
      tenantId: "tenant-a", amount: 75000, status: "PAID", month: "2026-10",
    }));

    expect(createResponse.status).toBe(201);
    expect(mocks.prisma.payment.create).toHaveBeenCalledWith({
      data: { tenantId: "tenant-a", amount: 75000, status: "PAID", month: "2026-10" },
    });

    const editResponse = await updatePayment(
      jsonRequest("/api/payments/payment-a", { amount: 82500, status: "PAID" }, "PUT"),
      { params: Promise.resolve({ id: "payment-a" }) },
    );

    expect(editResponse.status).toBe(200);
    expect(mocks.prisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-a" },
      data: { amount: 82500, status: "PAID" },
    });
  });

  it("rejects fractional or malformed FCFA amounts in rent, payments, and expenses", async () => {
    const invalidPayment = await createPayment(jsonRequest("/api/payments", {
      tenantId: "tenant-a", amount: "75,000", status: "PAID", month: "2026-10",
    }));
    const invalidTenant = await createTenant(jsonRequest("/api/tenants", {
      fullName: "Test Tenant", phone: "test", unitNumber: "A1", rentAmount: 75000.5, dueDate: 1, propertyId: "property-a",
    }));
    const invalidExpense = await createExpense(jsonRequest("/api/expenses", {
      amount: "5.000,25", description: "test", category: "Maintenance", propertyId: "property-a",
    }));

    expect([invalidPayment.status, invalidTenant.status, invalidExpense.status]).toEqual([400, 400, 400]);
    expect(mocks.prisma.payment.create).not.toHaveBeenCalled();
    expect(mocks.prisma.tenant.create).not.toHaveBeenCalled();
    expect(mocks.prisma.expense.create).not.toHaveBeenCalled();
  });

  it("rejects invalid payment edits before writing", async () => {
    const response = await updatePayment(
      jsonRequest("/api/payments/payment-a", { amount: 75000.25 }, "PUT"),
      { params: Promise.resolve({ id: "payment-a" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.prisma.payment.update).not.toHaveBeenCalled();
  });
});
