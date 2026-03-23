import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, date, description, category } = body;

    if (!amount || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { property: { select: { landlordId: true } } },
    });

    if (!existing || existing.property.landlordId !== (session.user as { id: string }).id) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        amount: parsedAmount,
        description,
        category,
        date: date ? new Date(date) : undefined,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify property belongs to landlord
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { property: true }
    });

    if (!expense || expense.property.landlordId !== (session.user as {id: string}).id) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
