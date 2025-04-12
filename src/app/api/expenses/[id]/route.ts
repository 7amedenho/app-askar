import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// الحصول على مصروف محدد
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        
        const expense = await prisma.expense.findUnique({
            where: { id },
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
        });

        if (!expense) {
            return NextResponse.json(
                { message: "المصروف غير موجود" },
                { status: 404 }
            );
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Error fetching expense:", error);
        return NextResponse.json(
            { message: "حدث خطأ أثناء جلب المصروف" },
            { status: 500 }
        );
    }
}

// تعديل مصروف
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const { custodyId, amount, description, expenseType, responsiblePerson, date, projectId } = body;

        // التحقق من وجود المصروف
        const expense = await prisma.expense.findUnique({
            where: { id },
        });

        if (!expense) {
            return NextResponse.json(
                { message: "المصروف غير موجود" },
                { status: 404 }
            );
        }

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

        // حساب الفرق بين المبلغ القديم والجديد
        const amountDifference = Number(amount) - Number(expense.amount);

        // التحقق من أن المبلغ الجديد لا يتجاوز المتبقي في العهدة
        if (amountDifference > custody.remaining) {
            return NextResponse.json(
                { message: "المبلغ المطلوب يتجاوز المتبقي في العهدة" },
                { status: 400 }
            );
        }

        // تعديل المصروف وتحديث المتبقي في العهدة في معاملة واحدة
        const result = await prisma.$transaction(async (prisma: { expense: { update: (arg0: { where: { id: number; }; data: { description: any; amount: any; expenseType: any; responsiblePerson: any; date: Date; custodyId: any; projectId: any; }; }) => any; }; custody: { update: (arg0: { where: { id: any; }; data: { remaining: { decrement: number; }; }; }) => any; }; }) => {
            // تعديل المصروف
            const updatedExpense = await prisma.expense.update({
                where: { id },
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

            // تحديث المتبقي في العهدة فقط إذا كان هناك فرق في المبلغ
            if (amountDifference !== 0) {
                await prisma.custody.update({
                    where: { id: custodyId },
                    data: {
                        remaining: {
                            decrement: amountDifference,
                        },
                    },
                });
            }

            return updatedExpense;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating expense:", error);
        return NextResponse.json(
            { message: "حدث خطأ أثناء تعديل المصروف" },
            { status: 500 }
        );
    }
}

// حذف مصروف
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        // التحقق من وجود المصروف
        const expense = await prisma.expense.findUnique({
            where: { id },
        });

        if (!expense) {
            return NextResponse.json(
                { message: "المصروف غير موجود" },
                { status: 404 }
            );
        }

        // حذف المصروف وإعادة المبلغ إلى العهدة في معاملة واحدة
        const result = await prisma.$transaction(async (prisma: { expense: { delete: (arg0: { where: { id: number; }; }) => any; }; custody: { update: (arg0: { where: { id: any; }; data: { remaining: { increment: number; }; }; }) => any; }; }) => {
            // حذف المصروف
            const deletedExpense = await prisma.expense.delete({
                where: { id },
            });

            // إعادة المبلغ إلى العهدة
            await prisma.custody.update({
                where: { id: expense.custodyId },
                data: {
                    remaining: {
                        increment: Number(expense.amount),
                    },
                },
            });

            return deletedExpense;
        });

        return NextResponse.json({ message: "تم حذف المصروف بنجاح" });
    } catch (error) {
        console.error("Error deleting expense:", error);
        return NextResponse.json(
            { message: "حدث خطأ أثناء حذف المصروف" },
            { status: 500 }
        );
    }
}