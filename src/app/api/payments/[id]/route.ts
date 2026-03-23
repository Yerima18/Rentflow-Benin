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
    const { status, amount } = body;

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
