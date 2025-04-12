import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a specific user
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        permissions: {
          select: {
            menuItem: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المستخدم" },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const { name, email, password, role, permissions, isActive } = await req.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await prisma.permission.deleteMany({
        where: { userId },
      });

      // Create new permissions
      await prisma.permission.createMany({
        data: permissions.map((menuItem: string) => ({
          userId,
          menuItem,
        })),
      });
    }

    return NextResponse.json({
      message: "تم تحديث المستخدم بنجاح",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المستخدم" },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Delete user (permissions will be cascade deleted due to the relation in schema)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المستخدم" },
      { status: 500 }
    );
  }
} 