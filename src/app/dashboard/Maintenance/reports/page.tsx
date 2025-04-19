"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button, Table, Select, Spin, Tag, Statistic, Input, DatePicker } from "antd";
import { Printer, BarChart2, PieChart } from "lucide-react";
import { SearchOutlined, FilterOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function MaintenanceReportsPage() {
  const [searchText, setSearchText] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const router = useRouter();

  // جلب بيانات الصيانة
  const { data: maintenance = [], isLoading } = useQuery({
    queryKey: ["maintenance", selectedDateRange],
    queryFn: async () => {
      const params: any = {};
      if (selectedDateRange) {
        params.startDate = selectedDateRange[0].format("YYYY-MM-DD");
        params.endDate = selectedDateRange[1].format("YYYY-MM-DD");
      }
      const response = await axios.get("/api/maintenance", { params });
      return response.data;
    },
  });

  // حساب إحصائيات الصيانة (الكميات)
  const statsData = {
    total: maintenance.reduce((sum: number, item: any) => sum + (item.pendingQuantity || item.equipment.quantity), 0),
    sent: maintenance.filter((item: any) => item.status === "sent").reduce((sum: number, item: any) => sum + (item.pendingQuantity || item.equipment.quantity), 0),
    returned: maintenance.filter((item: any) => item.status === "returned").reduce((sum: number, item: any) => sum + (item.returnedQuantity || 0), 0),
    broken: maintenance.filter((item: any) => item.status === "broken").reduce((sum: number, item: any) => sum + (item.brokenQuantity || 0), 0),
    fixed: maintenance.filter((item: any) => item.status === "fixed").reduce((sum: number, item: any) => sum + (item.returnedQuantity || 0), 0),
  };

  // تصفية سجلات الصيانة
  const filteredMaintenance = maintenance.filter((item: any) => {
    const matchesSearch =
      item.equipment.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.equipment.code.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = selectedStatus ? item.status === selectedStatus : true;

    return matchesSearch && matchesStatus;
  });

  // طباعة التقرير
  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير الصيانة</title>
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
            .filters {
              text-align: center;
              font-size: 13px;
              color: #7f8c8d;
              margin: 15px 0;
              font-style: italic;
            }
            .stats-container {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
              margin: 20px;
              padding: 15px;
              background: #ecf0f1;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .stat-box {
              padding: 15px;
              border-radius: 5px;
              text-align: center;
              background: #fff;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            .stat-title {
              font-size: 14px;
              color: #555;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
            }
            .sent { color: orange; }
            .returned { color: green; }
            .broken { color: red; }
            .fixed { color: blue; }
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
              .stats-container {
                background: #ecf0f1;
                -webkit-print-color-adjust: exact;
              }
              .stat-box {
                background: #fff;
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
  
            <h2>تقرير الصيانة</h2>
            <div class="filters">
              ${selectedStatus
          ? `الحالة: ${selectedStatus === "sent"
            ? "تم إرسالها للصيانة"
            : selectedStatus === "returned"
              ? "تم استلامها من الصيانة"
              : selectedStatus === "fixed"
                ? "تم إصلاحها"
                : "معطلة"
          }`
          : ""
        }
              ${selectedDateRange
          ? `<br>الفترة: من ${selectedDateRange[0].format(
            "YYYY-MM-DD"
          )} إلى ${selectedDateRange[1].format("YYYY-MM-DD")}`
          : ""
        }
            </div>
  
            <div class="stats-container">
              
                <span class="stat-title">إجمالي الكميات</span>
                <span>${statsData.total.toLocaleString()}</span>
              
              
                <span class="stat-title">كميات مرسلة</span>
                <span>${statsData.sent.toLocaleString()}</span>
             
              
            </div>
  
            <h2>تفاصيل الصيانة</h2>
            <table>
              <thead>
                <tr>
                  <th>المعدة</th>
                  <th>الكود</th>
                  <th>تاريخ الإرسال</th>
                  <th>الحالة</th>
                  <th>الكمية الكلية</th>
                  <th>الكمية الصالحة</th>
                  <th>الكمية التالفة</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${filteredMaintenance
          .map(
            (item: any) => `
                  <tr>
                    <td>${item.equipment?.name || "غير محدد"}</td>
                    <td>${item.equipment?.code || "غير محدد"}</td>
                    <td>${new Date(item.date).toLocaleDateString("ar-EG")}</td>
                    <td class="${item.status}">
                      ${item.status === "sent"
                ? "تم الإرسال"
                : item.status === "returned"
                  ? "تم الاستلام"
                  : item.status === "fixed"
                    ? "تم الإصلاح"
                    : "تالف"
              }
                    </td>
                    <td>${(item.pendingQuantity || item.equipment?.quantity || 0).toLocaleString()
              }</td>
                    <td>${(item.returnedQuantity || 0).toLocaleString()}</td>
                    <td>${(item.brokenQuantity || 0).toLocaleString()}</td>
                    <td>${item.notes || "-"}</td>
                  </tr>
                `
          )
          .join("")}
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
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        setIsPrinting(false);
      }, 500);
    } else {
      setIsPrinting(false);
    }
  };

  const columns = [
    {
      title: "المعدة",
      dataIndex: ["equipment", "name"],
      key: "name",
      render: (text: string, record: any) => (
        <span>
          {text} ({record.equipment.code})
        </span>
      ),
    },
    {
      title: "تاريخ الإرسال",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "sent" ? "orange" : status === "returned" ? "green" : status === "broken" ? "red" : "blue";
        const text = status === "sent" ? "تم الإرسال" : status === "returned" ? "تم الاستلام" : status === "broken" ? "تالف" : "تم الإصلاح";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "الكمية الكلية",
      dataIndex: "pendingQuantity",
      key: "pendingQuantity",
      render: (qty: number, record: any) => (
        <span>{qty || record.equipment.quantity}</span>
      ),
    },
    {
      title: "الكمية الصالحة",
      dataIndex: "returnedQuantity",
      key: "returnedQuantity",
      render: (qty: number) => qty || 0,
    },
    {
      title: "الكمية التالفة",
      dataIndex: "brokenQuantity",
      key: "brokenQuantity",
      render: (qty: number) => qty || 0,
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || "-",
    },
  ];

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">تقارير الصيانة</h1>
          <div className="flex space-x-2">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/dashboard/Maintenance')}
              className="ml-2"
            >
              العودة للصيانة
            </Button>
            <Button
              icon={<Printer />}
              onClick={handlePrint}
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
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => setSelectedStatus(value)}
              >
                <Option value="sent">تم إرسالها للصيانة</Option>
                <Option value="returned">تم استلامها من الصيانة</Option>
                <Option value="broken">معطلة</Option>
                <Option value="fixed">تم إصلاحها</Option>
              </Select>
            </div>
            <div className="flex-1 min-w-[250px]">
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => setSelectedDateRange(dates)}
                placeholder={["تاريخ البداية", "تاريخ النهاية"]}
              />
            </div>
          </div>
        </div>

        {/* إحصائيات */}
        {/* <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <Statistic
              title="إجمالي كميات المعدات"
              value={statsData.total}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <Statistic
              title="كميات مرسلة للصيانة"
              value={statsData.sent}
              valueStyle={{ color: 'orange' }}
            />
          </Card>
          <Card className="bg-green-50 border-green-200">
            <Statistic
              title="كميات تم إصلاحها"
              value={statsData.fixed}
              valueStyle={{ color: 'green' }}
            />
          </Card>
          <Card className="bg-red-50 border-red-200">
            <Statistic
              title="كميات معطلة"
              value={statsData.broken}
              valueStyle={{ color: 'red' }}
            />
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <Statistic
              title="كميات تم استلامها"
              value={statsData.returned}
              valueStyle={{ color: 'blue' }}
            />
          </Card>
        </div>
         */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredMaintenance}
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