import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consumableId = searchParams.get("consumableId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!consumableId) {
      return NextResponse.json(
        { error: "consumableId is required" },
        { status: 400 }
      );
    }

    const where: any = {
      consumableId: parseInt(consumableId),
    };

    if (startDate && endDate) {
      where.usedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const usageData = await prisma.consumableUsage.findMany({
      where,
      include: {
        consumable: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        usedAt: "desc",
      },
    });

    return NextResponse.json(usageData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { consumableId, quantityUsed, projectId, notes } = data;

    const usage = await prisma.$transaction(async (tx) => {
      // 1. جلب العهدة والتأكد من وجودها
      const consumable = await tx.consumableItem.findUnique({
        where: { id: consumableId },
      });

      if (!consumable) {
        throw new Error("Consumable item not found");
      }

      // 2. التأكد من الكمية المتاحة
      if (consumable.stock < quantityUsed) {
        throw new Error("Insufficient stock");
      }

      // 3. تسجيل الاستخدام
      const newUsage = await tx.consumableUsage.create({
        data: {
          consumableId,
          projectId,
          quantityUsed,
          notes,
        },
      });

      // 4. تحديث الستوك
      await tx.consumableItem.update({
        where: { id: consumableId },
        data: {
          stock: {
            decrement: quantityUsed,
          },
        },
      });

      return newUsage;
    });

    return NextResponse.json(usage);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to record usage" },
      { status: 500 }
    );
  }
}
