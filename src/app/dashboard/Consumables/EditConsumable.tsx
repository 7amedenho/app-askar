"use client";
import { Button, Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface EditConsumableProps {
  isOpen: boolean;
  onClose: () => void;
  consumableId: number;
}

interface Supplier {
  id: number;
  name: string;
}

const EditConsumable = ({ isOpen, onClose, consumableId }: EditConsumableProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // جلب بيانات المستهلك
  const { data: consumable } = useQuery({
    queryKey: ["consumable", consumableId],
    queryFn: async () => {
      const response = await axios.get(`/api/consumables/${consumableId}`);
      return response.data;
    },
  });

  // جلب قائمة الموردين
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axios.get("/api/suppliers");
      return response.data;
    },
  });

  useEffect(() => {
    if (consumable) {
      form.setFieldsValue({
        name: consumable.name,
        unit: consumable.unit,
        brand: consumable.brand,
        stock: consumable.stock,
        supplierId: consumable.supplierId,
      });
    }
  }, [consumable, form]);

  // تعديل المستهلك
  const updateConsumableMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.put(`/api/consumables/${consumableId}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      queryClient.invalidateQueries({ queryKey: ["consumable", consumableId] });
      toast.success("تم تعديل المستهلك بنجاح");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تعديل المستهلك");
    },
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await updateConsumableMutation.mutateAsync(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="تعديل المستهلك"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="اسم المستهلك"
          rules={[{ required: true, message: "الرجاء إدخال اسم المستهلك" }]}
        >
          <Input placeholder="أدخل اسم المستهلك" />
        </Form.Item>

        <Form.Item
          name="unit"
          label="وحدة القياس"
          rules={[{ required: true, message: "الرجاء إدخال وحدة القياس" }]}
        >
          <Input placeholder="مثال: كيس، متر، كيلو" />
        </Form.Item>

        <Form.Item name="brand" label="الماركة">
          <Input placeholder="أدخل الماركة (اختياري)" />
        </Form.Item>

        <Form.Item
          name="stock"
          label="الكمية المتوفرة"
          rules={[{ required: true, message: "الرجاء إدخال الكمية المتوفرة" }]}
        >
          <InputNumber
            min={0}
            placeholder="أدخل الكمية"
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          name="supplierId"
          label="المورد"
          rules={[{ required: true, message: "الرجاء اختيار المورد" }]}
        >
          <Select placeholder="اختر المورد">
            {suppliers.map((supplier) => (
              <Select.Option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            حفظ التغييرات
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditConsumable;