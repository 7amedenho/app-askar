"use client";
import { Button, DatePicker, Form, Input, Modal, Select } from "antd";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface NewExpenseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Custody {
  status: string;
  id: number;
  name: string;
  remaining: number;
  budget: number;
}

interface Project {
  id: number;
  name: string;
  status: string;
}

export default function NewExpense({ isOpen, onClose, onSuccess }: NewExpenseProps) {
  const [form] = Form.useForm();
  const [selectedCustodyId, setSelectedCustodyId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const queryClient = useQueryClient();

  // جلب العهدات النشطة
  const { data: custodies = [] } = useQuery<Custody[]>({
    queryKey: ["custodies"],
    queryFn: async () => {
      const response = await axios.get("/api/custodies");
      return response.data.filter((custody: Custody) => custody.status === "active");
    },
  });

  // جلب المشاريع النشطة
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await axios.get("/api/projects");
      return response.data.filter((project: Project) => project.status === "active");
    },
  });

  // العهدة المحددة
  const selectedCustody = custodies.find(custody => custody.id === selectedCustodyId);

  // إضافة مصروف جديد
  const createExpenseMutation = useMutation({
    mutationFn: async (values: any) => {
      return await axios.post("/api/expenses", values);
    },
    onSuccess: () => {
      toast.success("تم إضافة المصروف بنجاح");
      form.resetFields();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء إضافة المصروف");
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // التحقق من أن المبلغ لا يتجاوز المتبقي في العهدة
      if (selectedCustody && Number(values.amount) > selectedCustody.remaining) {
        toast.error("المبلغ المطلوب يتجاوز المتبقي في العهدة");
        return;
      }

      // تحويل التاريخ إلى صيغة مناسبة
      const formattedValues = {
        ...values,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        projectId: values.projectId || null,
      };

      createExpenseMutation.mutate(formattedValues);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title="إضافة مصروف جديد"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{
          date: null,
          amount: 0,
          expenseType: "مصروفات عامة",
        }}
      >
        {/* اختيار العهدة */}
        <Form.Item
          name="custodyId"
          label="اختر العهدة"
          rules={[{ required: true, message: "يرجى اختيار العهدة" }]}
        >
          <Select
            placeholder="اختر العهدة"
            onChange={(value) => setSelectedCustodyId(value)}
          >
            {custodies.map((custody) => (
              <Select.Option key={custody.id} value={custody.id}>
                {custody.name} - المتبقي: {custody.remaining.toLocaleString()} جنيه
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* وصف المصروف */}
        <Form.Item
          name="description"
          label="بيان المصروف"
          rules={[{ required: true, message: "يرجى إدخال وصف المصروف" }]}
        >
          <Input placeholder="أدخل وصف المصروف" />
        </Form.Item>

        {/* المسؤول عن الصرف */}
        <Form.Item
          name="responsiblePerson"
          label="اسم المسؤول عن الصرف"
          rules={[{ required: true, message: "يرجى إدخال اسم المسؤول" }]}
        >
          <Input placeholder="أدخل اسم المسؤول عن الصرف" />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* تاريخ الصرف */}
          <Form.Item
            name="date"
            label="وقت الصرف"
            rules={[{ required: true, message: "يرجى تحديد تاريخ الصرف" }]}
          >
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD"
              placeholder="اختر التاريخ"
            />
          </Form.Item>

          {/* المبلغ المصروف */}
          <Form.Item
            name="amount"
            label="المبلغ المصروف"
            rules={[
              { required: true, message: "يرجى إدخال المبلغ" },
              {
                validator: (_, value) =>
                  value > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error("يجب أن يكون المبلغ أكبر من صفر")),
              },
            ]}
          >
            <Input
              type="number"
              min={0}
              step={0.01}
              addonBefore="$"
              placeholder="0.00"
              onChange={(e) => setExpenseAmount(Number(e.target.value))}
            />
          </Form.Item>
        </div>

        {/* نوع المصروف */}
        <Form.Item
          name="expenseType"
          label="اختر نوع المصروف"
          rules={[{ required: true, message: "يرجى اختيار نوع المصروف" }]}
        >
          <Select placeholder="اختر نوع المصروف">
            <Select.Option value="مصروفات مكتبية">مصروفات مكتبية</Select.Option>
            <Select.Option value="مصروفات صيانة">مصروفات صيانة</Select.Option>
            <Select.Option value="مصروفات عامة">مصروفات عامة</Select.Option>
            <Select.Option value="مصروفات خاصة">مصروفات خاصة</Select.Option>
          </Select>
        </Form.Item>

        {/* اختيار المشروع (اختياري) */}
        <Form.Item
          name="projectId"
          label="اختر المشروع (اختياري)"
        >
          <Select
            placeholder="اختر المشروع"
            allowClear
            onChange={(value) => setSelectedProjectId(value)}
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* معلومات العهدة المحددة */}
        {selectedCustody && (
          <div className=" p-4 rounded-md mb-4">
            <div className="text-sm font-medium">معلومات العهدة:</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-muted-foreground text-xs">الميزانية الكلية:</span>
                <div>{selectedCustody.budget.toLocaleString()} جنيه</div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">المتبقي:</span>
                <div className={`${selectedCustody.remaining < expenseAmount ? 'text-red-500' : ''}`}>
                  {selectedCustody.remaining.toLocaleString()} جنيه
                </div>
              </div>
              {selectedCustody.remaining < expenseAmount && (
                <div className="col-span-2 text-red-500 text-sm">
                  تحذير: المبلغ المطلوب يتجاوز المتبقي في العهدة
                </div>
              )}
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createExpenseMutation.isPending}
            disabled={createExpenseMutation.isPending}
          >
            إضافة المصروف
          </Button>
        </div>
      </Form>
    </Modal>
  );
}