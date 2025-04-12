import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
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

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: "حدث خطاء في جلب المشاريع" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, managerName, startDate, custodyId } = await req.json();

    const newProject = await prisma.project.create({
      data: {
        name,
        managerName,
        startDate: new Date(startDate),
        custodies: {
          connect: {
            id: Number(custodyId),
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: newProject });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "حدث خطاء في انشاء المشروع" },
      { status: 500 }
    );
  }
}
