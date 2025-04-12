import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const { name, jobTitle, phoneNumber, nationalId, dailySalary } =
      await req.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        jobTitle,
        phoneNumber,
        nationalId,
        dailySalary,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    return NextResponse.json(
      { error: "حدث خطاء في تحديث الموظف", details: error.message },
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
    const deletedEmployee = await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json(deletedEmployee);
  } catch (error: any) {
    return NextResponse.json(
      { error: "حدث خطاء في حذف الموظف", details: error.message },
      { status: 500 }
    );
  }
}
