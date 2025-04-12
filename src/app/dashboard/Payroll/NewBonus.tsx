// Payroll/NewBonus.tsx
"use client";
import { useState } from "react";
import { Form, Input, Button, Select, DatePicker, InputNumber } from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { Option } = Select;

interface BonusProps {
  custody: any;
  onSuccess: () => void;
}

export default function NewBonus({ custody, onSuccess }: BonusProps) {
  const [form] = Form.useForm();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // جلب بيانات الموظفين
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axios.get("/api/employees");
      return res.data;
    },
  });

  // إنشاء مكافأة جديدة
  const createBonusMutation = useMutation({
    mutationFn: async (data: any) => {
      return await axios.post("/api/bonuses", data);
    },
    onSuccess: () => {
      toast.success("تم إضافة المكافأة بنجاح");
      form.resetFields();
      setSelectedEmployee(null);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء إضافة المكافأة"
      );
    },
  });

  const handleEmployeeChange = (employeeId: number) => {
    const employee = employees.find(
      (emp: { id: number }) => emp.id === employeeId
    );
    setSelectedEmployee(employee);
  };

  const handleSubmit = () => {
    if (!custody) {
      toast.error("يرجى اختيار العهدة أولاً");
      return;
    }

    form.validateFields().then((values) => {
      // التحقق من كفاية رصيد العهدة
      if (values.amount > custody.remaining) {
        toast.error("رصيد العهدة غير كافٍ لإضافة المكافأة");
        return;
      }

      createBonusMutation.mutate({
        employeeId: values.employeeId,
        amount: values.amount,
        reason: values.reason,
        date: values.date.toISOString(),
        custodyId: custody.id,
      });
    });
  };

  return (
    <div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="employeeId"
          label="الموظف"
          rules={[{ required: true, message: "يرجى اختيار الموظف" }]}
        >
          <Select
            placeholder="اختر الموظف"
            style={{ width: "100%" }}
            onChange={handleEmployeeChange}
            loading={employeesLoading}
          >
            {employees.map((employee: any) => (
              <Option key={employee.id} value={employee.id}>
                {employee.name} - {employee.jobTitle}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedEmployee && (
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <p>
              <strong>الراتب اليومي:</strong> {selectedEmployee.dailySalary} ج.م
            </p>
            <p>
              <strong>الرصيد الحالي:</strong> {selectedEmployee.budget} ج.م
            </p>
          </div>
        )}

        <Form.Item
          name="amount"
          label="مبلغ المكافأة"
          rules={[{ required: true, message: "يرجى إدخال مبلغ المكافأة" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="أدخل مبلغ المكافأة"
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="سبب المكافأة"
          rules={[{ required: true, message: "يرجى إدخال سبب المكافأة" }]}
        >
          <Input placeholder="أدخل سبب المكافأة" />
        </Form.Item>

        <Form.Item
          name="date"
          label="تاريخ المكافأة"
          initialValue={dayjs()}
          rules={[{ required: true, message: "يرجى اختيار تاريخ المكافأة" }]}
        >
          <DatePicker style={{ width: "100%" }} locale={locale} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createBonusMutation.isPending}
            disabled={!custody}
          >
            إضافة المكافأة
          </Button>
          {!custody && (
            <div className="text-red-500 mt-2">
              يرجى اختيار العهدة أولاً من الصفحة الرئيسية
            </div>
          )}
        </Form.Item>
      </Form>
    </div>
  );
}
