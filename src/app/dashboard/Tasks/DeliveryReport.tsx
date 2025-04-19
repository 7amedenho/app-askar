"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Button,
  Table,
  Select,
  DatePicker,
  Form,
  Card,
  Statistic,
  Row,
  Col,
  Divider,
  Empty,
} from "antd";
import {
  FilePdfOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

interface DeliveryReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function DeliveryReport({
  isOpen,
  onClose,
}: DeliveryReportProps) {
  const [form] = Form.useForm();
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);
  const [taskItemFilter, setTaskItemFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  // Fetch all task deliveries
  const { data: deliveries = [], isLoading: isDeliveriesLoading } = useQuery({
    queryKey: ["taskDeliveries"],
    queryFn: async () => {
      const response = await axios.get("/api/tasks/deliveries");
      return response.data;
    },
    enabled: isOpen,
  });

  // Fetch all employees for filter
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axios.get("/api/employees");
      return response.data;
    },
    enabled: isOpen,
  });

  // Fetch all task items for filter
  const { data: taskItems = [] } = useQuery({
    queryKey: ["taskItems"],
    queryFn: async () => {
      const response = await axios.get("/api/tasks");
      return response.data;
    },
    enabled: isOpen,
  });

  // Apply filters
  useEffect(() => {
    let filtered = [...deliveries];

    if (employeeFilter) {
      filtered = filtered.filter((item) => item.employeeId === employeeFilter);
    }

    if (taskItemFilter) {
      filtered = filtered.filter((item) => item.taskItemId === taskItemFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day").toDate();
      const endDate = dateRange[1].endOf("day").toDate();

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, employeeFilter, taskItemFilter, dateRange]);

  // Calculate statistics
  const totalDeliveries = filteredDeliveries.length;
  const totalQuantity = filteredDeliveries.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const uniqueEmployees = new Set(
    filteredDeliveries.map((item) => item.employeeId)
  ).size;
  const uniqueItems = new Set(filteredDeliveries.map((item) => item.taskItemId))
    .size;

  // Reset filters
  const resetFilters = () => {
    form.resetFields();
    setEmployeeFilter(null);
    setTaskItemFilter(null);
    setDateRange(null);
  };

  // Handle print function
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تسليم المهمات</title>
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
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
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
  
          <h2>تقرير تسليم المهمات</h2>
          ${dateRange
        ? `<div class="date-range">
                  الفترة من: ${dateRange[0].format("YYYY-MM-DD")} إلى: ${dateRange[1].format("YYYY-MM-DD")}
                </div>`
        : ""
      }
  
          <div class="summary">
            <div class="summary-item">
              <span>عدد التسليمات:</span>
              <span>${totalDeliveries}</span>
            </div>
            <div class="summary-item">
              <span>إجمالي الكميات:</span>
              <span>${totalQuantity.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span>عدد الموظفين:</span>
              <span>${uniqueEmployees}</span>
            </div>
            <div class="summary-item">
              <span>عدد القطع:</span>
              <span>${uniqueItems}</span>
            </div>
          </div>
  
          <table>
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>الوظيفة</th>
                <th>اسم القطعة</th>
                <th>الكمية</th>
                <th>تاريخ التسليم</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDeliveries.map((item) => `
                <tr>
                  <td>${item.employee?.name || "غير محدد"}</td>
                  <td>${item.employee?.jobTitle || "غير محدد"}</td>
                  <td>${item.taskItem?.name || "غير محدد"}</td>
                  <td>${Number(item.quantity).toLocaleString()}</td>
                  <td>${new Date(item.date).toLocaleDateString("ar-EG")}</td>
                  <td>${item.notes || "-"}</td>
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

  // Columns for deliveries table
  const columns = [
    {
      title: "اسم الموظف",
      dataIndex: ["employee", "name"],
      key: "employeeName",
    },
    {
      title: "الوظيفة",
      dataIndex: ["employee", "jobTitle"],
      key: "jobTitle",
    },
    {
      title: "اسم القطعة",
      dataIndex: ["taskItem", "name"],
      key: "itemName",
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "تاريخ التسليم",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
      sorter: (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string) => notes || "-",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90vw] p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تقرير تسليم المهمات
          </DialogTitle>
        </DialogHeader>
        <Card>
          <div className="mt-4">
            <Form
              form={form}
              layout="vertical"
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Form.Item label="تصفية حسب الموظف" name="employee">
                <Select
                  placeholder="اختر الموظف"
                  allowClear
                  onChange={setEmployeeFilter}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  style={{ width: "100%" }}
                >
                  {employees.map((employee: any) => (
                    <Option key={employee.id} value={employee.id}>
                      {employee.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="تصفية حسب القطعة" name="taskItem">
                <Select
                  placeholder="اختر القطعة"
                  allowClear
                  onChange={setTaskItemFilter}
                  style={{ width: "100%" }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                >
                  {taskItems.map((item: any) => (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="تصفية حسب التاريخ" name="dateRange">
                <RangePicker
                  style={{ width: "100%" }}
                  onChange={(dates) =>
                    setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
                  }
                />
              </Form.Item>
            </Form>

            <div className="flex justify-end gap-2 mb-6">
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                طباعة
              </Button>
              {/* <Button icon={<DownloadOutlined />}>تصدير PDF</Button> */}
              <Button onClick={resetFilters}>إعادة ضبط</Button>
            </div>

            <Row gutter={16} className="mb-6">
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic title="عدد التسليمات" value={totalDeliveries} />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic title="إجمالي الكميات" value={totalQuantity} />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic title="عدد الموظفين" value={uniqueEmployees} />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic title="عدد القطع" value={uniqueItems} />
                </Card>
              </Col>
            </Row>

            <Divider orientation="right">نتائج التقرير</Divider>

            <div className="overflow-x-auto">
              {isDeliveriesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : filteredDeliveries.length > 0 ? (
                <Table
                  dataSource={filteredDeliveries}
                  columns={columns}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                  }}
                  scroll={{ x: 800, y: 400 }}
                  size="small"
                />
              ) : (
                <Empty description="لا توجد بيانات تطابق معايير التصفية" />
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
