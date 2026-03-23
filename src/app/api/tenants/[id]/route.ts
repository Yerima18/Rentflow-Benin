import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, unitNumber, rentAmount, dueDate, leaseStart } = body;

    if (!fullName || !phone || !unitNumber || !rentAmount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedRentAmount = parseFloat(rentAmount);
    const parsedDueDate = parseInt(dueDate);

    if (isNaN(parsedRentAmount) || parsedRentAmount <= 0) {
      return NextResponse.json({ error: 'Rent amount must be a positive number' }, { status: 400 });
    }
    if (isNaN(parsedDueDate) || parsedDueDate < 1 || parsedDueDate > 31) {
      return NextResponse.json({ error: 'Due date must be between 1 and 31' }, { status: 400 });
    }

    const existing = await prisma.tenant.findFirst({
      where: {
        id,
        property: { landlordId: (session.user as { id: string }).id },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        fullName,
        phone,
        unitNumber,
        rentAmount: parsedRentAmount,
        dueDate: parsedDueDate,
        leaseStart: leaseStart ? new Date(leaseStart) : null,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        property: { landlordId: (session.user as { id: string }).id },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    await prisma.tenant.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
