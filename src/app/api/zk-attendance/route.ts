import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    const data = await req.json();

    try {
        for (const record of data) {
            const { fingerprint, checkIn, checkOut, date } = record;

            const employee = await prisma.employee.findUnique({
                where: { fingerprint },
            });

            if (!employee) continue;

            await prisma.attendance.upsert({
                where: {
                    employeeId_date: {
                        employeeId: employee.id,
                        date: new Date(date),
                    },
                },
                update: {
                    checkIn: new Date(checkIn),
                    checkOut: checkOut ? new Date(checkOut) : null,
                },
                create: {
                    employeeId: employee.id,
                    date: new Date(date),
                    checkIn: new Date(checkIn),
                    checkOut: checkOut ? new Date(checkOut) : null,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('خطأ أثناء تخزين الحضور:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
