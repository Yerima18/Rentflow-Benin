import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isPaymentMonth, isPaymentStatus, parseXofAmount } from '@/lib/money';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        tenant: {
          property: {
            landlordId: (session.user as { id: string }).id,
          }
        }
      },
      include: {
        tenant: {
          select: {
            fullName: true,
            unitNumber: true,
            property: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
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
    const { amount, status, month, tenantId } = body;

    if (!tenantId || !status || !month || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = parseXofAmount(amount);
    if (parsedAmount === null) {
      return NextResponse.json({ error: 'Amount must be a positive whole XOF amount' }, { status: 400 });
    }
    if (!isPaymentStatus(status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }
    if (!isPaymentMonth(month)) {
      return NextResponse.json({ error: 'Month must use YYYY-MM with a valid month' }, { status: 400 });
    }

    // Verify tenant belongs to landlord's property
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        property: {
          landlordId: (session.user as { id: string }).id,
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parsedAmount,
        status,
        month,
        tenantId,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
