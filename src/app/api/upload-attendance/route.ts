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

        // Parse Excel file with cellDates option to better handle dates
        const workbook = XLSX.read(buffer, { 
            type: "buffer",
            cellDates: true,
            cellNF: true,
            dateNF: 'yyyy-mm-dd'
        });
        
        // Check if workbook uses 1904 date system
        const isDate1904 = !!(workbook.Workbook && workbook.Workbook.WBProps && workbook.Workbook.WBProps.date1904);
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        // Use raw: false to get formatted strings instead of raw values
        const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

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
                    // Improved date parsing that's more robust with different formats
                    parsedDate = parseExcelDate(date, isDate1904);
                    
                    // Parse check-in time and combine with the date
                    const checkInTime = parseExcelTime(checkIn);
                    parsedCheckIn = new Date(
                        parsedDate.getFullYear(),
                        parsedDate.getMonth(),
                        parsedDate.getDate(),
                        checkInTime.hours,
                        checkInTime.minutes,
                        checkInTime.seconds
                    );

                    // Parse check-out time if available
                    if (checkOut) {
                        const checkOutTime = parseExcelTime(checkOut);
                        parsedCheckOut = new Date(
                            parsedDate.getFullYear(),
                            parsedDate.getMonth(),
                            parsedDate.getDate(),
                            checkOutTime.hours,
                            checkOutTime.minutes,
                            checkOutTime.seconds
                        );
                        
                        // Handle case where checkout is on the next day
                        if (parsedCheckOut < parsedCheckIn) {
                            parsedCheckOut.setDate(parsedCheckOut.getDate() + 1);
                        }
                    }
                } catch (error) {
                    console.error("Date parsing error:", error, { date, checkIn, checkOut });
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

                // Create date for database query (clone the date to avoid modifying parsedDate)
                const queryDate = new Date(parsedDate.getTime());

                // Check if attendance record for this employee and date already exists
                const existingAttendance = await prisma.attendance.findFirst({
                    where: {
                        employeeId: employee.id,
                        date: {
                            gte: new Date(queryDate.setHours(0, 0, 0, 0)),
                            lt: new Date(queryDate.setHours(23, 59, 59, 999)),
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

/**
 * Parse an Excel date value into a JavaScript Date object
 */
function parseExcelDate(dateValue: any, isDate1904: boolean = false): Date {
    // If already a Date object, return it
    if (dateValue instanceof Date) return dateValue;
    
    // If it's a number, it's an Excel date code
    if (typeof dateValue === "number") {
        // Use XLSX.SSF.parse_date_code to get date parts
        const dateObj = XLSX.SSF.parse_date_code(dateValue, { date1904: isDate1904 });
        return new Date(dateObj.y, dateObj.m - 1, dateObj.d);
    }
    
    // Try to parse ISO date format (YYYY-MM-DD)
    if (typeof dateValue === "string") {
        // Check if it matches YYYY-MM-DD format
        const isoMatch = dateValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            return new Date(
                parseInt(isoMatch[1]), 
                parseInt(isoMatch[2]) - 1, 
                parseInt(isoMatch[3])
            );
        }
        
        // Check if it matches DD/MM/YYYY format
        const ddmmMatch = dateValue.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (ddmmMatch) {
            return new Date(
                parseInt(ddmmMatch[3]),
                parseInt(ddmmMatch[2]) - 1,
                parseInt(ddmmMatch[1])
            );
        }
    }
    
    // Fallback: let JavaScript try to parse the date
    const date = new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateValue}`);
    }
    
    return date;
}

/**
 * Parse an Excel time value into hours, minutes, and seconds
 */
function parseExcelTime(timeValue: any): { hours: number; minutes: number; seconds: number } {
    // Default values
    let hours = 0, minutes = 0, seconds = 0;
    
    if (typeof timeValue === "number") {
        // Excel time is stored as a fraction of 24 hours
        const totalSeconds = timeValue * 24 * 60 * 60;
        hours = Math.floor(totalSeconds / 3600);
        minutes = Math.floor((totalSeconds % 3600) / 60);
        seconds = Math.floor(totalSeconds % 60);
    } else if (typeof timeValue === "string") {
        // Try to parse hh:mm(:ss) format
        const timeParts = timeValue.split(':').map(Number);
        
        if (timeParts.length >= 2) {
            hours = timeParts[0] || 0;
            minutes = timeParts[1] || 0;
            seconds = timeParts[2] || 0;
        }
    } else if (timeValue instanceof Date) {
        // If it's already a Date object, extract time components
        hours = timeValue.getHours();
        minutes = timeValue.getMinutes();
        seconds = timeValue.getSeconds();
    }
    
    // Ensure values are within valid ranges
    hours = Math.min(23, Math.max(0, hours));
    minutes = Math.min(59, Math.max(0, minutes));
    seconds = Math.min(59, Math.max(0, seconds));
    
    return { hours, minutes, seconds };
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