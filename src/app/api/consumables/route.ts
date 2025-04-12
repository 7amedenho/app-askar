import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const consumables = await prisma.consumableItem.findMany({
      include: {
        supplier: true,
        usages: {
          include: {
            project: true,
          },
          orderBy: {
            usedAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(consumables);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "فشل في جلب المستهلكات" },
      { status: 500 }
    );
  }
}
