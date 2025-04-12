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
import { Button, Table, Select, DatePicker, Form, Card, Statistic, Row, Col, Divider, Empty } from "antd";
import { FilePdfOutlined, PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface DeliveryReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function DeliveryReport({ isOpen, onClose }: DeliveryReportProps) {
  const [form] = Form.useForm();
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);
  const [taskItemFilter, setTaskItemFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Fetch all task deliveries
  const { data: deliveries = [], isLoading: isDeliveriesLoading } = useQuery({
    queryKey: ["taskDeliveries"],
    queryFn: async () => {
      const response = await axios.get("/api/tasks/deliveries");
      return response.data;
    },
    enabled: isOpen
  });

  // Fetch all employees for filter
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axios.get("/api/employees");
      return response.data;
    },
    enabled: isOpen
  });

  // Fetch all task items for filter
  const { data: taskItems = [] } = useQuery({
    queryKey: ["taskItems"],
    queryFn: async () => {
      const response = await axios.get("/api/tasks");
      return response.data;
    },
    enabled: isOpen
  });

  // Apply filters
  useEffect(() => {
    let filtered = [...deliveries];

    if (employeeFilter) {
      filtered = filtered.filter(item => item.employeeId === employeeFilter);
    }

    if (taskItemFilter) {
      filtered = filtered.filter(item => item.taskItemId === taskItemFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day').toDate();
      const endDate = dateRange[1].endOf('day').toDate();

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, employeeFilter, taskItemFilter, dateRange]);

  // Calculate statistics
  const totalDeliveries = filteredDeliveries.length;
  const totalQuantity = filteredDeliveries.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueEmployees = new Set(filteredDeliveries.map(item => item.employeeId)).size;
  const uniqueItems = new Set(filteredDeliveries.map(item => item.taskItemId)).size;

  // Reset filters
  const resetFilters = () => {
    form.resetFields();
    setEmployeeFilter(null);
    setTaskItemFilter(null);
    setDateRange(null);
  };

  // Handle print function
  const handlePrint = () => {
    window.print();
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
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string) => notes || "-"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90vw] p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تقرير تسليم المهمات
          </DialogTitle>
        </DialogHeader>
        <Card><div className="mt-4">
          <Form form={form} layout="vertical" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item label="تصفية حسب الموظف" name="employee">
              <Select
                placeholder="اختر الموظف"
                allowClear
                onChange={setEmployeeFilter}
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              />
            </Form.Item>
          </Form>

          <div className="flex justify-end gap-2 mb-6">
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              طباعة
            </Button>
            <Button icon={<DownloadOutlined />}>
              تصدير PDF
            </Button>
            <Button onClick={resetFilters}>
              إعادة ضبط
            </Button>
          </div>

          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="عدد التسليمات"
                  value={totalDeliveries}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="إجمالي الكميات"
                  value={totalQuantity}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="عدد الموظفين"
                  value={uniqueEmployees}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="عدد القطع"
                  value={uniqueItems}
                />
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