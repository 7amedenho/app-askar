import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// إنشاء أول مستخدم مدير في النظام
export async function POST(req: Request) {
  try {
    // التحقق من وجود مستخدمين سابقين
    const usersCount = await prisma.user.count();
    
    // إذا كان هناك مستخدمين، ارفض العملية لأسباب أمنية
    if (usersCount > 0) {
      return NextResponse.json(
        { error: "لا يمكن إجراء إعداد النظام، يوجد مستخدمين بالفعل" },
        { status: 400 }
      );
    }

    const { name, email, password } = await req.json();

    // التحقق من البيانات
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // جمع كل عناصر القائمة للصلاحيات
    const allMenuItems = [];
    const { items } = await import("@/components/menu-items");
    
    items.forEach(group => {
      group.items.forEach(item => {
        allMenuItems.push(item.title);
      });
    });

    // إنشاء المستخدم المدير الأول مع كامل الصلاحيات
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // كلمة المرور بدون تشفير كما طُلب
        role: "admin",
        isActive: true,
        permissions: {
          create: allMenuItems.map(menuItem => ({
            menuItem,
          })),
        },
      },
    });

    // إرجاع نتيجة الإنشاء بدون بيانات حساسة
    return NextResponse.json({
      message: "تم إعداد النظام بنجاح وإنشاء حساب المدير",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعداد النظام" },
      { status: 500 }
    );
  }
} 