"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Form, Input, Select, Spin } from "antd";
import { toast } from "react-hot-toast";

const { Option } = Select;

interface Supplier {
  id: number;
  name: string;
}

interface EditEquipmentProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: any;
}

export default function EditEquipment({
  isOpen,
  onClose,
  equipment,
}: EditEquipmentProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axios.get("/api/suppliers");
      return response.data;
    },
  });

  useEffect(() => {
    if (equipment) {
      form.setFieldsValue({
        name: equipment.name,
        code: equipment.code,
        quantity: equipment.quantity,
        brand: equipment.brand || "",
        supplierId: equipment.supplierId,
      });
      setIsLoading(false);
    }
  }, [equipment, form]);

  const updateEquipmentMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.put(`/api/equipment/${equipment.id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("تم تحديث المعدة بنجاح");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء تحديث المعدة");
    },
  });

  const onFinish = (values: any) => {
    updateEquipmentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>تعديل المعدة</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="py-4"
          >
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

              <Form.Item
                name="brand"
                label="الماركة"
              >
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
        )}
        <DialogFooter>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={updateEquipmentMutation.isPending}
            disabled={updateEquipmentMutation.isPending}
          >
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
