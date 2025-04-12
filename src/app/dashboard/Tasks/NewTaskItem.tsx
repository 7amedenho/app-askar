"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Input, InputNumber, Form } from "antd";
import { toast } from "react-hot-toast";

interface NewTaskItemProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTaskItem({ isOpen, onClose }: NewTaskItemProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; quantity: number }) => {
      const response = await axios.post("/api/tasks", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskItems"] });
      toast.success("تمت إضافة القطعة بنجاح");
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء إضافة القطعة");
    },
  });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      mutation.mutate(values);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            إضافة قطعة جديدة
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="font-semibold">إضافة قطعة جديدة إلى المخزون</p>
          <p className="text-sm text-gray-500">أدخل اسم القطعة والكمية المتوفرة</p>
        </div>

        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="اسم القطعة"
            rules={[{ required: true, message: "يرجى إدخال اسم القطعة" }]}
          >
            <Input size="large" placeholder="مثال: أفارول، كاب، نظارة..." />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="الكمية"
            rules={[
              { required: true, message: "يرجى إدخال الكمية" },
              { type: "number", min: 1, message: "يجب أن تكون الكمية أكبر من 0" }
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              placeholder="أدخل الكمية"
              min={1}
            />
          </Form.Item>
        </Form>

        <DialogFooter className="flex justify-between gap-2 mt-6">
          <Button onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={mutation.isPending}
          >
            {mutation.isPending ? "جارٍ الإضافة..." : "إضافة القطعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 