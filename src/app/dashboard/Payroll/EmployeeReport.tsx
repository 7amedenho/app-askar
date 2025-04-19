//Payroll/EmployeeReport.tsx:
"use client";
import { useState } from "react";
import { Table, Button, DatePicker, Spin, Card, Divider } from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Printer } from "lucide-react";
import dayjs from "dayjs";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { RangePicker } = DatePicker;

interface EmployeeReportProps {
  employee: any;
}

export default function EmployeeReport({ employee }: EmployeeReportProps) {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [startDate, endDate] = dateRange;

  // جلب بيانات الحضور
  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", employee.id, startDate, endDate],
    queryFn: async () => {
      const adjustedEndDate = endDate.add(1, "day"); // إضافة يوم واحد
      const res = await axios.get(
        `/api/attendance?startDate=${startDate
          .startOf("day")
          .format("YYYY-MM-DD")}&endDate=${adjustedEndDate
            .startOf("day")
            .format("YYYY-MM-DD")}`
      );
      return res.data.filter(
        (record: any) => record.employeeId === employee.id
      );
    },
  });

  // جلب بيانات الخصومات
  const { data: deductions = [], isLoading: deductionsLoading } = useQuery({
    queryKey: ["deductions", employee.id, startDate, endDate],
    queryFn: async () => {
      const adjustedEndDate = endDate.add(1, "day");
      const res = await axios.get(
        `/api/deductions?startDate=${startDate
          .startOf("day")
          .format("YYYY-MM-DD")}&endDate=${adjustedEndDate
            .startOf("day")
            .format("YYYY-MM-DD")}`
      );
      return res.data.filter(
        (record: any) => record.employeeId === employee.id
      );
    },
  });

  // جلب بيانات المكافآت
  const { data: bonuses = [], isLoading: bonusesLoading } = useQuery({
    queryKey: ["bonuses", employee.id, startDate, endDate],
    queryFn: async () => {
      const adjustedEndDate = endDate.add(1, "day");
      const res = await axios.get(
        `/api/bonuses?startDate=${startDate
          .startOf("day")
          .format("YYYY-MM-DD")}&endDate=${adjustedEndDate
            .startOf("day")
            .format("YYYY-MM-DD")}`
      );
      return res.data.filter(
        (record: any) => record.employeeId === employee.id
      );
    },
  });

  // جلب بيانات السلف
  const { data: advances = [], isLoading: advancesLoading } = useQuery({
    queryKey: ["advances", employee.id, startDate, endDate],
    queryFn: async () => {
      const adjustedEndDate = endDate.add(1, "day");
      const res = await axios.get(
        `/api/advances?startDate=${startDate
          .startOf("day")
          .format("YYYY-MM-DD")}&endDate=${adjustedEndDate
            .startOf("day")
            .format("YYYY-MM-DD")}`
      );
      return res.data.filter(
        (record: any) => record.employeeId === employee.id
      );
    },
  });

  // حساب إجمالي أيام العمل
  const totalWorkDays = attendance.length;

  // حساب إجمالي الراتب الأساسي
  const totalBaseSalary = totalWorkDays * employee.dailySalary;

  // حساب إجمالي الخصومات
  const totalDeductions = deductions.reduce(
    (sum: number, deduction: any) => sum + Number(deduction.amount),
    0
  );

  // حساب إجمالي المكافآت
  const totalBonuses = bonuses.reduce(
    (sum: number, bonus: any) => sum + Number(bonus.amount),
    0
  );

  // حساب إجمالي السلف
  const totalAdvances = advances.reduce(
    (sum: number, advance: any) => sum + Number(advance.amount),
    0
  );

  // حساب صافي الراتب
  const netSalary =
    totalBaseSalary + totalBonuses - totalDeductions - totalAdvances;

  // أعمدة جدول الحضور
  const attendanceColumns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "وقت الحضور",
      dataIndex: "checkIn",
      key: "checkIn",
      render: (text: string) => new Date(text).toLocaleTimeString("ar-EG"),
    },
    {
      title: "وقت الانصراف",
      dataIndex: "checkOut",
      key: "checkOut",
      render: (text: string) =>
        text ? new Date(text).toLocaleTimeString("ar-EG") : "-",
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      render: (text: string) => text || "-",
    },
  ];

  // أعمدة جدول الخصومات
  const deductionColumns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
  ];

  // أعمدة جدول المكافآت
  const bonusColumns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "السبب",
      dataIndex: "reason",
      key: "reason",
    },
  ];

  // أعمدة جدول السلف
  const advanceColumns = [
    {
      title: "التاريخ",
      dataIndex: "requestDate",
      key: "requestDate",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (text: string) => {
        switch (text) {
          case "pending":
            return <span className="text-yellow-500">قيد الانتظار</span>;
          case "approved":
            return <span className="text-green-500">تمت الموافقة</span>;
          case "repaid":
            return <span className="text-blue-500">تم السداد</span>;
          default:
            return text;
        }
      },
    },
  ];

  // طباعة التقرير
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>كشف حساب الموظف - ${employee.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              margin: 0;
              padding: 1px;
              background-color: #f0f4f8;
              color: #2c3e50;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: #fff;
              padding: 0px;
              border-radius: 15px;
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
              border: 2px solid #3498db;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 20px;
              border-bottom: 3px solid #3498db;
              background: #ecf0f1;
              color: #2c3e50;
              border-radius: 10px 10px 0 0;
              padding: 15px;
            }
            .header .logo img {
              max-width: 130px;
              height: auto;
            }
            .header .company-info {
              text-align: center;
              flex: 1;
            }
            .header .company-info h1 {
              font-size: 28px;
              margin: 0;
              font-weight: 700;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
            }
            .header .company-info p {
              font-size: 16px;
              margin: 5px 0 0;
              opacity: 0.9;
            }
            .date-range {
              text-align: center;
              font-size: 13px;
              color: #7f8c8d;
              margin: 15px 0;
              font-style: italic;
            }
            .employee-info {
              display: flex;
              justify-content: space-between;
              margin: 20px;
              flex-wrap: wrap;
              background: #ecf0f1;
              padding: 15px;
              border-radius: 10px;
            }
            .info-item {
              margin-bottom: 10px;
              flex: 0 0 48%;
            }
            .info-label {
              font-weight: bold;
              color: #7f8c8d;
            }
            .section {
              margin: 20px;
            }
            .section-title {
              font-size: 18px;
              color: #2980b9;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eaeaea;
              position: relative;
            }
            .section-title::after {
              content: '';
              width: 60px;
              height: 3px;
              background: #3498db;
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              border-radius: 2px;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 20px 0;
              font-size: 15px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            th, td {
              border: 1px solid #bdc3c7;
              padding: 12px;
              text-align: center;
            }
            th {
              background: #3498db;
              color: #fff;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            td {
              background: #fff;
            }
            tr:nth-child(even) td {
              background: #ecf0f1;
            }
            tr:hover td {
              background: #d5e8f7;
              transition: background 0.3s ease;
            }
            .summary {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .summary-total {
              font-weight: bold;
              font-size: 18px;
              color: #2980b9;
              border-top: 2px solid #eaeaea;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #3498db;
              font-size: 13px;
              color: #7f8c8d;
            }
            .footer strong {
              color: #3498db;
              font-weight: 700;
            }
            @media print {
              body {
                padding: 0;
                background: #fff;
              }
              .container {
                box-shadow: none;
                border: none;
              }
              .header {
                background: #ecf0f1;
                -webkit-print-color-adjust: exact;
              }
              table th, table td {
                font-size: 12px;
                padding: 8px;
              }
              .footer {
                font-size: 11px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-info">
                <h1>عسكر للمقاولات العمومية</h1>
                <p>Askar Group for General Contracting</p>
              </div>
              <div class="logo">
                <img src="/logo.webp" alt="شعار عسكر للمقاولات العمومية" />
              </div>
            </div>
  
            <div class="date-range">
              الفترة من ${startDate.format("YYYY/MM/DD")} إلى ${endDate.format("YYYY/MM/DD")}
            </div>
  
            <div class="employee-info">
              <div class="info-item">
                <span class="info-label">اسم الموظف:</span> ${employee.name}
              </div>
              <div class="info-item">
                <span class="info-label">الوظيفة:</span> ${employee.jobTitle}
              </div>
              <div class="info-item">
                <span class="info-label">الرقم القومي:</span> ${employee.nationalId}
              </div>
              <div class="info-item">
                <span class="info-label">رقم الهاتف:</span> ${employee.phoneNumber}
              </div>
              <div class="info-item">
                <span class="info-label">الراتب اليومي:</span> ${employee.dailySalary} ج.م
              </div>
              <div class="info-item">
                <span class="info-label">الرصيد الحالي:</span> ${employee.budget} ج.م
              </div>
            </div>
  
            <div class="section">
              <h3 class="section-title">سجل الحضور</h3>
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>وقت الحضور</th>
                    <th>وقت الانصراف</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${attendance.map((record: any) => `
                    <tr>
                      <td>${new Date(record.date).toLocaleDateString("ar-EG")}</td>
                      <td>${new Date(record.checkIn).toLocaleTimeString("ar-EG")}</td>
                      <td>${record.checkOut ? new Date(record.checkOut).toLocaleTimeString("ar-EG") : "-"}</td>
                      <td>${record.notes || "-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
  
            ${deductions.length > 0 ? `
              <div class="section">
                <h3 class="section-title">الخصومات</h3>
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${deductions.map((record: any) => `
                      <tr>
                        <td>${new Date(record.date).toLocaleDateString("ar-EG")}</td>
                        <td>${Number(record.amount).toLocaleString()} ج.م</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : ""}
  
            ${bonuses.length > 0 ? `
              <div class="section">
                <h3 class="section-title">المكافآت</h3>
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>السبب</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bonuses.map((record: any) => `
                      <tr>
                        <td>${new Date(record.date).toLocaleDateString("ar-EG")}</td>
                        <td>${Number(record.amount).toLocaleString()} ج.م</td>
                        <td>${record.reason}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : ""}
  
            ${advances.length > 0 ? `
              <div class="section">
                <h3 class="section-title">السلف</h3>
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${advances.map((record: any) => `
                      <tr>
                        <td>${new Date(record.requestDate).toLocaleDateString("ar-EG")}</td>
                        <td>${Number(record.amount).toLocaleString()} ج.م</td>
                        <td>${record.status === "pending" ? "قيد الانتظار" : record.status === "approved" ? "تمت الموافقة" : record.status === "repaid" ? "تم السداد" : record.status}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : ""}
  
            <div class="summary">
              <div class="summary-item">
                <span>إجمالي أيام العمل:</span>
                <span>${totalWorkDays} يوم</span>
              </div>
              <div class="summary-item">
                <span>إجمالي الراتب الأساسي:</span>
                <span>${totalBaseSalary.toLocaleString()} ج.م</span>
              </div>
              <div class="summary-item">
                <span>إجمالي المكافآت:</span>
                <span>${totalBonuses.toLocaleString()} ج.م</span>
              </div>
              <div class="summary-item">
                <span>إجمالي الخصومات:</span>
                <span>${totalDeductions.toLocaleString()} ج.م</span>
              </div>
              <div class="summary-item">
                <span>إجمالي السلف:</span>
                <span>${totalAdvances.toLocaleString()} ج.م</span>
              </div>
              <div class="summary-item summary-total">
                <span>صافي الراتب:</span>
                <span>${netSalary.toLocaleString()} ج.م</span>
              </div>
            </div>
  
            <div class="footer">
              <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
              <p>تم إصدار هذا التقرير بتاريخ ${new Date().toLocaleDateString("ar-EG")} الساعة ${new Date().toLocaleTimeString("ar-EG")}</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 10000); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const isLoading =
    attendanceLoading || deductionsLoading || bonusesLoading || advancesLoading;

  return (
    <div className="rtl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{employee.name}</h2>
          <p className="text-gray-500">{employee.jobTitle}</p>
        </div>
        <Button
          type="primary"
          icon={<Printer size={16} />}
          onClick={handlePrint}
        >
          طباعة التقرير
        </Button>
      </div>

      <div className="mb-4">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
            }
          }}
          locale={locale}
          style={{ width: "100%" }}
        />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500">الراتب اليومي</p>
            <p className="text-lg font-semibold">{employee.dailySalary} ج.م</p>
          </div>
          <div>
            <p className="text-gray-500">الرصيد الحالي</p>
            <p className="text-lg font-semibold">{employee.budget} ج.م</p>
          </div>
          <div>
            <p className="text-gray-500">رقم الهاتف</p>
            <p className="text-lg font-semibold">{employee.phoneNumber}</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <h3 className="text-lg font-bold mb-2">ملخص الفترة</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-gray-500">أيام العمل</p>
                <p className="text-lg font-semibold">{totalWorkDays} يوم</p>
              </div>
              <div>
                <p className="text-gray-500">الراتب الأساسي</p>
                <p className="text-lg font-semibold">
                  {totalBaseSalary.toLocaleString()} ج.م
                </p>
              </div>
              <div>
                <p className="text-gray-500">المكافآت</p>
                <p className="text-lg font-semibold text-green-600">
                  +{totalBonuses.toLocaleString()} ج.م
                </p>
              </div>
              <div>
                <p className="text-gray-500">الخصومات</p>
                <p className="text-lg font-semibold text-red-600">
                  -{totalDeductions.toLocaleString()} ج.م
                </p>
              </div>
              <div>
                <p className="text-gray-500">السلف</p>
                <p className="text-lg font-semibold text-orange-600">
                  -{totalAdvances.toLocaleString()} ج.م
                </p>
              </div>
            </div>
            <Divider />
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold">صافي الراتب:</p>
              <p className="text-xl font-bold text-blue-600">
                {netSalary.toLocaleString()} ج.م
              </p>
            </div>
          </Card>

          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">سجل الحضور</h3>
            <Table
              dataSource={attendance}
              columns={attendanceColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </div>

          {deductions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">الخصومات</h3>
              <Table
                dataSource={deductions}
                columns={deductionColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            </div>
          )}

          {bonuses.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">المكافآت</h3>
              <Table
                dataSource={bonuses}
                columns={bonusColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            </div>
          )}

          {advances.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">السلف</h3>
              <Table
                dataSource={advances}
                columns={advanceColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
