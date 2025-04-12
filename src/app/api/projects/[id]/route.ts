import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(params.id) },
      include: {
        custodies: {
          include: {
            expenses: true,
            AddAmount: true,
          },
        },
        expenses: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب المشروع" }, { status: 500 });
  }
}
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, managerName, startDate, custodyId, status } = body;

    // التحقق من أن المشروع موجود قبل التحديث
    const existingProject = await prisma.project.findUnique({
      where: { id: Number(params.id) },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(params.id) },
      data: {
        name,
        managerName,
        startDate: new Date(startDate), // تحويل إلى Date إذا لزم الأمر
        status,
        ...(custodyId && {
          custodies: {
            connect: [{ id: Number(custodyId) }],
          },
        }),
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("خطأ في التحديث:", error);
    return NextResponse.json({ error: "فشل تحديث المشروع" }, { status: 500 });
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = Number(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "معرف المشروع غير صالح" },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "تم حذف المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف المشروع:", error);
    return NextResponse.json({ error: "فشل حذف المشروع" }, { status: 500 });
  }
}
