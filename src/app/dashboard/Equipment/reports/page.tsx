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
    available: equipment.filter((item: any) => item.status === "available").reduce((sum: number, item: any) => sum + item.quantity, 0),
    underMaintenance: equipment.filter((item: any) => item.status === "under_maintenance").reduce((sum: number, item: any) => sum + item.quantity, 0),
    broken: equipment.filter((item: any) => item.status === "broken").reduce((sum: number, item: any) => sum + item.quantity, 0),
  };

  // تصفية المعدات حسب البحث والتصفية
  const filteredEquipment = equipment.filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchText.toLowerCase()));

    const matchesStatus = selectedStatus ? item.status === selectedStatus : true;

    const matchesSupplier = selectedSupplier ? item.supplier.id === parseInt(selectedSupplier) : true;

    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير المعدات</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; margin: 20px; }
            h1, h2 { text-align: center; margin-bottom: 20px; }
            .header { margin-bottom: 30px; text-align: center; }
            .stats-container { display: flex; justify-content: space-between; margin-bottom: 30px; text-align: center; }
            .stat-box { border: 1px solid #ddd; border-radius: 5px; padding: 15px; width: 22%; }
            .stat-title { font-size: 14px; color: #555; margin-bottom: 5px; }
            .stat-value { font-size: 20px; font-weight: bold; }
            .available { color: green; }
            .under_maintenance { color: orange; }
            .broken { color: red; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير المعدات</h1>
            ${selectedStatus
          ? `<p>الحالة: ${selectedStatus === "available" ? "متاح" :
            selectedStatus === "under_maintenance" ? "تحت الصيانة" : "تالف"
          }</p>`
          : ''
        }
            ${selectedSupplier
          ? `<p>المورد: ${suppliers.find((s: any) => s.id === parseInt(selectedSupplier))?.name || ''}</p>`
          : ''
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
              <div class="stat-value under_maintenance">${statsData.underMaintenance}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">تالفة</div>
              <div class="stat-value broken">${statsData.broken}</div>
            </div>
          </div>
          
          <h2>تفاصيل المعدات</h2>
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
              ${filteredEquipment.map((item: any) => `
                <tr>
                  <td>${item.code}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.brand || '-'}</td>
                  <td>${item.supplier.name}</td>
                  <td class="${item.status}">
                    ${item.status === "available" ? "متاح" :
            item.status === "under_maintenance" ? "تحت الصيانة" : "تالف"}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; text-align: center; color: #777;">
            تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
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
        const color = status === "available" ? "green" : status === "under_maintenance" ? "orange" : "red";
        const text = status === "available" ? "متاح" : status === "under_maintenance" ? "تحت الصيانة" : "تالف";
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
              onClick={() => router.push('/dashboard/Equipment')}
              className="ml-2"
            >
              العودة للمعدات
            </Button>
            <Button
              icon={<Printer />}
              onClick={() => {
                setIsPrinting(true);
                setTimeout(() => {
                  window.print();
                  setIsPrinting(false);
                }, 500);
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
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
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
        <div className="grid grid-cols-4 gap-4 mb-6">
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
        </div>

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