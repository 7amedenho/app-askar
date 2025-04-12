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
