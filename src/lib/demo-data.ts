import { PUBLIC_DEMO_USER } from "@/lib/demo-user";

const DEMO_LANDLORD_ID = PUBLIC_DEMO_USER.id;
const demoPropertiesBase = [
  ["demo-property-01", "Villa des Cocotiers", "Fidjrossè, Cotonou", 4],
  ["demo-property-02", "Résidence du Phare", "Fidjrossè Plage, Cotonou", 6],
  ["demo-property-03", "Maison de la Lagune", "Akpakpa, Cotonou", 3],
  ["demo-property-04", "Les Jardins d'Akpakpa", "Akpakpa-Dodomè, Cotonou", 8],
  ["demo-property-05", "Villa des Palmiers", "Cadjehoun, Cotonou", 5],
  ["demo-property-06", "Résidence de l'Aéroport", "Cadjehoun, Cotonou", 10],
  ["demo-property-07", "Cour des Manguiers", "Calavi Centre, Abomey-Calavi", 4],
  ["demo-property-08", "Les Terrasses de Calavi", "Togbin, Abomey-Calavi", 8],
  ["demo-property-09", "Immeuble Zogbo", "Zogbo, Cotonou", 12],
  ["demo-property-10", "Maison de Gbégamey", "Gbégamey, Cotonou", 3],
  ["demo-property-11", "Résidence Sainte-Rita", "Sainte-Rita, Cotonou", 6],
  ["demo-property-12", "Villa de Godomey", "Godomey, Abomey-Calavi", 5],
] as const;

const tenantNames = [
  "Aïcha Dossou (démo)", "Koffi Adjovi (démo)", "Mariam Hounkpatin (démo)",
  "Sèna Houngbédji (démo)", "Ismaël Kora (démo)", "Diane Ahoyo (démo)",
  "Fabrice Zinsou (démo)", "Nadia Agossou (démo)", "Armand Soglo (démo)",
  "Prisca Gandonou (démo)", "Yannick Dèguè (démo)", "Estelle Hountondji (démo)",
] as const;

const rents = [150_000, 180_000, 125_000, 225_000, 250_000, 300_000, 100_000, 175_000, 200_000, 135_000, 160_000, 120_000] as const;
const unitNumbers = ["A-02", "B-01", "1A", "C-03", "2B", "4A", "01", "B-04", "3C", "A-01", "2A", "01"] as const;

export const demoProperties = demoPropertiesBase.map(([id, name, address, units]) => ({
  id,
  name: `[DÉMO] ${name}`,
  address,
  units,
  landlordId: DEMO_LANDLORD_ID,
  _count: { tenants: 1 },
}));

export const demoTenants = tenantNames.map((fullName, index) => {
  const property = demoProperties[index];
  return {
    id: `demo-tenant-${String(index + 1).padStart(2, "0")}`,
    fullName,
    phone: "+229 00 00 00 00",
    unitNumber: unitNumbers[index],
    rentAmount: rents[index],
    dueDate: [5, 10, 15, 20][index % 4],
    leaseStart: new Date(Date.UTC(2025, index % 12, 1, 12)).toISOString(),
    propertyId: property.id,
    property: { name: property.name },
  };
});

function monthAtOffset(offset: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1, 12))
    .toISOString()
    .slice(0, 7);
}

const previousMonth = monthAtOffset(-1);
const currentMonth = monthAtOffset(0);
const currentDay = new Date().getUTCDate();

export const demoPayments = demoTenants.flatMap((tenant, index) => {
  const previousPayment = {
    id: `demo-payment-${tenant.id}-${previousMonth}`,
    amount: tenant.rentAmount,
    date: `${previousMonth}-05T10:00:00.000Z`,
    status: index === 0 ? "OVERDUE" : "PAID",
    month: previousMonth,
    tenantId: tenant.id,
    receiptNumber: index === 0 ? null : `RF-DEMO-${String(index + 1).padStart(3, "0")}`,
    tenant: {
      fullName: tenant.fullName,
      unitNumber: tenant.unitNumber,
      property: { name: demoProperties[index].name },
    },
  };
  const currentStatus = index % 4 === 0 && currentDay > tenant.dueDate
    ? "OVERDUE"
    : index % 3 === 0 ? "PENDING" : "PAID";
  const currentPayment = {
    id: `demo-payment-${tenant.id}-${currentMonth}`,
    amount: tenant.rentAmount,
    date: `${currentMonth}-${String(Math.min(tenant.dueDate, currentDay)).padStart(2, "0")}T10:00:00.000Z`,
    status: currentStatus,
    month: currentMonth,
    tenantId: tenant.id,
    receiptNumber: currentStatus === "PAID" ? `RF-DEMO-${String(index + 13).padStart(3, "0")}` : null,
    tenant: {
      fullName: tenant.fullName,
      unitNumber: tenant.unitNumber,
      property: { name: demoProperties[index].name },
    },
  };
  return [previousPayment, currentPayment];
});

export const demoExpenses = [
  { id: "demo-expense-01", amount: 35_000, date: `${currentMonth}-03T10:00:00.000Z`, description: "Réparation fictive de plomberie", category: "Maintenance", propertyId: demoProperties[0].id, property: { name: demoProperties[0].name } },
  { id: "demo-expense-02", amount: 18_500, date: `${currentMonth}-08T10:00:00.000Z`, description: "Entretien des parties communes (exemple)", category: "Maintenance", propertyId: demoProperties[3].id, property: { name: demoProperties[3].name } },
  { id: "demo-expense-03", amount: 12_000, date: `${previousMonth}-17T10:00:00.000Z`, description: "Facture d'eau (exemple)", category: "Utilities", propertyId: demoProperties[5].id, property: { name: demoProperties[5].name } },
  { id: "demo-expense-04", amount: 25_000, date: `${previousMonth}-21T10:00:00.000Z`, description: "Petite rénovation (exemple)", category: "Maintenance", propertyId: demoProperties[8].id, property: { name: demoProperties[8].name } },
].map((expense) => ({ ...expense, date: new Date(expense.date).toISOString() }));

export function getDemoProperty(id: string) {
  const property = demoProperties.find((item) => item.id === id);
  if (!property) return null;

  return {
    ...property,
    tenants: demoTenants.filter((tenant) => tenant.propertyId === property.id),
    expenses: demoExpenses.filter((expense) => expense.propertyId === property.id),
  };
}
