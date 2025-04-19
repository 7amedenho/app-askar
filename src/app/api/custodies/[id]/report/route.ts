import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "يجب تحديد تاريخ البداية والنهاية" },
        { status: 400 }
      );
    }

    const custodyId = parseInt(params.id);

    // Fetch custody details
    const custody = await prisma.custody.findUnique({
      where: { id: custodyId },
      include: {
        AddAmount: {
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        expenses: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!custody) {
      return NextResponse.json(
        { error: "العهدة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      custody: {
        id: custody.id,
        name: custody.name,
        code: custody.code,
        company: custody.company,
        budget: custody.budget,
        remaining: custody.remaining,
        status: custody.status,
      },
      additions: custody.AddAmount.map((add) => ({
        id: add.id,
        amount: add.amount,
        createdAt: add.createdAt,
      })),
      expenses: custody.expenses.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        expenseType: exp.expenseType,
        responsiblePerson: exp.responsiblePerson,
        date: exp.date,
        project: exp.project,
      })),
    });
  } catch (error) {
    console.error("Error fetching custody report:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات التقرير" },
      { status: 500 }
    );
  }
} 