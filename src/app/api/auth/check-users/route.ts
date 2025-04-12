import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// التحقق من وجود مستخدمين في النظام
export async function GET() {
  try {
    // عد المستخدمين في النظام
    const count = await prisma.user.count();
    
    return NextResponse.json({ 
      hasUsers: count > 0,
      count 
    });
  } catch (error) {
    console.error("Error checking users:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحقق من وجود مستخدمين" },
      { status: 500 }
    );
  }
} 