import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const whereClause: { property: { landlordId: string }, propertyId?: string } = {
      property: {
        landlordId: (session.user as { id: string }).id,
      }
    };

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      include: {
        property: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, unitNumber, rentAmount, dueDate, propertyId, leaseStart } = body;

    if (!fullName || !phone || !unitNumber || !rentAmount || !dueDate || !propertyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify property belongs to landlord
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        landlordId: (session.user as { id: string }).id,
      }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    const parsedRentAmount = parseFloat(rentAmount);
    const parsedDueDate = parseInt(dueDate);

    if (isNaN(parsedRentAmount) || parsedRentAmount <= 0) {
      return NextResponse.json({ error: 'Rent amount must be a positive number' }, { status: 400 });
    }
    if (isNaN(parsedDueDate) || parsedDueDate < 1 || parsedDueDate > 31) {
      return NextResponse.json({ error: 'Due date must be between 1 and 31' }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        fullName,
        phone,
        unitNumber,
        rentAmount: parsedRentAmount,
        dueDate: parsedDueDate,
        propertyId,
        leaseStart: leaseStart ? new Date(leaseStart) : null,
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
