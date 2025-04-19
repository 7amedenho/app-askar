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

    const projectId = parseInt(params.id);

    // Fetch project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        expenses: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            custody: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        custodies: {
          include: {
            AddAmount: {
              where: {
                createdAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
            },
            expenses: {
              where: {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
            },
          },
        },
        ConsumableUsage: {
          where: {
            usedAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            consumable: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    // Format custody transactions
    const custodyTransactions = project.custodies.flatMap((custody) => [
      ...custody.AddAmount.map((add) => ({
        id: add.id,
        amount: add.amount,
        type: "addition" as const,
        date: add.createdAt,
        custody: {
          id: custody.id,
          name: custody.name,
        },
      })),
      ...custody.expenses.map((exp) => ({
        id: exp.id,
        amount: exp.amount,
        type: "expense" as const,
        date: exp.date,
        custody: {
          id: custody.id,
          name: custody.name,
        },
      })),
    ]);

    // Format consumable usages
    const consumableUsages = project.ConsumableUsage.map((usage) => ({
      id: usage.id,
      quantityUsed: usage.quantityUsed,
      usedAt: usage.usedAt,
      consumable: {
        id: usage.consumable.id,
        name: usage.consumable.name,
        unit: usage.consumable.unit,
      },
    }));

    return NextResponse.json({
      expenses: project.expenses,
      custodyTransactions,
      consumableUsages,
    });
  } catch (error) {
    console.error("Error fetching project report:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات التقرير" },
      { status: 500 }
    );
  }
} 