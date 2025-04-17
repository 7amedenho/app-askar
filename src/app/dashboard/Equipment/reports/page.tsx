"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/card";
import {
  Button,
  Table,
  Select,
  Spin,
  Tag,
  Statistic,
  Input,
  DatePicker,
} from "antd";
import { Printer, BarChart2, PieChart } from "lucide-react";
import {
  SearchOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Option } = Select;

export default function EquipmentReportsPage() {
  const [searchText, setSearchText] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const router = useRouter();

  // جلب بيانات المعدات
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const response = await axios.get("/api/equipment");
      return response.data;
    },
  });

  // جلب بيانات الموردين
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axios.get("/api/suppliers");
      return response.data;
    },
  });

  // حساب إحصائيات المعدات
  const statsData = {
    total: equipment.reduce((sum: number, item: any) => sum + item.quantity, 0),
    available: equipment
      .filter((item: any) => item.status === "available")
      .reduce((sum: number, item: any) => sum + item.quantity, 0),
    underMaintenance: equipment
      .filter((item: any) => item.status === "under_maintenance")
      .reduce((sum: number, item: any) => sum + item.quantity, 0),
    broken: equipment
      .filter((item: any) => item.status === "broken")
      .reduce((sum: number, item: any) => sum + item.quantity, 0),
  };

  // تصفية المعدات حسب البحث والتصفية
  const filteredEquipment = equipment.filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.brand &&
        item.brand.toLowerCase().includes(searchText.toLowerCase()));

    const matchesStatus = selectedStatus
      ? item.status === selectedStatus
      : true;

    const matchesSupplier = selectedSupplier
      ? item.supplier.id === parseInt(selectedSupplier)
      : true;

    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>تقرير المعدات - عسكر للمقاولات العمومية</title>
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
      .filters {
        text-align: center;
        font-size: 16px;
        margin-top: -10px;
      }
      .stats-container {
        display: flex;
        justify-content: space-between;
        margin: 20px 30px;
        text-align: center;
      }
      .stat-box {
        flex: 1;
        background: #ecf0f1;
        margin: 0 10px;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid #bdc3c7;
      }
      .stat-title {
        font-size: 14px;
        margin-bottom: 5px;
        color: #2c3e50;
      }
      .stat-value {
        font-size: 20px;
        font-weight: 700;
      }
      .available { color: green; }
      .under_maintenance { color: orange; }
      .broken { color: red; }

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

      <h2>تقرير المعدات</h2>

      <div class="filters">
        ${
          selectedStatus
            ? `<p>الحالة: ${
                selectedStatus === "available"
                  ? "متاح"
                  : selectedStatus === "under_maintenance"
                  ? "تحت الصيانة"
                  : "تالف"
              }</p>`
            : ""
        }
        ${
          selectedSupplier
            ? `<p>المورد: ${
                suppliers?.find((s: any) => s.id === parseInt(selectedSupplier))
                  ?.name || ""
              }</p>`
            : ""
        }
      </div>

      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-title">إجمالي المعدات</div>
          <div class="stat-value">${statsData.total}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">المعدات المتاحة</div>
          <div class="stat-value available">${statsData.available}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">تحت الصيانة</div>
          <div class="stat-value under_maintenance">${
            statsData.underMaintenance
          }</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">المعدات التالفة</div>
          <div class="stat-value broken">${statsData.broken}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>الكود</th>
            <th>الاسم</th>
            <th>الكمية</th>
            <th>الماركة</th>
            <th>المورد</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${filteredEquipment
            .map(
              (item: any) => `
              <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.brand || "-"}</td>
                <td>${item.supplier?.name || "-"}</td>
                <td class="${item.status}">
                  ${
                    item.status === "available"
                      ? "متاح"
                      : item.status === "under_maintenance"
                      ? "تحت الصيانة"
                      : "تالف"
                  }
                </td>
              </tr>
            `
            )
            .join("")}
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
      `);
      printWindow.document.close();
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
      setTimeout(() => printWindow.close(), 10000);
    }
  };

  const columns = [
    {
      title: "الكود",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "الماركة",
      dataIndex: "brand",
      key: "brand",
      render: (brand: string) => brand || "-",
    },
    {
      title: "المورد",
      dataIndex: ["supplier", "name"],
      key: "supplier",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "available"
            ? "green"
            : status === "under_maintenance"
            ? "orange"
            : "red";
        const text =
          status === "available"
            ? "متاح"
            : status === "under_maintenance"
            ? "تحت الصيانة"
            : "تالف";
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">تقارير المعدات</h1>
          <div className="flex space-x-2">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/dashboard/Equipment")}
              className="ml-2"
            >
              العودة للمعدات
            </Button>
            <Button
              icon={<Printer />}
              onClick={() => {
                handlePrint();
              }}
              loading={isPrinting}
            >
              طباعة التقرير
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="بحث عن معدة..."
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select
                placeholder="اختر الحالة"
                style={{ width: "100%" }}
                allowClear
                onChange={(value) => setSelectedStatus(value)}
              >
                <Option value="available">متاح</Option>
                <Option value="under_maintenance">تحت الصيانة</Option>
                <Option value="broken">تالف</Option>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select
                placeholder="اختر المورد"
                style={{ width: "100%" }}
                allowClear
                onChange={(value) => setSelectedSupplier(value)}
                loading={isLoadingSuppliers}
              >
                {suppliers.map((item: any) => (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* إحصائيات */}
        {/* <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <Statistic
              title="إجمالي كميات المعدات"
              value={statsData.total}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
          <Card className="bg-green-50 border-green-200">
            <Statistic
              title="كميات المعدات المتاحة"
              value={statsData.available}
              valueStyle={{ color: 'green' }}
            />
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <Statistic
              title="كميات تحت الصيانة"
              value={statsData.underMaintenance}
              valueStyle={{ color: 'orange' }}
            />
          </Card>
          <Card className="bg-red-50 border-red-200">
            <Statistic
              title="كميات المعدات التالفة"
              value={statsData.broken}
              valueStyle={{ color: 'red' }}
            />
          </Card>
        </div> */}

        <Card>
          {isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredEquipment}
              pagination={{ pageSize: 10 }}
              className="shadow-md rounded-lg"
              bordered
              rowKey="id"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
