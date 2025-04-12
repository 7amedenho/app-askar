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
            body { font-family: 'Cairo', sans-serif; margin: 20px; }
            h1, h2 { text-align: center; margin-bottom: 20px; }
            .header { margin-bottom: 30px; text-align: center; }
            .stats-container { display: flex; justify-content: space-between; margin-bottom: 30px; text-align: center; }
            .stat-box { border: 1px solid #ddd; border-radius: 5px; padding: 15px; width: 18%; }
            .stat-title { font-size: 14px; color: #555; margin-bottom: 5px; }
            .stat-value { font-size: 20px; font-weight: bold; }
            .sent { color: orange; }
            .returned { color: green; }
            .broken { color: red; }
            .fixed { color: blue; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير الصيانة</h1>
            ${selectedStatus
          ? `<p>الحالة: ${selectedStatus === "sent" ? "تم إرسالها للصيانة" :
            selectedStatus === "returned" ? "تم استلامها من الصيانة" :
              selectedStatus === "fixed" ? "تم إصلاحها" : "معطلة"
          }</p>`
          : ''
        }
            ${selectedDateRange
          ? `<p>الفترة: من ${selectedDateRange[0].format('YYYY-MM-DD')} إلى ${selectedDateRange[1].format('YYYY-MM-DD')}</p>`
          : ''
        }
          </div>
          
          <div class="stats-container">
            <div class="stat-box">
              <div class="stat-title">إجمالي الكميات</div>
              <div class="stat-value">${statsData.total}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">كميات مرسلة</div>
              <div class="stat-value sent">${statsData.sent}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">كميات مستلمة</div>
              <div class="stat-value returned">${statsData.returned}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">كميات معطلة</div>
              <div class="stat-value broken">${statsData.broken}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">كميات مصلحة</div>
              <div class="stat-value fixed">${statsData.fixed}</div>
            </div>
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
              ${filteredMaintenance.map((item: any) => `
                <tr>
                  <td>${item.equipment.name}</td>
                  <td>${item.equipment.code}</td>
                  <td>${new Date(item.date).toLocaleDateString('ar-EG')}</td>
                  <td class="${item.status}">
                    ${item.status === "sent" ? "تم الإرسال" :
            item.status === "returned" ? "تم الاستلام" :
              item.status === "fixed" ? "تم الإصلاح" : "تالف"}
                  </td>
                  <td>${item.pendingQuantity || item.equipment.quantity}</td>
                  <td>${item.returnedQuantity || 0}</td>
                  <td>${item.brokenQuantity || 0}</td>
                  <td>${item.notes || '-'}</td>
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