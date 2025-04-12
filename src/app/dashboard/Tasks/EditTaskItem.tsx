"use client";

import { useEffect } from "react";
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

interface EditTaskItemProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: {
    id: number;
    name: string;
    quantity: number;
  };
}

export default function EditTaskItem({ isOpen, onClose, taskItem }: EditTaskItemProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (taskItem) {
      form.setFieldsValue({
        name: taskItem.name,
        quantity: taskItem.quantity,
      });
    }
  }, [taskItem, form]);
  
  const mutation = useMutation({
    mutationFn: async (data: { name: string; quantity: number }) => {
      const response = await axios.put(`/api/tasks/${taskItem.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskItems"] });
      toast.success("تم تحديث القطعة بنجاح");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تحديث القطعة");
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
            تعديل بيانات القطعة
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="font-semibold">تعديل: {taskItem.name}</p>
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
              { type: "number", min: 0, message: "يجب أن تكون الكمية 0 أو أكبر" }
            ]}
          >
            <InputNumber 
              size="large" 
              style={{ width: "100%" }} 
              placeholder="أدخل الكمية" 
              min={0}
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
            {mutation.isPending ? "جارٍ التحديث..." : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 