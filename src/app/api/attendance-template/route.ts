// app/api/attendance-template/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date =
    searchParams.get("date") || new Date().toISOString().slice(0, 10);

  // هات الموظفين
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { name: true, fingerprint: true },
  });

  // جهز الداتا
  const rows = employees.map((emp) => ({
    fingerprint: emp.fingerprint || "",
    name: emp.name,
    date,
    checkIn: null, // هنخليه null عشان Excel يفهم إنه وقت مش نص
    checkOut: null, // برضه null
  }));

  // حولها لـ Sheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // صيغة الأعمدة
  const range = XLSX.utils.decode_range(worksheet["!ref"] as string);

  // العمود D = checkIn (صفر-based index: A=0, B=1, C=2, D=3)
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cellRefIn = XLSX.utils.encode_cell({ r: R, c: 3 });
    const cellRefOut = XLSX.utils.encode_cell({ r: R, c: 4 });

    worksheet[cellRefIn] = { t: "n", z: "HH:mm:ss", v: null };
    worksheet[cellRefOut] = { t: "n", z: "HH:mm:ss", v: null };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=attendance_template.xlsx",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
