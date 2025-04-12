//NewAdvance.tsx
"use client";
import { useState } from "react";
import { Form, Input, Button, Select, DatePicker, InputNumber } from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { Option } = Select;

interface AdvanceProps {
  custody: any;
  onSuccess: () => void;
}

export default function NewAdvance({ custody, onSuccess }: AdvanceProps) {
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

  // إنشاء سلفة جديدة
  const createAdvanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await axios.post("/api/advances", data);
    },
    onSuccess: () => {
      toast.success("تم صرف السلفة بنجاح");
      form.resetFields();
      setSelectedEmployee(null);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء صرف السلفة");
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
        toast.error("رصيد العهدة غير كافٍ لصرف السلفة");
        return;
      }

      createAdvanceMutation.mutate({
        employeeId: values.employeeId,
        amount: values.amount,
        requestDate: values.requestDate.toISOString(),
        status: values.status,
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
          <div className="p-3 rounded-md mb-4 flex items-center gap-3">
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
          label="مبلغ السلفة"
          rules={[{ required: true, message: "يرجى إدخال مبلغ السلفة" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="أدخل مبلغ السلفة"
          />
        </Form.Item>

        <Form.Item
          name="requestDate"
          label="تاريخ الطلب"
          initialValue={dayjs()}
          rules={[{ required: true, message: "يرجى اختيار تاريخ الطلب" }]}
        >
          <DatePicker style={{ width: "100%" }} locale={locale} />
        </Form.Item>

        <Form.Item
          name="status"
          label="حالة السلفة"
          initialValue="approved"
          rules={[{ required: true, message: "يرجى اختيار حالة السلفة" }]}
        >
          <Select placeholder="اختر حالة السلفة">
            <Option value="pending">قيد الانتظار</Option>
            <Option value="approved">تمت الموافقة</Option>
            {/* <Option value="repaid">تم السداد</Option> */}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createAdvanceMutation.isPending}
            disabled={!custody}
          >
            صرف السلفة
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
