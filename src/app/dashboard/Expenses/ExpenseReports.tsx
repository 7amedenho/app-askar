"use client";
import { Button, DatePicker, Modal, Select, Table, Typography } from "antd";
import { useState, useMemo } from "react";
import { Printer, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface ExpenseReportsProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: any[];
}

export default function ExpenseReports({ isOpen, onClose, expenses }: ExpenseReportsProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [expenseType, setExpenseType] = useState<string>("all");
  const [custodyId, setCustodyId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<string>("date");

  // استخراج قائمة العهدات والمشاريع الفريدة من المصروفات
  const custodies = useMemo(() => {
    const uniqueCustodies = new Map();
    expenses.forEach(expense => {
      if (!uniqueCustodies.has(expense.custodyId)) {
        uniqueCustodies.set(expense.custodyId, {
          id: expense.custodyId,
          name: expense.custody.name
        });
      }
    });
    return Array.from(uniqueCustodies.values());
  }, [expenses]);

  const projects = useMemo(() => {
    const uniqueProjects = new Map();
    expenses.forEach(expense => {
      if (expense.projectId && !uniqueProjects.has(expense.projectId)) {
        uniqueProjects.set(expense.projectId, {
          id: expense.projectId,
          name: expense.project?.name || 'غير معروف'
        });
      }
    });
    return Array.from(uniqueProjects.values());
  }, [expenses]);

  // تصفية المصروفات حسب المعايير المحددة
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // تصفية حسب نوع المصروف
      const matchesType = expenseType === "all" || expense.expenseType === expenseType;
      
      // تصفية حسب العهدة
      const matchesCustody = custodyId === null || expense.custodyId === custodyId;
      
      // تصفية حسب المشروع
      const matchesProject = projectId === null || expense.projectId === projectId;
      
      // تصفية حسب التاريخ
      let matchesDate = true;
      if (dateRange[0] && dateRange[1]) {
        const expenseDate = new Date(expense.date);
        matchesDate = expenseDate >= dateRange[0] && expenseDate <= dateRange[1];
      }
      
      return matchesType && matchesCustody && matchesProject && matchesDate;
    });
  }, [expenses, expenseType, custodyId, projectId, dateRange]);

  // تجميع المصروفات حسب المعيار المحدد
  const groupedData = useMemo(() => {
    const result: Record<string, any> = {};
    
    filteredExpenses.forEach(expense => {
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
    return filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }, [filteredExpenses]);

  // أعمدة جدول المجموعات
  const groupColumns = [
    {
      title: groupBy === "date" ? "الشهر/السنة" : 
             groupBy === "type" ? "نوع المصروف" : 
             groupBy === "custody" ? "العهدة" : 
             groupBy === "project" ? "المشروع" : "المجموعة",
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
    const headers = ["الوصف", "المبلغ", "نوع المصروف", "المسؤول", "التاريخ", "العهدة", "المشروع"];
    const csvData = [
      headers.join(","),
      ...filteredExpenses.map(expense => [
        `"${expense.description}"`,
        expense.amount,
        `"${expense.expenseType}"`,
        `"${expense.responsiblePerson}"`,
        new Date(expense.date).toLocaleDateString("ar-EG"),
        `"${expense.custody.name}"`,
        `"${expense.project?.name || ''}"`,
      ].join(","))
    ].join("\n");
    
    // إنشاء ملف للتنزيل
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_المصروفات_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // طباعة التقرير
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>تقرير المصروفات</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f2f2f2; }
              .summary { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <h1>تقرير المصروفات</h1>
            <div class="summary">
              <p><strong>إجمالي المصروفات:</strong> ${totalAmount.toLocaleString()} جنيه</p>
              <p><strong>عدد المصروفات:</strong> ${filteredExpenses.length}</p>
              ${dateRange[0] && dateRange[1] ? `<p><strong>الفترة:</strong> من ${dateRange[0].toLocaleDateString("ar-EG")} إلى ${dateRange[1].toLocaleDateString("ar-EG")}</p>` : ''}
              ${expenseType !== "all" ? `<p><strong>نوع المصروف:</strong> ${expenseType}</p>` : ''}
              ${custodyId ? `<p><strong>العهدة:</strong> ${custodies.find(c => c.id === custodyId)?.name}</p>` : ''}
              ${projectId ? `<p><strong>المشروع:</strong> ${projects.find(p => p.id === projectId)?.name}</p>` : ''}
            </div>
            
            <h2>ملخص المصروفات</h2>
            <table>
              <thead>
                <tr>
                  <th>${groupBy === "date" ? "الشهر/السنة" : groupBy === "type" ? "نوع المصروف" : groupBy === "custody" ? "العهدة" : groupBy === "project" ? "المشروع" : "المجموعة"}</th>
                  <th>عدد المصروفات</th>
                  <th>إجمالي المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${groupedData.map(group => `
                  <tr>
                    <td>${group.groupName}</td>
                    <td>${group.count}</td>
                    <td>${group.totalAmount.toLocaleString()} جنيه</td>
                  </tr>
                `).join('')}
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
                ${filteredExpenses.map(expense => `
                  <tr>
                    <td>${expense.description}</td>
                    <td>${Number(expense.amount).toLocaleString()} جنيه</td>
                    <td>${expense.expenseType}</td>
                    <td>${expense.responsiblePerson}</td>
                    <td>${new Date(expense.date).toLocaleDateString("ar-EG")}</td>
                    <td>${expense.custody.name}</td>
                    <td>${expense.project?.name || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString("ar-EG")}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
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
            <label className="block text-sm font-medium mb-1">الفترة الزمنية</label>
            <RangePicker 
              className="w-full" 
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]?.toDate() || null, dates[1]?.toDate() || null]);
                } else {
                  setDateRange([null, null]);
                }
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">نوع المصروف</label>
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
              {custodies.map(custody => (
                <Option key={custody.id} value={custody.id}>{custody.name}</Option>
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
              {projects.map(project => (
                <Option key={project.id} value={project.id}>{project.name}</Option>
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
                <Button 
                  icon={<Printer size={16} />} 
                  onClick={printReport}
                >
                  طباعة التقرير
                </Button>
                <Button 
                  icon={<FileDown size={16} />} 
                  onClick={exportToCSV}
                >
                  تصدير CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* جدول المجموعات */}
        <div>
          <Title level={5}>ملخص المصروفات حسب {groupBy === "date" ? "الشهر/السنة" : groupBy === "type" ? "نوع المصروف" : groupBy === "custody" ? "العهدة" : "المشروع"}</Title>
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