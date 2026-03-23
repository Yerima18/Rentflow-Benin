import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12)
  const landlord = await prisma.landlord.upsert({
    where: { email: 'admin@rentflow.com' },
    update: {},
    create: {
      email: 'admin@rentflow.com',
      name: 'Moussa Diakité',
      password: hashedPassword,
    },
  })

  const prop1 = await prisma.property.create({
    data: {
      name: 'Résidence Les Cocotiers',
      address: 'Quartier Haie Vive, Cotonou',
      units: 10,
      landlordId: landlord.id,
    }
  })

  const prop2 = await prisma.property.create({
    data: {
      name: 'Villa Palmeraie',
      address: 'Fidjrossè, Cotonou',
      units: 4,
      landlordId: landlord.id,
    }
  })

  const tenant1 = await prisma.tenant.create({
    data: {
      fullName: 'Koffi Aballo',
      phone: '+229 97 00 11 22',
      unitNumber: 'A1',
      rentAmount: 150000,
      dueDate: 5,
      propertyId: prop1.id,
    }
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      fullName: 'Amina Salami',
      phone: '+229 95 33 44 55',
      unitNumber: 'A2',
      rentAmount: 150000,
      dueDate: 5,
      propertyId: prop1.id,
    }
  })

  const tenant3 = await prisma.tenant.create({
    data: {
      fullName: 'Jean-Paul Dossa',
      phone: '+229 96 55 66 77',
      unitNumber: 'Villa 1',
      rentAmount: 250000,
      dueDate: 1,
      propertyId: prop2.id,
    }
  })

  await prisma.payment.createMany({
    data: [
      { amount: 150000, status: 'PAID', month: '2023-10', tenantId: tenant1.id },
      { amount: 150000, status: 'PENDING', month: '2023-11', tenantId: tenant1.id },
      { amount: 150000, status: 'PAID', month: '2023-10', tenantId: tenant2.id },
      { amount: 250000, status: 'PAID', month: '2023-10', tenantId: tenant3.id },
    ]
  })

  console.log('Database seeded with realistic data for admin@rentflow.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
