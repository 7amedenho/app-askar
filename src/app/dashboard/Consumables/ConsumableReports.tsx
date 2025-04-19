"use client";

import { useState } from "react";
import { Modal, Select, DatePicker, Button, Table, App } from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";

const { RangePicker } = DatePicker;

interface ConsumableReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConsumableUsage {
  id: number;
  quantityUsed: number;
  usedAt: string;
  notes?: string;
  consumable: {
    id: number;
    name: string;
    unit: string;
  };
  project: {
    id: number;
    name: string;
  } | null;
}

const ConsumableReports = ({ isOpen, onClose }: ConsumableReportsProps) => {
  const [dateRange, setDateRange] = useState<
    [moment.Moment, moment.Moment] | null
  >(null);
  const [selectedConsumable, setSelectedConsumable] = useState<number | null>(
    null
  );

  // Fetch consumables
  const { data: consumables = [], isLoading: consumablesLoading } = useQuery({
    queryKey: ["consumables"],
    queryFn: async () => {
      const res = await axios.get("/api/consumables");
      return res.data;
    },
  });

  // Fetch usage data
  const { data: usageData = [], isLoading: usageLoading } = useQuery<
    ConsumableUsage[]
  >({
    queryKey: ["consumableUsage", selectedConsumable, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedConsumable) {
        params.append("consumableId", selectedConsumable.toString());
      }
      if (dateRange) {
        params.append("startDate", dateRange[0].toISOString());
        params.append("endDate", dateRange[1].toISOString());
      }
      const response = await axios.get(`/api/consumables/usage?${params}`);
      return response.data;
    },
    enabled: !!selectedConsumable,
  });

  // Handle print
  const handlePrint = () => {
    if (!selectedConsumable || !usageData.length) {
      alert("يرجى اختيار مستهلك وعرض البيانات أولاً");
      return;
    }

    const consumable = consumables.find(
      (c: any) => c.id === selectedConsumable
    );
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير استهلاك ${consumable?.name}</title>
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
          .date-range {
            text-align: center;
            font-size: 13px;
            color: #7f8c8d;
            margin: 15px 0;
            font-style: italic;
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
  
          <h2>تقرير استهلاك: ${consumable?.name} (${consumable?.unit})</h2>
          ${dateRange
        ? `<div class="date-range">
                  الفترة من: ${moment(dateRange[0]).format("YYYY-MM-DD")} إلى: ${moment(dateRange[1]).format("YYYY-MM-DD")}
                </div>`
        : ""
      }
  
          <table>
            <thead>
              <tr>
                <th>المشروع</th>
                <th>الكمية المستخدمة</th>
                <th>التاريخ</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${usageData.map((usage) => `
                <tr>
                  <td>${usage.project?.name || "غير محدد"}</td>
                  <td>${Number(usage.quantityUsed).toLocaleString()} ${consumable?.unit}</td>
                  <td>${moment(usage.usedAt).format("YYYY-MM-DD")}</td>
                  <td>${usage.notes || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
  
          <div class="footer">
            <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
            <p>تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => { window.close(); }, 10000);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  // Table columns
  const columns = [
    {
      title: "المشروع",
      dataIndex: ["project", "name"],
      key: "project",
      render: (name: string) => name || "غير محدد",
    },
    {
      title: "الكمية المستخدمة",
      dataIndex: "quantityUsed",
      key: "quantityUsed",
      render: (quantity: number) =>
        `${quantity} ${consumables.find((c: any) => c.id === selectedConsumable)?.unit || ""
        }`,
    },
    {
      title: "التاريخ",
      dataIndex: "usedAt",
      key: "usedAt",
      render: (date: string) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string) => notes || "-",
    },
  ];

  return (
    <App>
      <Modal
        title="تقرير استهلاك مستهلك"
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <div className="space-y-6">
          <div className="flex gap-4">
            <Select
              className="w-64"
              placeholder="اختر المستهلك"
              allowClear
              loading={consumablesLoading}
              onChange={(value) => setSelectedConsumable(value)}
            >
              {consumables.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name} ({c.unit})
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              className="w-64"
              onChange={(dates) => setDateRange(dates as any)}
            />
            <Button
              type="primary"
              onClick={handlePrint}
              disabled={!selectedConsumable || !usageData.length}
            >
              طباعة التقرير
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={usageData}
            rowKey="id"
            loading={usageLoading}
            locale={{ emptyText: "لا توجد بيانات للعرض" }}
            pagination={false}
          />
        </div>
      </Modal>
    </App>
  );
};

export default ConsumableReports;
