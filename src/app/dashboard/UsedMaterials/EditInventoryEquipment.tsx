"use client";
import { Button, Form, Input, InputNumber, Modal, Select, App } from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

// Interface definitions
interface Supplier {
  id: number;
  name: string;
}

interface InventoryEquipment {
  id: number;
  name: string;
  code: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  status: string;
  supplierId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditInventoryEquipmentProps {
  onCancel: () => void;
  open: boolean;
  equipment: InventoryEquipment | null;
}

// Component definition
const EditInventoryEquipment = ({ onCancel, open, equipment }: EditInventoryEquipmentProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Set form initial values when equipment changes
  useEffect(() => {
    if (equipment) {
      form.setFieldsValue({
        name: equipment.name,
        code: equipment.code,
        brand: equipment.brand,
        model: equipment.model,
        quantity: equipment.quantity,
        status: equipment.status,
        supplierId: equipment.supplierId,
        notes: equipment.notes,
      });
    }
  }, [equipment, form]);

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

  // Mutation for updating inventory equipment
  const updateInventoryEquipmentMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!equipment) throw new Error("No equipment selected");
      const response = await axios.put(`/api/inventory-equipment/${equipment.id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryEquipment"] });
      toast.success("تم تحديث المعدة بنجاح");
      form.resetFields();
      setIsFormDirty(false);
      onCancel();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء تحديث المعدة"
      );
    },
  });

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await updateInventoryEquipmentMutation.mutateAsync(values);
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
      title="تعديل معدة التوريدات"
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
          {/* اسم المعدة */}
          <Form.Item
            name="name"
            label="اسم المعدة"
            rules={[{ required: true, message: "الرجاء إدخال اسم المعدة" }]}
          >
            <Input
              placeholder="أدخل اسم المعدة"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* كود المعدة */}
          <Form.Item
            name="code"
            label="كود المعدة"
            rules={[{ required: true, message: "الرجاء إدخال كود المعدة" }]}
          >
            <Input
              placeholder="أدخل كود المعدة"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* الماركة */}
          <Form.Item 
            name="brand" 
            label="الماركة"
          >
            <Input
              placeholder="أدخل الماركة (اختياري)"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* الموديل */}
          <Form.Item 
            name="model" 
            label="الموديل"
          >
            <Input
              placeholder="أدخل الموديل (اختياري)"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* الكمية */}
          <Form.Item
            name="quantity"
            label="الكمية"
            rules={[{ required: true, message: "الرجاء إدخال الكمية" }]}
          >
            <InputNumber
              placeholder="أدخل الكمية"
              className="w-full rounded-lg border-gray-300"
              size="large"
              min={1}
            />
          </Form.Item>

          {/* الحالة */}
          <Form.Item
            name="status"
            label="الحالة"
            rules={[{ required: true, message: "الرجاء اختيار الحالة" }]}
          >
            <Select
              placeholder="اختر الحالة"
              className="rounded-lg"
              size="large"
            >
              <Select.Option value="available">متاح</Select.Option>
              <Select.Option value="in_use">قيد الاستخدام</Select.Option>
              <Select.Option value="maintenance">صيانة</Select.Option>
              <Select.Option value="damaged">تالف</Select.Option>
            </Select>
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

          {/* ملاحظات */}
          <Form.Item 
            name="notes" 
            label="ملاحظات"
            className="col-span-3"
          >
            <Input.TextArea
              placeholder="أدخل ملاحظات إضافية (اختياري)"
              className="rounded-lg border-gray-300"
              rows={4}
            />
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
              حفظ التغييرات
            </Button>
          </div>
        </Form>
      </App>
    </Modal>
  );
};

export default EditInventoryEquipment; 