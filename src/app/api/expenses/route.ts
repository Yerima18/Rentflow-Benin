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

    const expenses = await prisma.expense.findMany({
      where: {
        property: {
          landlordId: (session.user as { id: string }).id,
        }
      },
      include: {
        property: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
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
    const { amount, date, description, category, propertyId } = body;

    if (!amount || !description || !category || !propertyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify property belongs to landlord
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
        landlordId: (session.user as { id: string }).id,
      }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description,
        category,
        propertyId,
      },
      include: {
        property: { select: { name: true } }
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
