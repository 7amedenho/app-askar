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
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير استهلاك ${consumable?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header img { width: 100px; }
          .title { font-size: 24px; font-weight: bold; }
          .subtitle { font-size: 18px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.webp" alt="Logo" />
          <div class="title">عسكر للمقاولات العمومية</div>
          <div class="subtitle">تقرير استهلاك: ${consumable?.name} (${
      consumable?.unit
    })</div>
          ${
            dateRange
              ? `<div class="subtitle">من: ${moment(dateRange[0]).format(
                  "YYYY-MM-DD"
                )} إلى: ${moment(dateRange[1]).format("YYYY-MM-DD")}</div>`
              : ""
          }
        </div>
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
            ${usageData
              .map(
                (usage) => `
              <tr>
                <td>${usage.project?.name || "غير محدد"}</td>
                <td>${usage.quantityUsed} ${consumable?.unit}</td>
                <td>${moment(usage.usedAt).format("YYYY-MM-DD")}</td>
                <td>${usage.notes || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام إدارة عسكر للمقاولات
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
        `${quantity} ${
          consumables.find((c: any) => c.id === selectedConsumable)?.unit || ""
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
