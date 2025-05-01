"use client";
import { Button, Form, Input, InputNumber, Modal, Select, App } from "antd";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

// Interface definitions
interface Supplier {
  id: number;
  name: string;
}

interface NewInventoryConsumableProps {
  onCancel: () => void;
  open: boolean;
}

// Component definition
const NewInventoryConsumable = ({ onCancel, open }: NewInventoryConsumableProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [unit, setUnit] = useState("");

  // Fetch suppliers for dropdown
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<
    Supplier[]
  >({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axios.get("/api/suppliers");
      return response.data;
    },
  });

  // Mutation for creating new inventory consumable
  const createInventoryConsumableMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post("/api/inventory-consumables", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryConsumables"] });
      toast.success("تم إضافة المستهلك بنجاح");
      form.resetFields();
      setIsFormDirty(false);
      onCancel();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء إضافة المستهلك"
      );
    },
  });

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createInventoryConsumableMutation.mutateAsync(values);
    } finally {
      setLoading(false);
    }
  };

  // Track form changes
  const handleValuesChange = () => {
    setIsFormDirty(true);
  };

  // Handle modal cancel with confirmation if form is dirty
  const handleCancel = () => {
    if (isFormDirty) {
      Modal.confirm({
        title: "هل أنت متأكد؟",
        content: "لديك تغييرات غير محفوظة، هل تريد الإغلاق؟",
        okText: "نعم",
        cancelText: "لا",
        onOk: () => {
          form.resetFields();
          setIsFormDirty(false);
          onCancel();
        },
      });
    } else {
      onCancel();
    }
  };

  return (
    <Modal
      title="إضافة مستهلك جديد للتوريدات"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      className="rounded-lg"
    >
      <App>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4"
        >
          {/* اسم المستهلك */}
          <Form.Item
            name="name"
            label="اسم المستهلك"
            rules={[{ required: true, message: "الرجاء إدخال اسم المستهلك" }]}
          >
            <Input
              placeholder="أدخل اسم المستهلك"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* كود المستهلك */}
          <Form.Item
            name="code"
            label="كود المستهلك"
            rules={[{ required: true, message: "الرجاء إدخال كود المستهلك" }]}
          >
            <Input
              placeholder="أدخل كود المستهلك"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* وحدة القياس */}
          <Form.Item
            name="unit"
            label="وحدة القياس"
            rules={[{ required: true, message: "الرجاء إدخال وحدة القياس" }]}
          >
            <Input
              placeholder="مثال: كيس، متر، كيلو"
              className="rounded-lg border-gray-300"
              size="large"
              onChange={(e) => {
                setUnit(e.target.value);
              }}
            />
          </Form.Item>

          {/* الماركة */}
          <Form.Item name="brand" label="الماركة">
            <Input
              placeholder="أدخل الماركة (اختياري)"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* الكمية المتوفرة */}
          <Form.Item
            name="stock"
            label="الكمية المتوفرة"
            rules={[{ required: true, message: "الرجاء إدخال الكمية المتوفرة" }]}
          >
            <InputNumber
              placeholder="أدخل الكمية"
              className="w-full rounded-lg border-gray-300"
              size="large"
              addonAfter={unit || "وحدة"}
            />
          </Form.Item>

          {/* الكمية الأساسية */}
          <Form.Item
            name="baseQuantity"
            label="الكمية الأساسية"
            rules={[{ required: true, message: "الرجاء إدخال الكمية الأساسية" }]}
            tooltip="هذه الكمية تستخدم لحساب نسبة المخزون المتبقي"
          >
            <InputNumber
              placeholder="أدخل الكمية الأساسية"
              className="w-full rounded-lg border-gray-300"
              size="large"
              addonAfter={unit || "وحدة"}
            />
          </Form.Item>

          {/* المورد */}
          <Form.Item
            name="supplierId"
            label="المورد"
          >
            <Select
              placeholder="اختر المورد (اختياري)"
              loading={suppliersLoading}
              size="large"
              className="rounded-lg"
              allowClear
            >
              {suppliers.map((supplier) => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* أزرار التحكم */}
          <div className="col-span-3 flex justify-end gap-2 mt-4">
            <Button
              onClick={handleCancel}
              className="rounded-lg border-gray-300 text-gray-500 hover:text-gray-700"
              size="large"
            >
              إلغاء
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="rounded-lg"
              size="large"
            >
              إضافة
            </Button>
          </div>
        </Form>
      </App>
    </Modal>
  );
};

export default NewInventoryConsumable; 