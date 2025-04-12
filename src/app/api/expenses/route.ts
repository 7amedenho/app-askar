import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على جميع المصروفات
export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            include: {
                custody: {
                    select: {
                        name: true,
                        remaining: true,
                        budget: true,
                    },
                },
                project: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { message: "حدث خطأ أثناء جلب المصروفات" },
            { status: 500 }
        );
    }
}

// إضافة مصروف جديد
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { custodyId, amount, description, expenseType, responsiblePerson, date, projectId } = body;

        // التحقق من وجود العهدة
        const custody = await prisma.custody.findUnique({
            where: { id: custodyId },
        });

        if (!custody) {
            return NextResponse.json(
                { message: "العهدة غير موجودة" },
                { status: 404 }
            );
        }

        // التحقق من أن المبلغ لا يتجاوز المتبقي في العهدة
        if (Number(amount) > custody.remaining) {
            return NextResponse.json(
                { message: "المبلغ المطلوب يتجاوز المتبقي في العهدة" },
                { status: 400 }
            );
        }

        // إنشاء المصروف وتحديث المتبقي في العهدة في معاملة واحدة
        const result = await prisma.$transaction(async (prisma: { expense: { create: (arg0: { data: { description: any; amount: any; expenseType: any; responsiblePerson: any; date: Date; custodyId: any; projectId: any; }; }) => any; }; custody: { update: (arg0: { where: { id: any; }; data: { remaining: { decrement: number; }; }; }) => any; }; }) => {
            // إنشاء المصروف
            const expense = await prisma.expense.create({
                data: {
                    description,
                    amount,
                    expenseType,
                    responsiblePerson,
                    date: new Date(date),
                    custodyId,
                    projectId: projectId || undefined,
                },
            });

            // تحديث المتبقي في العهدة
            await prisma.custody.update({
                where: { id: custodyId },
                data: {
                    remaining: {
                        decrement: Number(amount),
                    },
                },
            });

            return expense;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { message: "حدث خطأ أثناء إنشاء المصروف" },
            { status: 500 }
        );
    }
}