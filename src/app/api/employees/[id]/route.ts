import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const { name, jobTitle, phoneNumber, nationalId, dailySalary, isActive, fingerprint } =
      await req.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        jobTitle,
        phoneNumber,
        nationalId,
        dailySalary,
        isActive,
        fingerprint,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error("Error updating employee:", error);
    
    // Check for unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target[0];
      if (field === "fingerprint") {
        return NextResponse.json(
          { error: "معرف البصمة مستخدم بالفعل لموظف آخر" },
          { status: 400 }
        );
      } else if (field === "nationalId") {
        return NextResponse.json(
          { error: "الرقم القومي مستخدم بالفعل لموظف آخر" },
          { status: 400 }
        );
      } else if (field === "phoneNumber") {
        return NextResponse.json(
          { error: "رقم الهاتف مستخدم بالفعل لموظف آخر" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "حدث خطأ في تحديث الموظف", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    // التحقق من وجود الموظف قبل الحذف
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "الموظف غير موجود" },
        { status: 404 }
      );
    }

    // حذف الموظف
    const deletedEmployee = await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json(deletedEmployee);
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    
    // التحقق من نوع الخطأ
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "لا يمكن حذف الموظف لأنه مرتبط بسجلات أخرى في النظام" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "حدث خطأ في حذف الموظف", details: error.message },
      { status: 500 }
    );
  }
}
