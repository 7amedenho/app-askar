import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        permissions: true,
      },
    });

    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المستخدمين" },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(req: Request) {
  try {
    const { name, email, password, role, permissions } = await req.json();

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    // Create user with permissions
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Plain text as requested (no bcrypt)
        role,
        permissions: {
          create: permissions.map((menuItem: string) => ({
            menuItem,
          })),
        },
      },
    });

    // Return created user without password
    const { password: _, ...userData } = user;

    return NextResponse.json(
      { message: "تم إنشاء المستخدم بنجاح", user: userData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المستخدم" },
      { status: 500 }
    );
  }
} 