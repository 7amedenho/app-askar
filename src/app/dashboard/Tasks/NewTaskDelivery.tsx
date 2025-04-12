"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Input, InputNumber, Form, Select, DatePicker } from "antd";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

interface NewTaskDeliveryProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: {
    id: number;
    name: string;
    quantity: number;
  };
}

const { Option } = Select;
const { TextArea } = Input;

export default function NewTaskDelivery({ isOpen, onClose, taskItem }: NewTaskDeliveryProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  // Initialize form with current date
  useEffect(() => {
    form.setFieldsValue({
      taskItemId: taskItem.id,
      date: dayjs(),
      quantity: 1
    });
  }, [form, taskItem]);
  
  // Fetch employees
  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axios.get("/api/employees");
      return response.data;
    }
  });
  
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post("/api/tasks/deliveries", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskItems", "taskDeliveries"] });
      toast.success("تم تسجيل التسليم بنجاح");
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تسجيل التسليم");
    },
  });
  
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      // Convert date object to string
      const data = {
        ...values,
        date: values.date.toISOString(),
      };
      
      mutation.mutate(data);
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تسليم قطعة لموظف
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="font-semibold">القطعة: {taskItem.name}</p>
          <p className="text-gray-600">الكمية المتاحة: <span className={taskItem.quantity > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{taskItem.quantity}</span></p>
        </div>
        
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="taskItemId" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item
            name="employeeId"
            label="الموظف"
            rules={[{ required: true, message: "يرجى اختيار الموظف" }]}
          >
            <Select
              showSearch
              placeholder="اختر الموظف"
              optionFilterProp="children"
              loading={isEmployeesLoading}
              size="large"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees.map((employee: any) => (
                <Option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.jobTitle}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="quantity"
            label="الكمية"
            rules={[
              { required: true, message: "يرجى إدخال الكمية" },
              { type: "number", min: 1, message: "يجب أن تكون الكمية أكبر من 0" },
              {
                validator: (_, value) => {
                  if (value > taskItem.quantity) {
                    return Promise.reject("الكمية أكبر من المتاح في المخزون");
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              placeholder="أدخل الكمية"
              min={1}
              max={taskItem.quantity}
            />
          </Form.Item>
          
          <Form.Item
            name="date"
            label="تاريخ التسليم"
            rules={[{ required: true, message: "يرجى اختيار تاريخ التسليم" }]}
          >
            <DatePicker 
              size="large" 
              style={{ width: "100%" }} 
              format="YYYY-MM-DD"
            />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="ملاحظات"
          >
            <TextArea
              rows={3}
              placeholder="أي ملاحظات إضافية"
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
            disabled={taskItem.quantity <= 0}
          >
            {mutation.isPending ? "جارٍ التسليم..." : "تسليم القطعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 