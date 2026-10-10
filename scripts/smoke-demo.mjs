import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

const DEMO_EMAIL = "demo@rentflow.bj";
const DEMO_PASSWORD = "rentflow-demo-2026";

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

function updateCookies(jar, response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) jar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

function cookieHeader(jar) {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

const port = await availablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const serverEnv = {
  ...process.env,
  DATABASE_URL: "",
  NEXTAUTH_URL: baseUrl,
};
delete serverEnv.DEMO_MODE;
delete serverEnv.NEXTAUTH_SECRET;

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: serverEnv,
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function fetchReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.status === 200) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not start in time.\n${serverOutput}`);
}

try {
  await fetchReady();

  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200, "homepage should render without a database");

  const loginPage = await fetch(`${baseUrl}/login`);
  const loginHtml = await loginPage.text();
  assert.equal(loginPage.status, 200, "login page should render");
  assert.ok(loginHtml.includes(DEMO_EMAIL), "login page should publish the demo email");
  assert.ok(loginHtml.includes(DEMO_PASSWORD), "login page should publish the demo password");

  const registrationPage = await fetch(`${baseUrl}/register`);
  const registrationHtml = await registrationPage.text();
  assert.equal(registrationPage.status, 200, "registration page should explain why signup is unavailable in demo mode");
  assert.ok(registrationHtml.includes("Registration disabled"), "registration page should show the demo-mode notice");

  const unauthenticatedDashboard = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  assert.ok(unauthenticatedDashboard.status >= 300 && unauthenticatedDashboard.status < 400, "dashboard should require login");

  const jar = new Map();
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  updateCookies(jar, csrfResponse);
  const { csrfToken } = await csrfResponse.json();
  assert.ok(csrfToken, "NextAuth should issue a CSRF token");

  const signInResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl: `${baseUrl}/dashboard`,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      json: "true",
    }),
  });
  updateCookies(jar, signInResponse);
  assert.ok(signInResponse.status === 200 || signInResponse.status === 302, `demo login should succeed (received ${signInResponse.status})`);

  const authenticatedHeaders = { cookie: cookieHeader(jar) };
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, { headers: authenticatedHeaders });
  const session = await sessionResponse.json();
  assert.equal(session.user?.isDemo, true, "session should be marked as the isolated demo account");

  const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: authenticatedHeaders });
  const dashboardHtml = await dashboard.text();
  assert.equal(dashboard.status, 200, "demo account should open the dashboard");
  assert.ok(dashboardHtml.includes("Read-only demo"), "dashboard should label the sample data as read-only");
  for (const writeAction of ["Add New Property", "Register Tenant", "Record Payment"]) {
    assert.ok(!dashboardHtml.includes(writeAction), `demo dashboard should hide ${writeAction}`);
  }

  const propertyList = await fetch(`${baseUrl}/dashboard/properties`, { headers: authenticatedHeaders });
  assert.equal(propertyList.status, 200, "demo account should open the property list");

  const propertiesResponse = await fetch(`${baseUrl}/api/properties`, { headers: authenticatedHeaders });
  const properties = await propertiesResponse.json();
  assert.equal(properties.length, 12, "demo should contain twelve fictional properties");
  for (const neighborhood of ["Fidjrossè", "Akpakpa", "Cadjehoun", "Calavi"]) {
    assert.ok(properties.some((property) => property.address.includes(neighborhood)), `demo should include ${neighborhood}`);
  }

  const propertyPage = await fetch(`${baseUrl}/dashboard/properties/demo-property-01`, { headers: authenticatedHeaders });
  const propertyHtml = await propertyPage.text();
  assert.equal(propertyPage.status, 200, "demo property details should open");
  assert.ok(propertyHtml.includes("Villa des Cocotiers"), "property page should render its sample record");

  const [tenantsResponse, paymentsResponse, expensesResponse] = await Promise.all([
    fetch(`${baseUrl}/api/tenants`, { headers: authenticatedHeaders }),
    fetch(`${baseUrl}/api/payments`, { headers: authenticatedHeaders }),
    fetch(`${baseUrl}/api/expenses`, { headers: authenticatedHeaders }),
  ]);
  const [tenants, payments, expenses] = await Promise.all([
    tenantsResponse.json(), paymentsResponse.json(), expensesResponse.json(),
  ]);
  assert.ok(tenants.length >= 10, "demo should include sample tenants");
  assert.ok(payments.some((payment) => payment.status === "OVERDUE"), "demo should show late payments");
  assert.ok(payments.some((payment) => payment.receiptNumber), "demo should include sample receipt references");
  assert.ok(expenses.length > 0, "demo should include sample expenses");

  const writes = [
    ["POST", "/api/properties"], ["PUT", "/api/properties/demo-property-01"], ["DELETE", "/api/properties/demo-property-01"],
    ["POST", "/api/tenants"], ["PUT", "/api/tenants/demo-tenant-01"], ["DELETE", "/api/tenants/demo-tenant-01"],
    ["POST", "/api/payments"], ["PUT", "/api/payments/demo-payment-demo-tenant-01-2026-10"],
    ["POST", "/api/expenses"], ["PUT", "/api/expenses/demo-expense-01"], ["DELETE", "/api/expenses/demo-expense-01"],
    ["PUT", "/api/settings"],
  ];
  for (const [method, path] of writes) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { ...authenticatedHeaders, "content-type": "application/json" },
      body: method === "DELETE" ? undefined : "{}",
    });
    assert.equal(response.status, 403, `${method} ${path} should be blocked in demo mode`);
  }

  const registrationResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test", email: "test@example.com", password: "password123" }),
  });
  assert.equal(registrationResponse.status, 403, "registration should be blocked in isolated demo mode");

  console.log("Demo smoke checks passed: homepage, login, dashboard, property details, sample records, and blocked writes.");
} catch (error) {
  console.error(error);
  console.error(serverOutput);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
