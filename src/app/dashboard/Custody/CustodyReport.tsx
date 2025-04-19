"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, DatePicker, Select, Table, Typography } from "antd";
import { Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface Custody {
  id: number;
  name: string;
  code: string;
  company: string;
  budget: number;
  remaining: number;
  status: string;
}

interface AddAmount {
  id: number;
  amount: number;
  createdAt: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseType: string;
  responsiblePerson: string;
  date: string;
  project?: {
    id: number;
    name: string;
  };
}

interface CustodyReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustodyReport({ isOpen, onClose }: CustodyReportProps) {
  const [selectedCustodyId, setSelectedCustodyId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Fetch all custodies
  const { data: custodies = [] } = useQuery<Custody[]>({
    queryKey: ["custodies"],
    queryFn: async () => {
      const response = await axios.get("/api/custodies");
      return response.data;
    },
  });

  // Fetch custody details including additions and expenses
  const { data: custodyDetails } = useQuery({
    queryKey: ["custodyDetails", selectedCustodyId, dateRange],
    queryFn: async () => {
      if (!selectedCustodyId || !dateRange[0] || !dateRange[1]) return null;

      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const response = await axios.get(`/api/custodies/${selectedCustodyId}/report`, {
        params: { startDate, endDate }
      });
      return response.data;
    },
    enabled: !!selectedCustodyId && !!dateRange[0] && !!dateRange[1],
  });

  // Calculate totals
  const totals = useMemo(() => {
    if (!custodyDetails) return null;

    const totalAdditions = custodyDetails.additions.reduce((sum: number, add: AddAmount) => {
      return sum + Number(add.amount);
    }, 0);

    const totalExpenses = custodyDetails.expenses.reduce((sum: number, exp: Expense) => {
      return sum + Number(exp.amount);
    }, 0);

    const netChange = totalAdditions - totalExpenses;

    return {
      totalAdditions,
      totalExpenses,
      netChange,
    };
  }, [custodyDetails]);

  // Print report
  const printReport = () => {
    if (!custodyDetails || !selectedCustodyId) return;

    const custody = custodies.find(c => c.id === selectedCustodyId);
    if (!custody) return;

    const content = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير العهدة - ${custody.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            margin: 10px;
            padding: 20px;
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
          .summary {
            margin: 20px;
            padding: 15px;
            text-align: right;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            justify-content: space-between;
            font-size: 12px;
            background: #ecf0f1;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .summary h3 {
            margin: 0 0 10px;
            font-size: 18px;
            color: #3498db;
          }
          .summary p {
            margin: 5px 0;
            font-size: 15px;
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
            .summary {
              background: #ecf0f1;
              -webkit-print-color-adjust: exact;
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
  
          <h2>تقرير العهدة - ${custody.name}</h2>
  
          <div class="summary">
            
            <p>الفترة: من ${dateRange[0]?.format("YYYY-MM-DD")} إلى ${dateRange[1]?.format("YYYY-MM-DD")}</p>
            <p>إجمالي الإضافات: ${totals?.totalAdditions.toLocaleString()} جنيه</p>
            <p>إجمالي المصروفات: ${totals?.totalExpenses.toLocaleString()} جنيه</p>
            <p>صافي التغيير: ${totals?.netChange.toLocaleString()} جنيه</p>
          </div>
  
          <h2>الإضافات</h2>
          <table>
            <thead>
              <tr>
                <th>المبلغ</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${custodyDetails.additions.map((add: AddAmount) => `
                <tr>
                  <td>${add.amount.toLocaleString()} جنيه</td>
                  <td>${new Date(add.createdAt).toLocaleDateString("ar-EG")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
  
          <h2>المصروفات</h2>
          <table>
            <thead>
              <tr>
                <th>الوصف</th>
                <th>المبلغ</th>
                <th>النوع</th>
                <th>المسؤول</th>
                <th>المشروع</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${custodyDetails.expenses.map((exp: Expense) => `
                <tr>
                  <td>${exp.description}</td>
                  <td>${exp.amount.toLocaleString()} جنيه</td>
                  <td>${exp.expenseType}</td>
                  <td>${exp.responsiblePerson}</td>
                  <td>${exp.project?.name || "-"}</td>
                  <td>${new Date(exp.date).toLocaleDateString("ar-EG")}</td>
                </tr>
              `).join("")}
            </tbody>
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
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Select
          className="w-64"
          placeholder="اختر العهدة"
          value={selectedCustodyId}
          onChange={setSelectedCustodyId}
        >
          {custodies.map((custody) => (
            <Option key={custody.id} value={custody.id}>
              {custody.name}
            </Option>
          ))}
        </Select>

        <RangePicker
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          placeholder={["تاريخ البداية", "تاريخ النهاية"]}
        />

        <Button
          type="primary"
          icon={<Printer size={16} />}
          onClick={printReport}
          disabled={!selectedCustodyId || !dateRange[0] || !dateRange[1]}
        >
          عرض و طباعه التقرير
        </Button>
      </div>

      {custodyDetails && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ملخص التقرير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Text type="secondary">إجمالي الإضافات</Text>
                  <Title level={4}>
                    {totals ? totals.totalAdditions.toLocaleString() : "—"} جنيه
                  </Title>
                </div>
                <div>
                  <Text type="secondary">إجمالي المصروفات</Text>
                  <Title level={4}>
                    {totals ? totals.totalExpenses.toLocaleString() : "—"} جنيه
                  </Title>
                </div>
                <div>
                  <Text type="secondary">صافي التغيير</Text>
                  <Title level={4}>
                    {totals ? totals.netChange.toLocaleString() : "—"} جنيه
                  </Title>
                </div>
              </div>
            </CardContent>

          </Card>

          <div>
            <Title level={4}>الإضافات</Title>
            <Table
              dataSource={custodyDetails.additions}
              columns={[
                { title: "المبلغ", dataIndex: "amount", key: "amount", render: (amount) => `${amount.toLocaleString()} جنيه` },
                { title: "التاريخ", dataIndex: "createdAt", key: "createdAt", render: (date) => new Date(date).toLocaleDateString("ar-EG") },
              ]}
              rowKey="id"
              pagination={false}
            />
          </div>

          <div>
            <Title level={4}>المصروفات</Title>
            <Table
              dataSource={custodyDetails.expenses}
              columns={[
                { title: "الوصف", dataIndex: "description", key: "description" },
                { title: "المبلغ", dataIndex: "amount", key: "amount", render: (amount) => `${amount.toLocaleString()} جنيه` },
                { title: "النوع", dataIndex: "expenseType", key: "expenseType" },
                { title: "المسؤول", dataIndex: "responsiblePerson", key: "responsiblePerson" },
                { title: "المشروع", dataIndex: ["project", "name"], key: "project", render: (name) => name || "-" },
                { title: "التاريخ", dataIndex: "date", key: "date", render: (date) => new Date(date).toLocaleDateString("ar-EG") },
              ]}
              rowKey="id"
              pagination={false}
            />
          </div>
        </div>
      )}
    </div>
  );
} 