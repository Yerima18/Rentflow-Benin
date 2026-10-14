import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

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
  const homeHtml = await home.text();
  assert.equal(home.status, 200, "homepage should render without a database");
  assert.ok(homeHtml.includes('<html lang="fr">'), "French should be the default landing-page locale");
  for (const frenchCopy of ["RentFlow Bénin | Gestion locative", "Gérez vos biens locatifs, locataires, paiements en FCFA", "Découvrir la démo publique", "Accès bêta", "Enregistrer les loyers en FCFA", "Envoyer les reçus de loyer par WhatsApp", "Conçu pour les propriétaires au Bénin"]) {
    assert.ok(homeHtml.includes(frenchCopy), `French landing page should include ${frenchCopy}`);
  }
  for (const englishCopy of ["RentFlow Benin | Rental management", "Organize rental properties, tenants, FCFA payments", "Explore the public demo", "Beta access", "Record rent payments in FCFA", "Send rent receipts by WhatsApp", "Built for landlords in Benin"]) {
    assert.ok(!homeHtml.includes(englishCopy), `French landing page should not mix in ${englishCopy}`);
  }

  const englishHome = await fetch(`${baseUrl}/`, { headers: { cookie: "NEXT_LOCALE=en" } });
  const englishHomeHtml = await englishHome.text();
  assert.equal(englishHome.status, 200, "English landing page should render");
  assert.ok(englishHomeHtml.includes('<html lang="en">'), "English landing page should honor the selected locale");
  for (const englishCopy of ["RentFlow Benin | Rental management", "Organize rental properties, tenants, FCFA payments", "Explore the public demo", "Beta access", "Record rent payments in FCFA", "Send rent receipts by WhatsApp", "Built for landlords in Benin"]) {
    assert.ok(englishHomeHtml.includes(englishCopy), `English landing page should include ${englishCopy}`);
  }
  for (const frenchCopy of ["RentFlow Bénin | Gestion locative", "Gérez vos biens locatifs, locataires, paiements en FCFA", "Découvrir la démo publique", "Accès bêta", "Enregistrer les loyers en FCFA", "Envoyer les reçus de loyer par WhatsApp", "Conçu pour les propriétaires au Bénin"]) {
    assert.ok(!englishHomeHtml.includes(frenchCopy), `English landing page should not mix in ${frenchCopy}`);
  }

  const loginPage = await fetch(`${baseUrl}/login`);
  const loginHtml = await loginPage.text();
  assert.equal(loginPage.status, 200, "login page should render");
  assert.ok(loginHtml.includes("Continue as guest"), "login page should offer passwordless guest access");
  assert.ok(!loginHtml.includes("Mot de passe / Password:"), "demo login should not display shared password instructions");

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

  const signInResponse = await fetch(`${baseUrl}/api/auth/callback/demo-guest`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl: `${baseUrl}/dashboard`,
      json: "true",
    }),
  });
  updateCookies(jar, signInResponse);
  assert.ok(signInResponse.status === 200 || signInResponse.status === 302, `demo login should succeed (received ${signInResponse.status})`);

  const headersForLocale = (locale) => {
    const localeJar = new Map(jar);
    localeJar.set("NEXT_LOCALE", locale);
    return { cookie: cookieHeader(localeJar) };
  };
  const authenticatedHeaders = headersForLocale("fr");
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, { headers: authenticatedHeaders });
  const session = await sessionResponse.json();
  assert.equal(session.user?.isDemo, true, "session should be marked as the isolated demo account");

  const credentialsJar = new Map();
  const credentialsCsrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  updateCookies(credentialsJar, credentialsCsrfResponse);
  const { csrfToken: credentialsCsrfToken } = await credentialsCsrfResponse.json();
  const credentialsSignInResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(credentialsJar),
    },
    body: new URLSearchParams({
      csrfToken: credentialsCsrfToken,
      callbackUrl: `${baseUrl}/dashboard`,
      json: "true",
      email: "landlord@example.test",
      password: "not-a-real-password",
    }),
  });
  updateCookies(credentialsJar, credentialsSignInResponse);
  const credentialsSessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie: cookieHeader(credentialsJar) },
  });
  const credentialsSession = await credentialsSessionResponse.json();
  assert.ok(!credentialsSession.user, "normal landlord credentials must not create a session in demo mode");

  const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: authenticatedHeaders });
  const dashboardHtml = await dashboard.text();
  assert.equal(dashboard.status, 200, "demo account should open the dashboard");
  assert.ok(dashboardHtml.includes('<html lang="fr">'), "French selection should persist into the authenticated app");
  assert.ok(dashboardHtml.includes("Démo en lecture seule"), "dashboard should show the French read-only notice");
  assert.ok(dashboardHtml.includes("Voici un résumé de vos propriétés"), "dashboard summary should render in French");
  assert.ok(!dashboardHtml.includes("Here is a summary of your properties"), "French dashboard should not mix in English summary text");
  for (const writeAction of ["Add New Property", "Register Tenant", "Record Payment"]) {
    assert.ok(!dashboardHtml.includes(writeAction), `demo dashboard should hide ${writeAction}`);
  }

  const propertyList = await fetch(`${baseUrl}/dashboard/properties`, { headers: authenticatedHeaders });
  const propertyListHtml = await propertyList.text();
  assert.equal(propertyList.status, 200, "demo account should open the property list");
  assert.ok(propertyListHtml.includes("Démo en lecture seule"), "property list should label demo data as read-only in French");
  assert.ok(!propertyListHtml.includes("Add Property"), "demo property list should hide property creation");
  assert.ok(!propertyListHtml.includes(">Delete<"), "demo property list should hide property deletion");

  const dashboardPages = [
    ["tenants", "/dashboard/tenants", ["Add Tenant", ">Delete<"]],
    ["payments", "/dashboard/payments", ["Record Payment", ">Edit<"]],
    ["expenses", "/dashboard/expenses", ["Add Expense", "title=\"delete\""]],
  ];
  for (const [name, path, writeControls] of dashboardPages) {
    const response = await fetch(`${baseUrl}${path}`, { headers: authenticatedHeaders });
    const html = await response.text();
    assert.equal(response.status, 200, `demo account should open the ${name} page`);
    assert.ok(html.includes("Démo en lecture seule"), `${name} page should label demo data as read-only in French`);
    for (const writeControl of writeControls) {
      assert.ok(!html.includes(writeControl), `demo ${name} page should hide ${writeControl}`);
    }
  }

  const createPages = [
    ["property", "/dashboard/properties/new", "Add New Property"],
    ["tenant", "/dashboard/tenants/new", "Register New Tenant"],
    ["expense", "/dashboard/expenses/new", "Add New Expense"],
  ];
  for (const [name, path, formTitle] of createPages) {
    const response = await fetch(`${baseUrl}${path}`, { headers: authenticatedHeaders });
    const html = await response.text();
    assert.equal(response.status, 200, `demo account should open the ${name} read-only notice`);
    assert.ok(html.includes("Démo en lecture seule"), `${name} creation route should explain demo changes are disabled in French`);
    assert.ok(!html.includes(formTitle), `${name} creation form should not render in demo mode`);
  }

  const localeFlowChecks = [
    ["/dashboard", "Voici un résumé de vos propriétés", "Here is a summary of your properties"],
    ["/dashboard/properties", "Gérez vos biens locatifs", "Manage your rental properties"],
    ["/dashboard/tenants", "Gérez vos locataires", "Manage your tenants"],
    ["/dashboard/payments", "Suivez les loyers", "Track rent payments"],
  ];
  const englishHeaders = headersForLocale("en");
  for (const [path, frenchText, englishText] of localeFlowChecks) {
    const frenchResponse = await fetch(`${baseUrl}${path}`, { headers: authenticatedHeaders });
    const frenchHtml = await frenchResponse.text();
    assert.equal(frenchResponse.status, 200, `${path} should render in French`);
    assert.ok(frenchHtml.includes(frenchText), `${path} should contain its French copy`);
    assert.ok(!frenchHtml.includes(englishText), `${path} should not mix English copy into French`);

    const englishResponse = await fetch(`${baseUrl}${path}`, { headers: englishHeaders });
    const englishHtml = await englishResponse.text();
    assert.equal(englishResponse.status, 200, `${path} should render in English`);
    assert.ok(englishHtml.includes('<html lang="en">'), `${path} should retain the English locale cookie`);
    assert.ok(englishHtml.includes(englishText), `${path} should contain its English copy`);
    assert.ok(!englishHtml.includes(frenchText), `${path} should not mix French copy into English`);
  }

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

  console.log("Demo smoke checks passed: guest-only login, read-only dashboard pages and forms, sample records, and blocked writes.");
} catch (error) {
  console.error(error);
  console.error(serverOutput);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
