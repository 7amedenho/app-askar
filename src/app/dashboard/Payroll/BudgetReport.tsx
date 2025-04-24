"use client";
import { useState, useEffect } from "react";
import { Table, Input, Button, Spin, DatePicker } from "antd";
import { SearchOutlined, PrinterOutlined } from "@ant-design/icons";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import moment from "moment";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { RangePicker } = DatePicker;

interface Employee {
  id: number;
  name: string;
  jobTitle: string;
  dailySalary: number;
  budget: number;
}

interface Attendance {
  employeeId: number;
  date: string;
  checkIn: string;
  checkOut: string;
  overtimeHours: number;
}

interface Payroll {
  employeeId: number;
  netSalary: number;
  paidAmount: number;
}

interface Advance {
  employeeId: number;
  amount: number;
}

interface Deduction {
  employeeId: number;
  amount: number;
}

interface Bonus {
  employeeId: number;
  amount: number;
}

const printReport = (data: any[], dateRange: [moment.Moment | null, moment.Moment | null] | null) => {
  const content = `
   <!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير المرتبات - عسكر للمقاولات العمومية</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
    body {
      font-family: 'Cairo', sans-serif;
      margin: 20px;
      padding: 10px;
      background-color: #f0f4f8;
      color: #2c3e50;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      border: 1px solid #3498db;
    }
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 15px;
      background: #ecf0f1;
      border-radius: 10px 10px 0 0;
      border-bottom: 2px solid #3498db;
    }
    .header .logo img {
      max-width: 100px;
      height: auto;
      margin-bottom: 10px;
    }
    .header .company-info {
      text-align: center;
    }
    .header .company-info h1 {
      font-size: 22px;
      margin: 0;
      font-weight: 700;
    }
    .header .company-info p {
      font-size: 14px;
      margin: 5px 0 0;
      opacity: 0.8;
    }
    h2 {
      text-align: center;
      font-size: 20px;
      color: #2c3e50;
      margin: 20px 0;
      font-weight: 700;
      position: relative;
    }
    h2::after {
      content: '';
      width: 50px;
      height: 3px;
      background: #3498db;
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    th, td {
      border: 1px solid #bdc3c7;
      padding: 8px 6px;
      text-align: center;
      word-break: break-word;
    }
    th {
      background: #3498db;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
    }
    td {
      background: #fff;
      font-size: 12px;
    }
    tr:nth-child(even) td {
      background: #f8f9fa;
    }
    tr:hover td {
      background: #e6f0fa;
      transition: background 0.3s ease;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px dashed #3498db;
      font-size: 12px;
      color: #7f8c8d;
    }
    .footer strong {
      color: #3498db;
      font-weight: 700;
    }
    .timestamp {
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
      margin-top: 10px;
      font-style: italic;
    }
    .period {
      text-align: center;
      font-size: 14px;
      color: #2c3e50;
      margin: 10px 0;
      font-weight: 600;
    }
    @media screen and (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .header .company-info h1 {
        font-size: 18px;
      }
      .header .company-info p {
        font-size: 12px;
      }
      table {
        font-size: 11px;
      }
      th, td {
        padding: 6px 4px;
      }
    }
    @media print {
      @page {
        size: portrait;
        margin: 1cm;
      }
      body {
        margin: 0;
        padding: 0;
        background: #fff;
      }
      .container {
        box-shadow: none;
        border: none;
        padding: 10px;
        margin: 0;
      }
      .header {
        padding: 10px;
      }
      table {
        margin: 10px 0;
      }
      th, td {
        font-size: 11px;
        padding: 6px 4px;
      }
      .footer {
        font-size: 11px;
        margin-top: 15px;
      }
      .timestamp {
        font-size: 11px;
      }
      .period {
        font-size: 12px;
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

    <h2>تقرير المرتبات</h2>
    
    ${dateRange ? `
      <div class="period">
        الفترة من ${dateRange[0]?.format('YYYY/MM/DD')} إلى ${dateRange[1]?.format('YYYY/MM/DD')}
      </div>
    ` : ''}

    <table>
      <thead>
        <tr>
          <th>العامل</th>
          <th>اليومية</th>
          <th>عدد الأيام</th>
          <th>س. ع</th>
          <th>س. ض</th>
          <th>المكافآت</th>
          <th>السلف</th>
          <th>الخصومات</th>
          <th>إ.ج الراتب</th>
          <th>الرصيد</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td>${item.name} - (${item.jobTitle})</td>
            <td>${item.dailySalary.toLocaleString()} ج.م</td>
            <td>${item.daysWorked}</td>
            <td>${item.regularHours}</td>
            <td>${item.overtimeHours}</td>
            <td>${item.totalBonuses.toLocaleString()} ج.م</td>
            <td>${item.totalAdvances.toLocaleString()} ج.م</td>
            <td>${item.totalDeductions.toLocaleString()} ج.م</td>
            <td>${item.totalSalary.toLocaleString()} ج.م</td>
            <td>${item.budget.toLocaleString()} ج.م</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="9" style="text-align: right; font-weight: bold;">إجمالي المبلغ المصروف:</td>
          <td style="font-weight: bold;">${data.reduce((sum, item) => sum + item.budget, 0).toLocaleString()} ج.م</td>
        </tr>
      </tfoot>
    </table>

    <div class="timestamp">
      تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}
    </div>

    <div class="footer">
      <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=600");
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    setTimeout(() => {
      printWindow.close();
    }, 10000);
  }
};

export default function BudgetReport() {
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[moment.Moment | null, moment.Moment | null] | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axios.get("/api/employees");
      return res.data;
    },
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ["attendance", dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.add(1, 'day').format("YYYY-MM-DD");
      if (!startDate || !endDate) return [];
      const res = await axios.get(`/api/attendance?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
    enabled: !!dateRange,
  });

  const { data: payrolls = [], isLoading: payrollsLoading } = useQuery<Payroll[]>({
    queryKey: ["payrolls", dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.add(1, 'day').format("YYYY-MM-DD");
      if (!startDate || !endDate) return [];
      const res = await axios.get(`/api/payroll?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
    enabled: !!dateRange,
  });

  const { data: advances = [], isLoading: advancesLoading } = useQuery<Advance[]>({
    queryKey: ["advances", dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.add(1, 'day').format("YYYY-MM-DD");
      if (!startDate || !endDate) return [];
      const res = await axios.get(`/api/advances?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
    enabled: !!dateRange,
  });

  const { data: deductions = [], isLoading: deductionsLoading } = useQuery<Deduction[]>({
    queryKey: ["deductions", dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.add(1, 'day').format("YYYY-MM-DD");
      if (!startDate || !endDate) return [];
      const res = await axios.get(`/api/deductions?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
    enabled: !!dateRange,
  });

  const { data: bonuses = [], isLoading: bonusesLoading } = useQuery<Bonus[]>({
    queryKey: ["bonuses", dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.add(1, 'day').format("YYYY-MM-DD");
      if (!startDate || !endDate) return [];
      const res = await axios.get(`/api/bonuses?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
    enabled: !!dateRange,
  });

  useEffect(() => {
    if (employees.length > 0 && attendance.length > 0) {
      const newReportData = employees.map(employee => {
        const employeeAttendance = attendance.filter(a => a.employeeId === employee.id);
        const daysWorked = employeeAttendance.length;
        const regularHours = daysWorked * 8; // 8 ساعات يومياً
        const overtimeHours = employeeAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

        const employeePayroll = payrolls.find(p => p.employeeId === employee.id);
        const employeeAdvances = advances.filter(a => a.employeeId === employee.id);
        const employeeDeductions = deductions.filter(d => d.employeeId === employee.id);
        const employeeBonuses = bonuses.filter(b => b.employeeId === employee.id);

        const totalAdvances = employeeAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
        const totalDeductions = employeeDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
        const totalBonuses = employeeBonuses.reduce((sum, b) => sum + Number(b.amount), 0);

        const totalSalary = employee.dailySalary * daysWorked;
        const netSalary = totalSalary + totalBonuses - totalDeductions - totalAdvances;

        return {
          id: employee.id,
          name: employee.name,
          jobTitle: employee.jobTitle,
          dailySalary: employee.dailySalary,
          daysWorked,
          regularHours,
          overtimeHours,
          totalBonuses,
          totalAdvances,
          totalDeductions,
          totalSalary,
          netSalary,
          budget: employee.budget
        };
      });

      setReportData(newReportData);
    }
  }, [employees, attendance, payrolls, advances, deductions, bonuses]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const filteredData = reportData.filter(item =>
    item.name.toLowerCase().includes(searchText)
  );

  const columns = [
    { title: "الاسم", dataIndex: "name", key: "name" },
    { title: "الوظيفة", dataIndex: "jobTitle", key: "jobTitle" },
    {
      title: "اليومية",
      dataIndex: "dailySalary",
      key: "dailySalary",
      render: (text: number) => `${text.toLocaleString()} ج.م`
    },
    { title: "عدد الأيام", dataIndex: "daysWorked", key: "daysWorked" },
    { title: "الساعات العادية", dataIndex: "regularHours", key: "regularHours" },
    { title: "الساعات الإضافية", dataIndex: "overtimeHours", key: "overtimeHours" },
    {
      title: "المكافآت",
      dataIndex: "totalBonuses",
      key: "totalBonuses",
      render: (text: number) => `${text.toLocaleString()} ج.م`
    },
    {
      title: "السلف",
      dataIndex: "totalAdvances",
      key: "totalAdvances",
      render: (text: number) => `${text.toLocaleString()} ج.م`
    },
    {
      title: "الخصومات",
      dataIndex: "totalDeductions",
      key: "totalDeductions",
      render: (text: number) => `${text.toLocaleString()} ج.م`
    },
    {
      title: "إجمالي الراتب",
      dataIndex: "totalSalary",
      key: "totalSalary",
      render: (text: number) => `${text.toLocaleString()} ج.م`
    },
    {
      title: "الرصيد",
      dataIndex: "budget",
      key: "budget",
      render: (text: number) => `${text.toLocaleString()} ج.م`
    }
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-center">كشف المرتبات</h1>

      <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex flex-col items-right gap-2">
        <span className="text-red-500">برجاء اختيار الفترة أولاً</span>
        <RangePicker
          onChange={(dates) => setDateRange(dates as [moment.Moment | null, moment.Moment | null] | null)}
          placeholder={["تاريخ البداية", "تاريخ النهاية"]}
          style={{ width: "100%", maxWidth: 300 }}
          locale={locale}
        />
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="بحث عن الموظف"
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            style={{ width: 200 }}
          />
          <Button
            type="default"
            icon={<PrinterOutlined />}
            onClick={() => printReport(filteredData, dateRange)}
          >
            طباعة
          </Button>
        </div>
      </div>

      <Card>
        {employeesLoading || attendanceLoading || payrollsLoading || advancesLoading || deductionsLoading || bonusesLoading ? (
          <div className="flex justify-center items-center p-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            bordered
            summary={(pageData) => {
              const totalBudget = pageData.reduce((sum, item) => sum + Number(item.budget), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={10}>
                    <span className="font-bold">إجمالي المبلغ المصروف:</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <span className="font-bold">{totalBudget.toLocaleString()} ج.م</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}

