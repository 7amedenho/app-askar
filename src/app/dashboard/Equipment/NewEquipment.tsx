"use client";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Form, Input, Select } from "antd";
import { toast } from "react-hot-toast";

const { Option } = Select;

interface NewEquipmentProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Supplier {
  id: number;
  name: string;
}

export default function NewEquipment({ isOpen, onClose }: NewEquipmentProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axios.get("/api/suppliers");
      return response.data;
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post("/api/equipment", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("تم إضافة المعدة بنجاح");
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء إضافة المعدة");
    },
  });

  const onFinish = (values: any) => {
    createEquipmentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>إضافة معدة جديدة</DialogTitle>
        </DialogHeader>
        <Form form={form} layout="vertical" onFinish={onFinish} className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="اسم المعدة"
              rules={[{ required: true, message: "يرجى إدخال اسم المعدة" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="code"
              label="كود المعدة"
              rules={[{ required: true, message: "يرجى إدخال كود المعدة" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="الكمية"
              rules={[{ required: true, message: "يرجى إدخال الكمية" }]}
            >
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item name="brand" label="الماركة">
              <Input />
            </Form.Item>

            <Form.Item
              name="supplierId"
              label="المورد"
              className="col-span-2"
              rules={[{ required: true, message: "يرجى اختيار المورد" }]}
            >
              <Select>
                {suppliers.map((supplier: Supplier) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
        <DialogFooter>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createEquipmentMutation.isPending}
            disabled={createEquipmentMutation.isPending}
          >
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 