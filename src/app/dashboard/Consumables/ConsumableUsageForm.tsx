"use client";
import { Button, Form, InputNumber, Modal, Select } from "antd";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface ConsumableUsageFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Consumable {
  id: number;
  name: string;
  unit: string;
  stock: number;
}

interface Project {
  id: number;
  name: string;
}

const ConsumableUsageForm = ({ isOpen, onClose }: ConsumableUsageFormProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // جلب قائمة المستهلكات
  const { data: consumables = [] } = useQuery<Consumable[]>({
    queryKey: ["consumables"],
    queryFn: async () => {
      const response = await axios.get("/api/consumables");
      return response.data;
    },
  });

  // جلب قائمة المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await axios.get("/api/projects");
      return response.data;
    },
  });

  // تسجيل استخدام المستهلك
  const createUsageMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post("/api/consumables/usage", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      toast.success("تم تسجيل الاستخدام بنجاح");
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تسجيل الاستخدام");
    },
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createUsageMutation.mutateAsync(values);
    } finally {
      setLoading(false);
    }
  };

  const selectedConsumable = Form.useWatch('consumableId', form);
  const currentConsumable = consumables.find(c => c.id === selectedConsumable);

  return (
    <Modal
      title="تسجيل استخدام مستهلك"
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
          name="consumableId"
          label="المستهلك"
          rules={[{ required: true, message: "الرجاء اختيار المستهلك" }]}
        >
          <Select
            placeholder="اختر المستهلك"
            optionFilterProp="children"
            showSearch
          >
            {consumables.map((consumable) => (
              <Select.Option key={consumable.id} value={consumable.id}>
                {consumable.name} ({consumable.stock} {consumable.unit})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="quantityUsed"
          label="الكمية المستخدمة"
          rules={[
            { required: true, message: "الرجاء إدخال الكمية المستخدمة" },
            {
              validator: (_, value) => {
                if (currentConsumable && value > currentConsumable.stock) {
                  return Promise.reject("الكمية المطلوبة أكبر من المخزون المتوفر");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            max={currentConsumable?.stock}
            placeholder="أدخل الكمية"
            className="w-full"
            addonAfter={currentConsumable?.unit}
          />
        </Form.Item>

        <Form.Item
          name="projectId"
          label="المشروع"
          rules={[{ required: true, message: "الرجاء اختيار المشروع" }]}
        >
          <Select
            placeholder="اختر المشروع"
            optionFilterProp="children"
            showSearch
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            تسجيل الاستخدام
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ConsumableUsageForm;