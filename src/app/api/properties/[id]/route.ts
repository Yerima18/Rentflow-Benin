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
    const { name, address, units } = body;

    if (!name || !address || !units) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedUnits = parseInt(units);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      return NextResponse.json({ error: 'Units must be a positive number' }, { status: 400 });
    }

    const existing = await prisma.property.findFirst({
      where: { id, landlordId: (session.user as { id: string }).id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    const property = await prisma.property.update({
      where: { id },
      data: { name, address, units: parsedUnits },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
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

    const property = await prisma.property.findFirst({
      where: { id, landlordId: (session.user as { id: string }).id },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
