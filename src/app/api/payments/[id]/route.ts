import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { demoReadOnlyResponse, isDemoSession } from '@/lib/demo';
import { isPaymentMonth, isPaymentStatus, parseXofAmount } from '@/lib/money';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isDemoSession(session)) return demoReadOnlyResponse();

    const { id } = await params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenant: { property: { landlordId: (session.user as { id: string }).id } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { status, amount, month } = body;
    const updateData: { amount?: number; status?: string; month?: string } = {};

    if (amount !== undefined) {
      const parsedAmount = parseXofAmount(amount);
      if (parsedAmount === null) {
        return NextResponse.json({ error: 'Amount must be a positive whole XOF amount' }, { status: 400 });
      }
      updateData.amount = parsedAmount;
    }
    if (status !== undefined) {
      if (!isPaymentStatus(status)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (month !== undefined) {
      if (!isPaymentMonth(month)) {
        return NextResponse.json({ error: 'Month must use YYYY-MM with a valid month' }, { status: 400 });
      }
      updateData.month = month;
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'At least one valid payment field is required' }, { status: 400 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
