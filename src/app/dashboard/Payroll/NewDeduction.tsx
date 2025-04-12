//Payroll/NewDeduction.tsx
"use client";
import { useState } from "react";
import { Form, Input, Button, Select, DatePicker, InputNumber } from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { Option } = Select;

interface DeductionProps {
  custody: any;
  onSuccess: () => void;
}

export default function NewDeduction({ custody, onSuccess }: DeductionProps) {
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

  // إنشاء خصم جديد
  const createDeductionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await axios.post("/api/deductions", data);
    },
    onSuccess: () => {
      toast.success("تم إضافة الخصم بنجاح");
      form.resetFields();
      setSelectedEmployee(null);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء إضافة الخصم");
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
      createDeductionMutation.mutate({
        employeeId: values.employeeId,
        amount: values.amount,
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
          label="مبلغ الخصم"
          rules={[{ required: true, message: "يرجى إدخال مبلغ الخصم" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="أدخل مبلغ الخصم"
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="تاريخ الخصم"
          initialValue={dayjs()}
          rules={[{ required: true, message: "يرجى اختيار تاريخ الخصم" }]}
        >
          <DatePicker style={{ width: "100%" }} locale={locale} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createDeductionMutation.isPending}
            disabled={!custody}
          >
            إضافة الخصم
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
