import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "لم يتم تحميل الملف" },
                { status: 400 }
            );
        }

        // Convert uploaded file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "الملف لا يحتوي على بيانات" },
                { status: 400 }
            );
        }

        const result = {
            processed: 0,
            failed: 0,
            errors: [] as Array<{ userId: string; error: string }>,
        };

        // Process each row in the Excel file
        for (const row of data) {
            try {
                // Expected format: userId/fingerprint, date, checkIn, checkOut
                const userId = (row as any).userId || (row as any).fingerprint;
                const date = (row as any).date;
                const checkIn = (row as any).checkIn;
                const checkOut = (row as any).checkOut;

                if (!userId || !date || !checkIn) {
                    result.failed++;
                    result.errors.push({
                        userId: userId || "unknown",
                        error: "بيانات غير مكتملة",
                    });
                    continue;
                }

                // Find employee by fingerprint
                const employee = await prisma.employee.findFirst({
                    where: {
                        fingerprint: userId.toString(),
                    },
                });

                if (!employee) {
                    result.failed++;
                    result.errors.push({
                        userId: userId.toString(),
                        error: "لم يتم العثور على الموظف",
                    });
                    continue;
                }

                // Parse dates
                let parsedDate: Date;
                let parsedCheckIn: Date;
                let parsedCheckOut: Date | null = null;

                try {
                    // Try to parse the date (could be string or Excel date number)
                    if (typeof date === "number") {
                        // Excel date number
                        parsedDate = XLSX.SSF.parse_date_code(date);
                    } else {
                        // String date
                        parsedDate = new Date(date);
                    }

                    // Parse check-in time
                    if (typeof checkIn === "number") {
                        // Excel time number
                        const timeObj = XLSX.SSF.parse_date_code(checkIn);
                        parsedCheckIn = new Date(
                            parsedDate.getFullYear(),
                            parsedDate.getMonth(),
                            parsedDate.getDate(),
                            timeObj.H || 0,
                            timeObj.M || 0,
                            timeObj.S || 0
                        );
                    } else {
                        // String time
                        const [hours, minutes] = checkIn.toString().split(":");
                        parsedCheckIn = new Date(
                            parsedDate.getFullYear(),
                            parsedDate.getMonth(),
                            parsedDate.getDate(),
                            parseInt(hours) || 0,
                            parseInt(minutes) || 0,
                            0
                        );
                    }

                    // Parse check-out time if available
                    if (checkOut) {
                        if (typeof checkOut === "number") {
                            // Excel time number
                            const timeObj = XLSX.SSF.parse_date_code(checkOut);
                            parsedCheckOut = new Date(
                                parsedDate.getFullYear(),
                                parsedDate.getMonth(),
                                parsedDate.getDate(),
                                timeObj.H || 0,
                                timeObj.M || 0,
                                timeObj.S || 0
                            );
                        } else {
                            // String time
                            const [hours, minutes] = checkOut.toString().split(":");
                            parsedCheckOut = new Date(
                                parsedDate.getFullYear(),
                                parsedDate.getMonth(),
                                parsedDate.getDate(),
                                parseInt(hours) || 0,
                                parseInt(minutes) || 0,
                                0
                            );
                        }
                    }
                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        userId: userId.toString(),
                        error: "خطأ في تحليل التاريخ أو الوقت",
                    });
                    continue;
                }

                // Calculate overtime hours if check-out time is available
                let overtimeHours = 0;
                if (parsedCheckOut) {
                    const minutesWorked =
                        (parsedCheckOut.getTime() - parsedCheckIn.getTime()) / (1000 * 60);
                    const hoursWorked = minutesWorked / 60;
                    overtimeHours = hoursWorked > 8 ? hoursWorked - 8 : 0;
                }

                // Check if attendance record for this employee and date already exists
                const existingAttendance = await prisma.attendance.findFirst({
                    where: {
                        employeeId: employee.id,
                        date: {
                            gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
                            lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
                        },
                    },
                });

                if (existingAttendance) {
                    // Update existing record
                    await prisma.attendance.update({
                        where: { id: existingAttendance.id },
                        data: {
                            checkIn: parsedCheckIn,
                            checkOut: parsedCheckOut,
                            overtimeHours: overtimeHours || null,
                        },
                    });
                } else {
                    // Create new attendance record
                    await prisma.attendance.create({
                        data: {
                            employeeId: employee.id,
                            date: parsedDate,
                            checkIn: parsedCheckIn,
                            checkOut: parsedCheckOut,
                            overtimeHours: overtimeHours || null,
                        },
                    });
                }

                // Update employee budget if checkout time is available
                if (parsedCheckOut && employee.dailySalary > 0) {
                    await updateEmployeeBudget(
                        employee.id,
                        parsedCheckIn,
                        parsedCheckOut,
                        employee.dailySalary
                    );
                }

                result.processed++;
            } catch (error) {
                console.error("Error processing row:", error, row);
                result.failed++;
                result.errors.push({
                    userId: ((row as any).userId || (row as any).fingerprint || "unknown").toString(),
                    error: "خطأ في معالجة البيانات",
                });
            }
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("خطأ في معالجة ملف الحضور:", error);
        return NextResponse.json(
            { error: "حدث خطأ في معالجة ملف الحضور" },
            { status: 500 }
        );
    }
}

async function updateEmployeeBudget(
    employeeId: number,
    checkInTime: Date,
    checkOutTime: Date,
    dailySalary: number
) {
    try {
        const minutesWorked =
            (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
        const hoursWorked = minutesWorked / 60; // الساعات كعدد كسري

        let amountToAdd = 0;
        const hourlyRate = dailySalary / 8;

        if (hoursWorked >= 8) {
            amountToAdd = dailySalary;
            const overtimeHours = hoursWorked - 8;
            if (overtimeHours > 0) {
                const overtimeRate = hourlyRate * 1.5;
                amountToAdd += overtimeHours * overtimeRate;
            }
        } else if (hoursWorked >= 6.5) {
            amountToAdd = dailySalary;
        } else {
            amountToAdd = hoursWorked * hourlyRate;
        }

        const finalAmount = Math.round(amountToAdd);

        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                budget: {
                    increment: finalAmount,
                },
            },
        });

        return true;
    } catch (error) {
        console.error("خطأ في تحديث ميزانية الموظف:", error);
        return false;
    }
} 