"use client";
import { Button, DatePicker, Modal, Select, Table, Typography } from "antd";
import { useState, useMemo } from "react";
import { Printer, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { printExpensesReport } from "./printExpenseReport";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseType: string;
  responsiblePerson: string;
  date: string;
  custodyId: number;
  custody: { id: number; name: string };
  projectId: number | null;
  project?: { id: number; name: string };
}

interface ExpenseReportsProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: any[];
}

export default function ExpenseReports({
  isOpen,
  onClose,
  expenses,
}: ExpenseReportsProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [expenseType, setExpenseType] = useState<string>("all");
  const [custodyId, setCustodyId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<string>("date");

  // استخراج قائمة العهدات والمشاريع الفريدة من المصروفات
  const custodies = useMemo(() => {
    const uniqueCustodies = new Map();
    expenses.forEach((expense) => {
      if (!uniqueCustodies.has(expense.custodyId)) {
        uniqueCustodies.set(expense.custodyId, {
          id: expense.custodyId,
          name: expense.custody.name,
        });
      }
    });
    return Array.from(uniqueCustodies.values());
  }, [expenses]);

  const projects = useMemo(() => {
    const uniqueProjects = new Map();
    expenses.forEach((expense) => {
      if (expense.projectId && !uniqueProjects.has(expense.projectId)) {
        uniqueProjects.set(expense.projectId, {
          id: expense.projectId,
          name: expense.project?.name || "غير معروف",
        });
      }
    });
    return Array.from(uniqueProjects.values());
  }, [expenses]);

  // تصفية المصروفات حسب المعايير المحددة
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // تصفية حسب نوع المصروف
      const matchesType =
        expenseType === "all" || expense.expenseType === expenseType;

      // تصفية حسب العهدة
      const matchesCustody =
        custodyId === null || expense.custodyId === custodyId;

      // تصفية حسب المشروع
      const matchesProject =
        projectId === null || expense.projectId === projectId;

      // تصفية حسب التاريخ
      let matchesDate = true;
      if (dateRange[0] && dateRange[1]) {
        const expenseDate = new Date(expense.date);
        matchesDate =
          expenseDate >= dateRange[0] && expenseDate <= dateRange[1];
      }

      return matchesType && matchesCustody && matchesProject && matchesDate;
    });
  }, [expenses, expenseType, custodyId, projectId, dateRange]);

  // تجميع المصروفات حسب المعيار المحدد
  const groupedData = useMemo(() => {
    const result: Record<string, any> = {};

    filteredExpenses.forEach((expense) => {
      let key;

      switch (groupBy) {
        case "date":
          // تجميع حسب الشهر والسنة
          const date = new Date(expense.date);
          key = `${date.getMonth() + 1}/${date.getFullYear()}`;
          break;
        case "type":
          key = expense.expenseType;
          break;
        case "custody":
          key = expense.custody.name;
          break;
        case "project":
          key = expense.project?.name || "بدون مشروع";
          break;
        default:
          key = "all";
      }

      if (!result[key]) {
        result[key] = {
          key,
          groupName: key,
          count: 0,
          totalAmount: 0,
          expenses: [],
        };
      }

      result[key].count += 1;
      result[key].totalAmount += Number(expense.amount);
      result[key].expenses.push(expense);
    });

    return Object.values(result);
  }, [filteredExpenses, groupBy]);

  // حساب إجمالي المصروفات
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );
  }, [filteredExpenses]);

  // أعمدة جدول المجموعات
  const groupColumns = [
    {
      title:
        groupBy === "date"
          ? "الشهر/السنة"
          : groupBy === "type"
          ? "نوع المصروف"
          : groupBy === "custody"
          ? "العهدة"
          : groupBy === "project"
          ? "المشروع"
          : "المجموعة",
      dataIndex: "groupName",
      key: "groupName",
    },
    {
      title: "عدد المصروفات",
      dataIndex: "count",
      key: "count",
    },
    {
      title: "إجمالي المبلغ",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => `${amount.toLocaleString()} جنيه`,
    },
  ];

  // أعمدة جدول التفاصيل
  const detailColumns = [
    {
      title: "الوصف",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `${Number(amount).toLocaleString()} جنيه`,
    },
    {
      title: "نوع المصروف",
      dataIndex: "expenseType",
      key: "expenseType",
    },
    {
      title: "المسؤول",
      dataIndex: "responsiblePerson",
      key: "responsiblePerson",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
    },
    {
      title: "العهدة",
      dataIndex: ["custody", "name"],
      key: "custodyName",
    },
  ];

  // تصدير البيانات إلى CSV
  const exportToCSV = () => {
    // تحويل البيانات إلى تنسيق CSV
    const headers = [
      "الوصف",
      "المبلغ",
      "نوع المصروف",
      "المسؤول",
      "التاريخ",
      "العهدة",
      "المشروع",
    ];
    const csvData = [
      headers.join(","),
      ...filteredExpenses.map((expense) =>
        [
          `"${expense.description}"`,
          expense.amount,
          `"${expense.expenseType}"`,
          `"${expense.responsiblePerson}"`,
          new Date(expense.date).toLocaleDateString("ar-EG"),
          `"${expense.custody.name}"`,
          `"${expense.project?.name || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    // إنشاء ملف للتنزيل
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `تقرير_المصروفات_${new Date().toLocaleDateString()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // طباعة التقرير
  const printReport = () => {
    const content = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير المصروفات - عسكر للمقاولات العمومية</title>
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
            }
            .header .company-info p {
              font-size: 16px;
              margin: 5px 0 0;
            }
            h2 {
              text-align: center;
              font-size: 24px;
              color: #2c3e50;
              margin: 25px 0;
              font-weight: 700;
              position: relative;
            }
            h2::after {
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
            }
            .timestamp {
              text-align: center;
              font-size: 13px;
              color: #7f8c8d;
              margin-top: 15px;
              font-style: italic;
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
    
            <h2>تقرير المصروفات</h2>
    
            <div class="summary">
              <p><strong>إجمالي المصروفات:</strong> ${totalAmount.toLocaleString()} جنيه</p>
              <p><strong>عدد المصروفات:</strong> ${filteredExpenses.length}</p>
              ${
                dateRange[0] && dateRange[1]
                  ? `<p><strong>الفترة:</strong> من ${dateRange[0].toLocaleDateString(
                      "ar-EG"
                    )} إلى ${dateRange[1].toLocaleDateString("ar-EG")}</p>`
                  : ""
              }
              ${
                expenseType !== "all"
                  ? `<p><strong>نوع المصروف:</strong> ${expenseType}</p>`
                  : ""
              }
              ${
                custodyId
                  ? `<p><strong>العهدة:</strong> ${
                      custodies.find((c: { id: number }) => c.id === custodyId)
                        ?.name
                    }</p>`
                  : ""
              }
              ${
                projectId
                  ? `<p><strong>المشروع:</strong> ${
                      projects.find((p: { id: number }) => p.id === projectId)
                        ?.name
                    }</p>`
                  : ""
              }
            </div>
    
            <h2>ملخص المصروفات</h2>
            <table>
              <thead>
                <tr>
                  <th>${
                    groupBy === "date"
                      ? "الشهر/السنة"
                      : groupBy === "type"
                      ? "نوع المصروف"
                      : groupBy === "custody"
                      ? "العهدة"
                      : groupBy === "project"
                      ? "المشروع"
                      : "المجموعة"
                  }</th>
                  <th>عدد المصروفات</th>
                  <th>إجمالي المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${groupedData
                  .map((group: any) => {
                    return `
                      <tr>
                        <td>${group.groupName}</td>
                        <td>${group.count}</td>
                        <td>${group.totalAmount.toLocaleString()} جنيه</td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
    
            <h2>تفاصيل المصروفات</h2>
            <table>
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>المبلغ</th>
                  <th>نوع المصروف</th>
                  <th>المسؤول</th>
                  <th>التاريخ</th>
                  <th>العهدة</th>
                  <th>المشروع</th>
                </tr>
              </thead>
              <tbody>
                ${filteredExpenses
                  .map((expense: any) => {
                    return `
                      <tr>
                        <td>${expense.description}</td>
                        <td>${Number(expense.amount).toLocaleString()} جنيه</td>
                        <td>${expense.expenseType}</td>
                        <td>${expense.responsiblePerson}</td>
                        <td>${new Date(expense.date).toLocaleDateString(
                          "ar-EG"
                        )}</td>
                        <td>${expense.custody.name}</td>
                        <td>${expense.project?.name || "-"}</td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
    
            <div class="footer">
              <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString(
                "ar-EG"
              )}</p>
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

  return (
    <Modal
      title="تقارير المصروفات"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <div className="space-y-6 py-4">
        {/* أدوات التصفية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              الفترة الزمنية
            </label>
            <RangePicker
              className="w-full"
              onChange={(dates) => {
                if (dates) {
                  setDateRange([
                    dates[0]?.toDate() || null,
                    dates[1]?.toDate() || null,
                  ]);
                } else {
                  setDateRange([null, null]);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              نوع المصروف
            </label>
            <Select
              className="w-full"
              placeholder="جميع الأنواع"
              value={expenseType}
              onChange={setExpenseType}
            >
              <Option value="all">جميع الأنواع</Option>
              <Option value="مصروفات مكتبية">مصروفات مكتبية</Option>
              <Option value="مصروفات صيانة">مصروفات صيانة</Option>
              <Option value="مصروفات عامة">مصروفات عامة</Option>
              <Option value="مصروفات خاصة">مصروفات خاصة</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">العهدة</label>
            <Select
              className="w-full"
              placeholder="جميع العهدات"
              value={custodyId}
              onChange={setCustodyId}
              allowClear
            >
              {custodies.map((custody) => (
                <Option key={custody.id} value={custody.id}>
                  {custody.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">المشروع</label>
            <Select
              className="w-full"
              placeholder="جميع المشاريع"
              value={projectId}
              onChange={setProjectId}
              allowClear
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">تجميع حسب</label>
          <Select
            className="w-full md:w-1/4"
            value={groupBy}
            onChange={setGroupBy}
          >
            <Option value="date">التاريخ (شهر/سنة)</Option>
            <Option value="type">نوع المصروف</Option>
            <Option value="custody">العهدة</Option>
            <Option value="project">المشروع</Option>
          </Select>
        </div>

        {/* ملخص التقرير */}
        <Card>
          <CardHeader>
            <CardTitle>ملخص التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Text type="secondary">إجمالي المصروفات</Text>
                <Title level={4}>{totalAmount.toLocaleString()} جنيه</Title>
              </div>
              <div>
                <Text type="secondary">عدد المصروفات</Text>
                <Title level={4}>{filteredExpenses.length}</Title>
              </div>
              <div className="flex items-center gap-2">
                <Button icon={<Printer size={16} />} onClick={printReport}>
                  طباعة التقرير
                </Button>
                <Button icon={<FileDown size={16} />} onClick={exportToCSV}>
                  تصدير CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* جدول المجموعات */}
        <div>
          <Title level={5}>
            ملخص المصروفات حسب{" "}
            {groupBy === "date"
              ? "الشهر/السنة"
              : groupBy === "type"
              ? "نوع المصروف"
              : groupBy === "custody"
              ? "العهدة"
              : "المشروع"}
          </Title>
          <Table
            columns={groupColumns}
            dataSource={groupedData}
            pagination={false}
            rowKey="groupName"
          />
        </div>

        {/* جدول التفاصيل */}
        <div>
          <Title level={5}>تفاصيل المصروفات ({filteredExpenses.length})</Title>
          <Table
            columns={detailColumns}
            dataSource={filteredExpenses}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </div>
      </div>
    </Modal>
  );
}
