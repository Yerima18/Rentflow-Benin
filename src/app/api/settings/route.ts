import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const landlord = await prisma.landlord.findUnique({
      where: { id: (session.user as { id: string }).id },
    });

    if (!landlord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: { name: string; email: string; password?: string } = { name, email };

    if (newPassword && currentPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, landlord.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.landlord.update({
      where: { id: landlord.id },
      data: updates,
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
