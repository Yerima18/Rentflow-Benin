import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.landlord.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const landlord = await prisma.landlord.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json({ id: landlord.id, email: landlord.email, name: landlord.name }, { status: 201 });
  } catch (error) {
    console.error('Error registering landlord:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
