import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const custodies = await prisma.custody.findMany({
    include: {
      project: true,
      expenses: true,
      AddAmount: true,
    },
  });

  return NextResponse.json(custodies);
}

export async function POST(req: NextRequest) {
  const { name, code, company, budget, date, projectId } = await req.json();

  const newCustody = await prisma.custody.create({
    data: {
      name,
      code,
      company,
      budget,
      remaining: budget,
      status: "active",
      time: new Date(date),
      project: projectId ? { connect: { id: projectId } } : undefined, // ربط العهدة بمشروع إذا كان projectId متاحًا
    },
  });

  return NextResponse.json(newCustody);
}
