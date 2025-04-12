"use client";
import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Table,
  InputNumber,
  Spin,
} from "antd";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import moment from "moment";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { Option } = Select;
const { RangePicker } = DatePicker;
const queryClient = new QueryClient();

interface Employee {
  id: number;
  name: string;
  jobTitle: string;
  dailySalary: number;
  budget: number;
}

interface Custody {
  id: string;
  name: string;
  code: string;
  company: string;
  budget: number;
  remaining: number;
}

interface PayrollProps {
  custody: Custody | null;
  dateRange: [moment.Moment | null, moment.Moment | null] | null;
  onSuccess: () => void;
}

export default function NewPayroll({
  custody,
  dateRange,
  onSuccess,
}: PayrollProps) {
  const [form] = Form.useForm();
  const [selectedPeriod, setSelectedPeriod] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: employees = [], isLoading: employeesLoading } = useQuery<
    Employee[]
  >({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axios.get("/api/employees");
      return res.data;
    },
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", selectedPeriod || dateRange],
    queryFn: async () => {
      const startDate = (
        selectedPeriod ? selectedPeriod[0] : dateRange?.[0]
      )?.format("YYYY-MM-DD");
      const endDate = (
        selectedPeriod ? selectedPeriod[1] : dateRange?.[1]
      )?.format("YYYY-MM-DD");
      if (!startDate || !endDate) return [];
      const res = await axios.get(
        `/api/attendance?startDate=${startDate}&endDate=${endDate}`
      );
      return res.data;
    },
    enabled: !!selectedPeriod || !!dateRange,
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (data: any) => {
      return await axios.post("/api/payroll", data);
    },
    onSuccess: () => {
      toast.success("تم صرف المرتبات بنجاح");
      form.resetFields();
      setPayrollData([]);
      setSelectedEmployees([]);
      setSelectedPeriod(null);
      onSuccess();
      queryClient.invalidateQueries({
        queryKey: ["payrolls", "employees", "custodies"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء صرف المرتبات");
    },
  });

  useEffect(() => {
    if (
      (selectedPeriod || dateRange) &&
      selectedEmployees.length > 0 &&
      attendance.length > 0
    ) {
      setLoading(true);

      const newPayrollData = selectedEmployees
        .map((employeeId) => {
          const employee = employees.find((emp) => emp.id === employeeId);
          if (!employee) return null;

          const employeeAttendance = attendance.filter(
            (record: { employeeId: number }) => record.employeeId === employeeId
          );
          const daysWorked = employeeAttendance.length;
          const totalSalary = employee.dailySalary * daysWorked;

          return {
            employeeId,
            name: employee.name,
            dailySalary: employee.dailySalary,
            daysWorked,
            totalSalary,
            bonuses: 0,
            deductions: 0,
            advances: 0,
            netSalary: totalSalary,
            paidAmount: 0,
            budget: employee.budget, // إضافة الـ budget لكل موظف
          };
        })
        .filter(Boolean);

      setPayrollData(newPayrollData);
      setLoading(false);
    }
  }, [selectedPeriod, dateRange, selectedEmployees, attendance, employees]);

  useEffect(() => {
    if ((selectedPeriod || dateRange) && payrollData.length > 0) {
      setLoading(true);

      const startDate = (
        selectedPeriod ? selectedPeriod[0] : dateRange?.[0]
      )?.format("YYYY-MM-DD");
      const endDate = (
        selectedPeriod ? selectedPeriod[1] : dateRange?.[1]
      )?.format("YYYY-MM-DD");

      if (!startDate || !endDate) {
        setLoading(false);
        return;
      }

      const fetchDeductions = axios.get(
        `/api/deductions?startDate=${startDate}&endDate=${endDate}`
      );
      const fetchBonuses = axios.get(
        `/api/bonuses?startDate=${startDate}&endDate=${endDate}`
      );
      const fetchAdvances = axios.get(
        `/api/advances?startDate=${startDate}&endDate=${endDate}`
      );

      Promise.all([fetchDeductions, fetchBonuses, fetchAdvances])
        .then(([deductionsRes, bonusesRes, advancesRes]) => {
          const deductions = deductionsRes.data;
          const bonuses = bonusesRes.data;
          const advances = advancesRes.data;

          const updatedPayrollData = payrollData.map((payroll) => {
            const employeeDeductions = deductions
              .filter(
                (d: { employeeId: any }) => d.employeeId === payroll.employeeId
              )
              .reduce(
                (sum: number, d: { amount: any }) => sum + Number(d.amount),
                0
              );

            const employeeBonuses = bonuses
              .filter(
                (b: { employeeId: any }) => b.employeeId === payroll.employeeId
              )
              .reduce(
                (sum: number, b: { amount: any }) => sum + Number(b.amount),
                0
              );

            const employeeAdvances = advances
              .filter(
                (a: { employeeId: any; status: string }) =>
                  a.employeeId === payroll.employeeId && a.status !== "repaid"
              )
              .reduce(
                (sum: number, a: { amount: any }) => sum + Number(a.amount),
                0
              );

            const netSalary =
              payroll.totalSalary +
              employeeBonuses -
              employeeDeductions -
              employeeAdvances;

            return {
              ...payroll,
              bonuses: employeeBonuses,
              deductions: employeeDeductions,
              advances: employeeAdvances,
              netSalary: netSalary > 0 ? netSalary : 0,
            };
          });

          setPayrollData(updatedPayrollData);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching financial data:", error);
          setLoading(false);
        });
    }
  }, [selectedPeriod, dateRange, payrollData.length]);

  const updatePaidAmount = (employeeId: number, value: number | null) => {
    setPayrollData((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId
          ? { ...item, paidAmount: value || 0 }
          : item
      )
    );
  };

  const payAll = (employeeId: number) => {
    setPayrollData((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId
          ? {
              ...item,
              paidAmount: Math.min(item.budget),
            }
          : item
      )
    );
  };

  const handleSubmit = () => {
    if (!custody) {
      toast.error("يرجى اختيار العهدة أولاً");
      return;
    }

    form.validateFields().then(() => {
      const totalAmount = payrollData.reduce(
        (sum, item) => sum + item.paidAmount,
        0
      );

      if (totalAmount > custody.remaining) {
        toast.error("رصيد العهدة غير كافٍ لصرف المرتبات");
        return;
      }

      // التحقق من أن الـ budget لكل موظف كافٍ
      const invalidBudgets = payrollData.filter(
        (item) => item.paidAmount > item.budget
      );
      if (invalidBudgets.length > 0) {
        toast.error(
          `رصيد الموظفين التاليين غير كافٍ: ${invalidBudgets
            .map((item) => item.name)
            .join(", ")}`
        );
        return;
      }

      const payrolls = payrollData
        .filter((item) => item.paidAmount > 0)
        .map((item) => ({
          employeeId: item.employeeId,
          startDate: (selectedPeriod
            ? selectedPeriod[0]
            : dateRange?.[0]
          )?.format("YYYY-MM-DD"),
          endDate: (selectedPeriod
            ? selectedPeriod[1]
            : dateRange?.[1]
          )?.format("YYYY-MM-DD"),
          dailySalary: item.dailySalary,
          daysWorked: item.daysWorked,
          totalSalary: item.totalSalary,
          bonuses: item.bonuses,
          deductions: item.deductions,
          advances: item.advances,
          netSalary: item.netSalary,
          paidAmount: item.paidAmount,
        }));

      if (payrolls.length === 0) {
        toast.error("لم يتم تحديد أي مبالغ للصرف");
        return;
      }

      createPayrollMutation.mutate({
        payrolls,
        custodyId: custody.id,
        totalAmount,
      });
    });
  };

  const columns = [
    { title: "الموظف", dataIndex: "name", key: "name" },
    {
      title: "الراتب اليومي",
      dataIndex: "dailySalary",
      key: "dailySalary",
      render: (text: number) => `${text} ج.م`,
    },
    { title: "أيام العمل", dataIndex: "daysWorked", key: "daysWorked" },
    {
      title: "إجمالي الراتب",
      dataIndex: "totalSalary",
      key: "totalSalary",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "المكافآت",
      dataIndex: "bonuses",
      key: "bonuses",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "الخصومات",
      dataIndex: "deductions",
      key: "deductions",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "السلف",
      dataIndex: "advances",
      key: "advances",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "صافي الراتب",
      dataIndex: "netSalary",
      key: "netSalary",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "الرصيد المتاح (Budget)",
      dataIndex: "budget",
      key: "budget",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "المبلغ المراد صرفه",
      key: "paidAmount",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <InputNumber
            min={0}
            max={Math.min(record.budget)} // لا يتجاوز الـ budget أو صافي الراتب
            value={record.paidAmount}
            onChange={(value) => updatePaidAmount(record.employeeId, value)}
            style={{ width: 100 }}
            formatter={(value) => `${value}`}
            parser={(value) => value!.replace(/\D/g, "")}
          />
          <Button
            type="link"
            onClick={() => payAll(record.employeeId)}
            disabled={record.netSalary === 0 || record.budget === 0}
          >
            صرف الكل
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="period"
          label="الفترة"
          rules={[{ required: true, message: "يرجى اختيار الفترة" }]}
          initialValue={
            dateRange ? [moment(dateRange[0]), moment(dateRange[1])] : null
          }
        >
          <RangePicker
            style={{ width: "100%" }}
            locale={locale}
            onChange={(dates) => {
              if (dates) {
                setSelectedPeriod(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                setPayrollData([]);
              } else {
                setSelectedPeriod(null);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="employees"
          label="الموظفين"
          rules={[{ required: true, message: "يرجى اختيار الموظفين" }]}
        >
          <Select
            mode="multiple"
            placeholder="اختر الموظفين"
            style={{ width: "100%" }}
            onChange={(values) => setSelectedEmployees(values)}
            loading={employeesLoading}
          >
            {employees.map((employee) => (
              <Option key={employee.id} value={employee.id}>
                {employee.name} - {employee.jobTitle}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {loading || attendanceLoading ? (
          <div className="flex justify-center p-4">
            <Spin size="large" />
          </div>
        ) : payrollData.length > 0 ? (
          <>
            <Table
              dataSource={payrollData}
              columns={columns}
              rowKey="employeeId"
              pagination={false}
              scroll={{ x: true }}
              summary={(pageData) => {
                let totalPaidAmount = 0;
                pageData.forEach(({ paidAmount }) => {
                  totalPaidAmount += paidAmount;
                });

                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell
                      index={0}
                      colSpan={9}
                      className="text-right font-bold"
                    >
                      الإجمالي
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <span className="font-bold">
                        {totalPaidAmount.toLocaleString()} ج.م
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />

            <div className="mt-4">
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={createPayrollMutation.isPending}
                disabled={!custody}
              >
                صرف المرتب
              </Button>
              {!custody && (
                <div className="text-red-500 mt-2">
                  يرجى اختيار العهدة أولاً من الصفحة الرئيسية
                </div>
              )}
            </div>
          </>
        ) : (selectedPeriod || dateRange) && selectedEmployees.length > 0 ? (
          <div className="text-center p-4 text-gray-500">
            لا توجد بيانات حضور للموظفين المحددين في هذه الفترة
          </div>
        ) : null}
      </Form>
    </div>
  );
}
