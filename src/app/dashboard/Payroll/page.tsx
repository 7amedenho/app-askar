"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Button,
  Input,
  Modal,
  Select,
  Table,
  Skeleton,
  DatePicker,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FinancialChart } from "@/components/ui/cyrclechart";
import dynamic from "next/dynamic";
import { DollarSign, PlusCircle, FileText, Search } from "lucide-react";
import NewPayroll from "./NewPayroll";
import NewAdvance from "./NewAdvance";
import NewDeduction from "./NewDeduction";
import NewBonus from "./NewBonus";
import TransactionHistory from "./TransactionHistory";
import EmployeeReport from "./EmployeeReport";
import moment from "moment";
import { ApexOptions } from "apexcharts";

const { Option } = Select;
const { RangePicker } = DatePicker;

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Custody {
  id: string;
  name: string;
  code: string;
  company: string;
  budget: number;
  remaining: number;
}

interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  dailySalary: number;
  budget: number;
}

interface Payroll {
  id: string;
  netSalary: number;
  paidAmount: number;
}

interface Advance {
  id: string;
  amount: number;
}

interface Deduction {
  id: string;
  amount: number;
}

interface Bonus {
  id: string;
  amount: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function PayrollPage() {
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState<boolean>(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState<boolean>(false);
  const [isDeductionModalOpen, setIsDeductionModalOpen] =
    useState<boolean>(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [dateRange, setDateRange] = useState<
    [moment.Moment | null, moment.Moment | null] | null
  >(null);
  const [darkMode, setDarkMode] = useState<boolean>(false); // حالة الدارك مود
  const queryClient = useQueryClient();

  // التحقق من تفضيلات المستخدم للدارك مود عند التحميل
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setDarkMode(prefersDark);
  }, []);

  const fetchData = async <T,>(endpoint: string): Promise<T[]> => {
    try {
      const res = await axios.get(`/api/${endpoint}`);
      return res.data || [];
    } catch (error) {
      toast.error(`فشل في جلب ${endpoint}`);
      return [];
    }
  };

  const { data: custodies = [], isLoading: custodiesLoading } = useQuery<
    Custody[]
  >({
    queryKey: ["custodies"],
    queryFn: () => fetchData<Custody>("custodies"),
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<
    Employee[]
  >({
    queryKey: ["employees"],
    queryFn: () => fetchData<Employee>("employees"),
  });

  const { data: payrolls = [], isLoading: payrollsLoading } = useQuery<
    Payroll[]
  >({
    queryKey: ["payrolls", dateRange],
    queryFn: () => fetchData<Payroll>("payroll"),
  });

  const { data: advances = [], isLoading: advancesLoading } = useQuery<
    Advance[]
  >({
    queryKey: ["advances", dateRange],
    queryFn: () => fetchData<Advance>("advances"),
  });

  const { data: deductions = [], isLoading: deductionsLoading } = useQuery<
    Deduction[]
  >({
    queryKey: ["deductions", dateRange],
    queryFn: () => fetchData<Deduction>("deductions"),
  });

  const { data: bonuses = [], isLoading: bonusesLoading } = useQuery<Bonus[]>({
    queryKey: ["bonuses", dateRange],
    queryFn: () => fetchData<Bonus>("bonuses"),
  });

  const totalPayroll = payrolls.reduce(
    (sum, payroll) => sum + Number(payroll.paidAmount || 0),
    0
  );
  const totalAdvances = advances.reduce(
    (sum, advance) => sum + Number(advance.amount || 0),
    0
  );
  const totalDeductions = deductions.reduce(
    (sum, deduction) => sum + Number(deduction.amount || 0),
    0
  );
  const totalBonuses = bonuses.reduce(
    (sum, bonus) => sum + Number(bonus.amount || 0),
    0
  );

  const chartData: ChartData[] = [
    { name: "المرتبات", value: totalPayroll, color: "#0088FE" },
    { name: "السلف", value: totalAdvances, color: "#00C49F" },
    { name: "الخصومات", value: totalDeductions, color: "#FFBB28" },
    { name: "المكافآت", value: totalBonuses, color: "#FF8042" },
  ];

  const areaChartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: "100%",
      toolbar: { show: false },
      background: "transparent",
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: chartData.map((item) => item.name),
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    colors: chartData.map((item) => item.color),
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
  };

  const areaChartSeries = [
    { name: "القيمة", data: chartData.map((item) => item.value) },
  ];

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: "الاسم", dataIndex: "name", key: "name" },
    { title: "الوظيفة", dataIndex: "jobTitle", key: "jobTitle" },
    {
      title: "الراتب اليومي",
      dataIndex: "dailySalary",
      key: "dailySalary",
      render: (text: number) => `${text.toLocaleString()} ج.م`,
    },
    {
      title: "الرصيد",
      dataIndex: "budget",
      key: "budget",
      render: (text: number) => `${text.toLocaleString()} ج.م`,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: unknown, record: Employee) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedEmployee(record);
            setIsReportModalOpen(true);
          }}
        >
          كشف حساب
        </Button>
      ),
    },
  ];

  return (
    <div className={`container mx-auto p-6 rtl min-h-screen`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-right">إدارة المرتبات والسلف</h1>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <RangePicker
          onChange={(dates) =>
            setDateRange(
              dates as [moment.Moment | null, moment.Moment | null] | null
            )
          }
          placeholder={["تاريخ البداية", "تاريخ النهاية"]}
          style={{ width: "100%", maxWidth: 400 }}
        />
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {[
            { label: "صرف مرتبات", onClick: () => setIsPayrollModalOpen(true) },
            { label: "صرف سلفة", onClick: () => setIsAdvanceModalOpen(true) },
            {
              label: "إضافة خصم",
              onClick: () => setIsDeductionModalOpen(true),
            },
            { label: "إضافة مكافأة", onClick: () => setIsBonusModalOpen(true) },
          ].map((btn) => (
            <Button
              key={btn.label}
              type="dashed"
              size="middle"
              icon={<PlusCircle size={16} />}
              onClick={btn.onClick}
              className="flex items-center gap-2"
            >
              {btn.label}
            </Button>
          ))}
          {/* <Button
          type="default"
          size="large"
          icon={<FileText size={16} />}
          onClick={() => setIsHistoryModalOpen(true)}
          className="flex items-center gap-2"
        >
          سجل العمليات
        </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "إجمالي المرتبات",
            value: totalPayroll,
            loading: payrollsLoading,
          },
          {
            title: "إجمالي السلف",
            value: totalAdvances,
            loading: advancesLoading,
          },
          {
            title: "إجمالي الخصومات",
            value: totalDeductions,
            loading: deductionsLoading,
          },
          {
            title: "إجمالي المكافآت",
            value: totalBonuses,
            loading: bonusesLoading,
          },
        ].map((stat) => (
          <Card
            key={stat.title}
            className={`shadow-md hover:shadow-lg transition-shadow`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-lg">
                <span>{stat.title}</span>
                <DollarSign className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <div className="text-2xl font-semibold">
                  {stat.value.toLocaleString()} ج.م
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={`md:col-span-1 shadow-md `}>
          <CardHeader>
            <CardTitle className="text-lg">اختيار العهدة</CardTitle>
          </CardHeader>
          <CardContent>
            {custodiesLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <Select
                placeholder="اختر العهدة"
                style={{ width: "100%" }}
                onChange={(value) => {
                  const custody = custodies.find((c) => c.id === value);
                  setSelectedCustody(custody ? { ...custody } : null);
                }}
              >
                {custodies.map((custody) => (
                  <Option key={custody.id} value={custody.id}>
                    {custody.name} - {custody.remaining.toLocaleString()} ج.م
                  </Option>
                ))}
              </Select>
            )}
            {selectedCustody && (
              <div>
                <div className="mt-4 p-4 rounded-lg grid grid-cols-2 gap-4">
                  <p className="text-sm">الرمز: {selectedCustody.code}</p>
                  <p className="text-sm">الشركة: {selectedCustody.company}</p>
                </div>
                <FinancialChart
                  totalAmount={selectedCustody.budget}
                  remainingAmount={selectedCustody.remaining}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`md:col-span-2 shadow-md`}>
          <CardHeader>
            <CardTitle className="text-lg">توزيع المصروفات المالية</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[400px] w-full">
            {payrollsLoading ||
            advancesLoading ||
            deductionsLoading ||
            bonusesLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : chartData.some((item) => item.value > 0) ? (
              <ApexChart
                options={areaChartOptions}
                series={areaChartSeries}
                type="area"
                height="100%"
                width="100%"
              />
            ) : (
              <div className="text-center h-full flex items-center justify-center">
                لا توجد بيانات كافية لعرض المخطط
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={`shadow-md`}>
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-lg">
            <span>قائمة الموظفين</span>
            <Input
              placeholder="بحث عن موظف..."
              prefix={<Search className="h-4 w-4" />}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeesLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Table
              dataSource={filteredEmployees}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: "max-content" }}
              className={`border rounded-lg ${
                darkMode ? "ant-table-dark" : ""
              }`}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        title="صرف مرتبات"
        open={isPayrollModalOpen}
        onCancel={() => setIsPayrollModalOpen(false)}
        footer={null}
        width={700}
      >
        <NewPayroll
          custody={selectedCustody ? { ...selectedCustody } : null}
          dateRange={dateRange}
          onSuccess={() => {
            setIsPayrollModalOpen(false);
            queryClient.invalidateQueries({
              queryKey: ["payrolls", "employees", "custodies"],
            });
          }}
        />
      </Modal>

      <Modal
        title="صرف سلفة"
        open={isAdvanceModalOpen}
        onCancel={() => setIsAdvanceModalOpen(false)}
        footer={null}
        width={600}
      >
        <NewAdvance
          custody={selectedCustody ? { ...selectedCustody } : null}
          onSuccess={() => {
            setIsAdvanceModalOpen(false);
            queryClient.invalidateQueries({
              queryKey: ["advances", "employees", "custodies"],
            });
          }}
        />
      </Modal>

      <Modal
        title="إضافة خصم"
        open={isDeductionModalOpen}
        onCancel={() => setIsDeductionModalOpen(false)}
        footer={null}
        width={600}
      >
        <NewDeduction
          custody={selectedCustody ? { ...selectedCustody } : null}
          onSuccess={() => {
            setIsDeductionModalOpen(false);
            queryClient.invalidateQueries({
              queryKey: ["deductions", "employees", "custodies"],
            });
          }}
        />
      </Modal>

      <Modal
        title="إضافة مكافأة"
        open={isBonusModalOpen}
        onCancel={() => setIsBonusModalOpen(false)}
        footer={null}
        width={600}
      >
        <NewBonus
          custody={selectedCustody ? { ...selectedCustody } : null}
          onSuccess={() => {
            setIsBonusModalOpen(false);
            queryClient.invalidateQueries({
              queryKey: ["bonuses", "employees", "custodies"],
            });
          }}
        />
      </Modal>

      <Modal
        title="سجل العمليات"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={900}
      >
        <TransactionHistory />
      </Modal>

      <Modal
        title="كشف حساب الموظف"
        open={isReportModalOpen}
        onCancel={() => setIsReportModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedEmployee && <EmployeeReport employee={selectedEmployee} />}
      </Modal>
    </div>
  );
}
