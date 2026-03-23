import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await prisma.property.findMany({
      where: {
        landlordId: (session.user as { id: string }).id,
      },
      include: {
        _count: {
          select: { tenants: true }
        }
      }
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
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
    const { name, address, units } = body;

    if (!name || !address || !units) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedUnits = parseInt(units);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      return NextResponse.json({ error: 'Units must be a positive number' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        units: parsedUnits,
        landlordId: (session.user as { id: string }).id,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
