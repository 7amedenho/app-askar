import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على جميع عقود الشركات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const contracts = await prisma.companyContract.findMany({
      where: {
        name: {
          contains: search,
        },
      },
      include: {
        transactions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching company contracts:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب عقود الشركات" },
      { status: 500 }
    );
  }
}

// إنشاء عقد شركة جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, address, email } = body;

    // التحقق من البيانات المطلوبة
    if (!name) {
      return NextResponse.json(
        { message: "اسم الشركة مطلوب" },
        { status: 400 }
      );
    }

    // إنشاء عقد شركة جديد
    const newContract = await prisma.companyContract.create({
      data: {
        name,
        phoneNumber,
        address,
        email,
      },
    });

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    console.error("Error creating company contract:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء عقد الشركة" },
      { status: 500 }
    );
  }
}