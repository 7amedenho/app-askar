"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Alert,
  Badge,
  Statistic,
  Progress,
  Spin,
  Tooltip,
  Table,
  Tag,
  Tabs,
  Typography,
  Button,
  Space,
  Skeleton,
  Empty
} from "antd";
import {
  AlertCircle,
  Users,
  Package,
  Wrench,
  Wallet,
  Box,
  Building,
  Construction,
  Calendar,
  Clock,
  AlertTriangle,
  Bell
} from "lucide-react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import Link from "next/link";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

// Dynamically import ApexCharts (client-side only)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Dashboard() {
  // State for current date
  const [currentDate] = useState<Date>(new Date());

  // Fetch employees data
  const {
    data: employees = [],
    isLoading: isEmployeesLoading
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axios.get("/api/employees");
      return response.data;
    }
  });

  // Fetch attendance data
  const {
    data: attendance = [],
    isLoading: isAttendanceLoading
  } = useQuery({
    queryKey: ["recent-attendance"],
    queryFn: async () => {
      const response = await axios.get("/api/attendance/recent");
      return response.data;
    }
  });

  // Fetch consumables data
  const {
    data: consumables = [],
    isLoading: isConsumablesLoading
  } = useQuery({
    queryKey: ["consumables"],
    queryFn: async () => {
      const response = await axios.get("/api/consumables");
      return response.data;
    }
  });

  // Fetch equipment data
  const {
    data: equipment = [],
    isLoading: isEquipmentLoading
  } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const response = await axios.get("/api/equipment");
      return response.data;
    }
  });

  // Fetch custody data
  const {
    data: custodies = [],
    isLoading: isCustodiesLoading
  } = useQuery({
    queryKey: ["custodies"],
    queryFn: async () => {
      const response = await axios.get("/api/custody");
      return response.data;
    }
  });

  // Fetch projects data
  const {
    data: projects = [],
    isLoading: isProjectsLoading
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await axios.get("/api/projects");
      return response.data;
    }
  });

  // Fetch expenses data
  const {
    data: expenses = [],
    isLoading: isExpensesLoading
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await axios.get("/api/expenses");
      return response.data;
    }
  });

  // Fetch supplier invoices data
  const {
    data: invoices = [],
    isLoading: isInvoicesLoading
  } = useQuery({
    queryKey: ["supplier-invoices"],
    queryFn: async () => {
      const response = await axios.get("/api/invoices");
      return response.data;
    }
  });

  // Calculate data when available (otherwise empty arrays for safety)
  const lowStockConsumables = !isConsumablesLoading ?
    consumables.filter((item: any) => item.stock < 10) : [];

  const lowBudgetCustodies = !isCustodiesLoading ?
    custodies.filter((custody: any) => {
      const percentRemaining = (custody.remaining / custody.budget) * 100;
      return percentRemaining < 20;
    }) : [];

  const maintenanceEquipment = !isEquipmentLoading ?
    equipment.filter((item: any) => item.status === "under_maintenance") : [];

  const activeProjects = !isProjectsLoading ?
    projects.filter((project: any) => project.status === "active") : [];

  const nearDeadlineProjects = !isProjectsLoading ?
    activeProjects.filter((project: any) => {
      if (!project.endDate) return false;
      const endDate = new Date(project.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 14;
    }) : [];

  const unpaidInvoices = !isInvoicesLoading ?
    invoices.filter((invoice: any) =>
      invoice.status === "pending" || invoice.status === "partially_paid"
    ) : [];

  // Calculate expense charts data only when expenses are loaded
  const { monthlyExpenses, sortedMonths, expensesByType } = !isExpensesLoading ?
    calculateExpenseData(expenses) : { monthlyExpenses: {}, sortedMonths: [], expensesByType: {} };

  // Expense chart options and series
  const expenseChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: {
        show: true,
      },
      fontFamily: 'Alexandria, Cairo, sans-serif',
    },
    title: {
      text: 'مصروفات الشهور الأخيرة',
      align: 'center',
    },
    xaxis: {
      categories: sortedMonths.map(([month]) => month),
    },
    yaxis: {
      title: {
        text: 'المبلغ (جنيه)',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toLocaleString(),
    },
    colors: ['#1890ff'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.3,
        opacityFrom: 0.7,
        opacityTo: 0.2,
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} جنيه`,
      },
    },
  };

  const expenseChartSeries = [
    {
      name: 'إجمالي المصروفات',
      data: sortedMonths.map(([_, amount]) => amount),
    },
  ];

  // Expense type chart options
  const expenseTypeChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
    },
    labels: Object.keys(expensesByType),
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} جنيه`,
      },
    },
    title: {
      text: 'توزيع المصروفات حسب النوع',
      align: 'center',
    },
    colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const expenseTypeSeries = Object.values(expensesByType);

  // Table columns for recent expenses
  const expensesColumns = [
    {
      title: 'الوصف',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `${Number(amount).toLocaleString()} جنيه`,
    },
    {
      title: 'النوع',
      dataIndex: 'expenseType',
      key: 'expenseType',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ar-EG'),
    },
  ];

  // Table columns for low stock consumables
  const consumablesColumns = [
    {
      title: 'اسم الصنف',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'الماركة',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand: string) => brand || '-',
    },
    {
      title: 'الوحدة',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'المخزون',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock < 5 ? 'error' : 'warning'}>{stock}</Tag>
      ),
    },
  ];

  // Table columns for upcoming project deadlines
  const projectsColumns = [
    {
      title: 'اسم المشروع',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'مدير المشروع',
      dataIndex: 'managerName',
      key: 'managerName',
    },
    {
      title: 'تاريخ الانتهاء',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString('ar-EG'),
    },
    {
      title: 'الأيام المتبقية',
      key: 'daysRemaining',
      render: (_: any, record: any) => {
        const endDate = new Date(record.endDate);
        const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        let color = 'green';
        if (daysRemaining <= 7) color = 'red';
        else if (daysRemaining <= 14) color = 'orange';

        return <Tag color={color}>{daysRemaining} يوم</Tag>;
      },
    },
  ];

  // Table columns for recent attendance
  const attendanceColumns = [
    {
      title: 'الموظف',
      dataIndex: ['employee', 'name'],
      key: 'employeeName',
    },
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ar-EG'),
    },
    {
      title: 'وقت الحضور',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time: string) => new Date(time).toLocaleTimeString('ar-EG'),
    },
    {
      title: 'وقت الانصراف',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time: string) => time ? new Date(time).toLocaleTimeString('ar-EG') : '-',
    },
    {
      title: 'ساعات إضافية',
      dataIndex: 'overtimeHours',
      key: 'overtimeHours',
      render: (hours: number) => hours ? `${hours} ساعة` : '-',
    },
  ];

  return (
    <div className="container p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="mb-0">لوحة التحكم</Title>
        {/* <Button type="primary" href="/dashboard" icon={<Bell />}>
          مركز الإشعارات
        </Button> */}
      </div>

      {/* Critical Alerts Section - Only show when data is loaded */}
      <div className="mb-6 space-y-3">
        {isConsumablesLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : lowStockConsumables.length > 0 && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-bold">تنبيه: مستهلكات منخفضة المخزون</span>
              </div>
            }
            description={`يوجد ${lowStockConsumables.length} من المستهلكات على وشك النفاذ وتحتاج إلى إعادة الطلب.`}
            type="warning"
            showIcon={false}
            action={
              <Button type="link" href="/dashboard/Consumables">
                فحص المستهلكات
              </Button>
            }
          />
        )}

        {isCustodiesLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : lowBudgetCustodies.length > 0 && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-bold">تنبيه: عهد منخفضة الميزانية</span>
              </div>
            }
            description={`يوجد ${lowBudgetCustodies.length} من العهد بها أقل من 20% من الميزانية المتبقية.`}
            type="error"
            showIcon={false}
            action={
              <Button type="link" href="/dashboard/Custody">
                فحص العهد
              </Button>
            }
          />
        )}

        {isProjectsLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : nearDeadlineProjects.length > 0 && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-bold">تنبيه: مشاريع تقترب من الموعد النهائي</span>
              </div>
            }
            description={`يوجد ${nearDeadlineProjects.length} من المشاريع تقترب من موعد التسليم النهائي خلال 14 يوم.`}
            type="warning"
            showIcon={false}
            action={
              <Button type="link" href="/dashboard/Projects">
                فحص المشاريع
              </Button>
            }
          />
        )}

        {/* {isInvoicesLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : unpaidInvoices.length > 0 && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="font-bold">تنبيه: فواتير غير مدفوعة</span>
              </div>
            }
            description={`يوجد ${unpaidInvoices.length} من الفواتير غير مدفوعة أو مدفوعة جزئياً.`}
            type="info"
            showIcon={false}
            action={
              <Button type="link" href="/dashboard/Suppliers">
                فحص الفواتير
              </Button>
            }
          />
        )} */}

        {isEquipmentLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : maintenanceEquipment.length > 0 && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <span className="font-bold">معدات تحت الصيانة</span>
              </div>
            }
            description={`يوجد ${maintenanceEquipment.length} من المعدات حالياً تحت الصيانة.`}
            type="info"
            showIcon={false}
            action={
              <Button type="link" href="/dashboard/Maintenance">
                فحص الصيانة
              </Button>
            }
          />
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>الموظفين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEmployeesLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  value={employees.length}
                  suffix="موظف"
                  valueStyle={{ color: '#1890ff', fontSize: '1.5rem' }}
                />
                <div className="mt-2">
                  <Link href="/dashboard/Employees" className="text-sm text-blue-500 hover:underline">
                    عرض الكل
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <span>المستهلكات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isConsumablesLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  value={consumables.length}
                  suffix="صنف"
                  valueStyle={{ color: '#52c41a', fontSize: '1.5rem' }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <Link href="/dashboard/Consumables" className="text-sm text-blue-500 hover:underline">
                    عرض الكل
                  </Link>
                  {lowStockConsumables.length > 0 && (
                    <Badge count={lowStockConsumables.length} overflowCount={9} color="warning" />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" />
              <span>المعدات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEquipmentLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  value={equipment.length}
                  suffix="معدة"
                  valueStyle={{ color: '#faad14', fontSize: '1.5rem' }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <Link href="/dashboard/Equipment" className="text-sm text-blue-500 hover:underline">
                    عرض الكل
                  </Link>
                  {maintenanceEquipment.length > 0 && (
                    <Badge count={maintenanceEquipment.length} overflowCount={9} color="processing" />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-500" />
              <span>المشاريع</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isProjectsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  value={activeProjects.length}
                  suffix="مشروع نشط"
                  valueStyle={{ color: '#722ed1', fontSize: '1.5rem' }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <Link href="/dashboard/Projects" className="text-sm text-blue-500 hover:underline">
                    عرض الكل
                  </Link>
                  {nearDeadlineProjects.length > 0 && (
                    <Badge count={nearDeadlineProjects.length} overflowCount={9} color="error" />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>مصروفات الشهور الأخيرة</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isExpensesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton.Image active className="w-full h-64" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <Empty description="لا توجد بيانات مصروفات متاحة" />
              </div>
            ) : (
              <Chart
                options={expenseChartOptions}
                series={expenseChartSeries}
                type="area"
                height="100%"
              />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>توزيع المصروفات حسب النوع</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isExpensesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton.Image active className="w-full h-64" />
              </div>
            ) : Object.keys(expensesByType).length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <Empty description="لا توجد بيانات مصروفات متاحة" />
              </div>
            ) : (
              <Chart
                options={expenseTypeChartOptions}
                series={expenseTypeSeries}
                type="donut"
                height="100%"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Tables Section */}
      <div className="mb-8">
        <Card className="shadow-md">
          <Tabs defaultActiveKey="1" size="large" className="p-4">
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  مستهلكات منخفضة المخزون
                  {!isConsumablesLoading && lowStockConsumables.length > 0 && (
                    <Badge count={lowStockConsumables.length} color="warning" />
                  )}
                </span>
              }
              key="1"
            >
              <div className="p-2">
                {isConsumablesLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <Table
                    dataSource={lowStockConsumables}
                    columns={consumablesColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                    locale={{ emptyText: "لا توجد مستهلكات منخفضة" }}
                  />
                )}

                <div className="mt-4 text-left">
                  <Button type="primary" href="/dashboard/Consumables">
                    إدارة المستهلكات
                  </Button>
                </div>
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  مشاريع قرب الموعد النهائي
                  {!isProjectsLoading && nearDeadlineProjects.length > 0 && (
                    <Badge count={nearDeadlineProjects.length} color="error" />
                  )}
                </span>
              }
              key="2"
            >
              <div className="p-2">
                {isProjectsLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <Table
                    dataSource={nearDeadlineProjects}
                    columns={projectsColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                    locale={{ emptyText: "لا توجد مشاريع قرب الموعد النهائي" }}
                  />
                )}

                <div className="mt-4 text-left">
                  <Button type="primary" href="/dashboard/Projects">
                    إدارة المشاريع
                  </Button>
                </div>
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  أحدث المصروفات
                </span>
              }
              key="3"
            >
              <div className="p-2">
                {isExpensesLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <Table
                    dataSource={expenses.slice(0, 10)}
                    columns={expensesColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                    locale={{ emptyText: "لا توجد مصروفات" }}
                  />
                )}

                <div className="mt-4 text-left">
                  <Button type="primary" href="/dashboard/Expenses">
                    إدارة المصروفات
                  </Button>
                </div>
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  سجل الحضور الأخير
                </span>
              }
              key="4"
            >
              <div className="p-2">
                {isAttendanceLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <Table
                    dataSource={attendance.slice(0, 10)}
                    columns={attendanceColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                    locale={{ emptyText: "لا توجد سجلات حضور" }}
                  />
                )}

                <div className="mt-4 text-left">
                  <Button type="primary" href="/dashboard/Attendance">
                    إدارة الحضور
                  </Button>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>

      {/* Budget & Custody Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <span>حالة العهد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCustodiesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} active paragraph={{ rows: 1 }} />
                ))}
              </div>
            ) : custodies.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                لا توجد عهد مسجلة
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-auto">
                {custodies.slice(0, 5).map((custody: any) => {
                  const percentRemaining = Math.round((custody.remaining / custody.budget) * 100);
                  let statusColor = "success";

                  if (percentRemaining < 20) statusColor = "exception";
                  else if (percentRemaining < 50) statusColor = "warning";

                  return (
                    <div key={custody.id} className="border-b pb-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{custody.name}</span>
                        <Tag color={
                          percentRemaining < 20 ? "red" :
                            percentRemaining < 50 ? "orange" :
                              "green"
                        }>
                          {percentRemaining}%
                        </Tag>
                      </div>
                      <div className="flex justify-between mb-1 text-sm text-gray-500">
                        <span>كود: {custody.code}</span>
                        <span>
                          {custody.remaining.toLocaleString()} / {custody.budget.toLocaleString()} جنيه
                        </span>
                      </div>
                      <Progress
                        percent={percentRemaining}
                        status={statusColor as any}
                        size="small"
                        strokeColor={
                          percentRemaining < 20 ? "#f5222d" :
                            percentRemaining < 50 ? "#faad14" :
                              "#52c41a"
                        }
                      />
                    </div>
                  );
                })}
                <div className="text-left pt-2">
                  <Button type="link" href="/dashboard/Custody" className="pr-0">
                    عرض كل العهد
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" />
              <span>المعدات تحت الصيانة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEquipmentLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} active paragraph={{ rows: 1 }} />
                ))}
              </div>
            ) : maintenanceEquipment.length === 0 ? (
              <div className="text-center p-4 text-green-500">
                جميع المعدات متاحة حالياً
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto">
                {maintenanceEquipment.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.brand && <span className="text-xs text-gray-500 block">{item.brand}</span>}
                      <div className="text-xs text-gray-500">كود: {item.code}</div>
                    </div>
                    <Space>
                      <Badge status="processing" text="تحت الصيانة" />
                      <div className="text-sm">{item.quantity} قطعة</div>
                    </Space>
                  </div>
                ))}
                <div className="text-left pt-2">
                  <Button type="link" href="/dashboard/Maintenance" className="pr-0">
                    عرض تفاصيل الصيانة
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to calculate expense data
function calculateExpenseData(expenses: any[]) {
  // Calculate monthly expenses
  const monthlyExpenses = expenses.reduce((acc: Record<string, number>, expense: any) => {
    const date = new Date(expense.date);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

    if (!acc[monthYear]) {
      acc[monthYear] = 0;
    }

    acc[monthYear] += Number(expense.amount);
    return acc;
  }, {});

  // Sort months for the chart
  const sortedMonths = Object.entries(monthlyExpenses).sort((a, b) => {
    const [monthA, yearA] = a[0].split('/').map(Number);
    const [monthB, yearB] = b[0].split('/').map(Number);

    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });

  // Prepare expense distribution by type
  const expensesByType = expenses.reduce((acc: Record<string, number>, expense: any) => {
    if (!acc[expense.expenseType]) {
      acc[expense.expenseType] = 0;
    }

    acc[expense.expenseType] += Number(expense.amount);
    return acc;
  }, {});

  return { monthlyExpenses, sortedMonths, expensesByType };
}
