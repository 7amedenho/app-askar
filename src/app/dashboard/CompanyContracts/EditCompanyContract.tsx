"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Input, Form, Modal } from "antd";
import { toast } from "react-hot-toast";

interface EditCompanyContractProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

export default function EditCompanyContract({
  isOpen,
  onClose,
  company,
}: EditCompanyContractProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // تحميل بيانات الشركة في النموذج عند فتح النافذة
  useEffect(() => {
    if (company && isOpen) {
      form.setFieldsValue({
        name: company.name,
        phoneNumber: company.phoneNumber,
        email: company.email,
        address: company.address,
      });
    }
  }, [company, isOpen, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/company-contracts/${company.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم تعديل الشركة بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["companyContracts"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`فشل في تعديل الشركة: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      title="تعديل بيانات الشركة"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="py-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="اسم الشركة"
              rules={[{ required: true, message: "اسم الشركة مطلوب" }]}
              className="col-span-2"
            >
              <Input size="large" placeholder="اسم الشركة" />
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              label="رقم الهاتف"
            >
              <Input size="large" placeholder="رقم الهاتف" />
            </Form.Item>

            <Form.Item
              name="email"
              label="البريد الإلكتروني"
            >
              <Input size="large" placeholder="البريد الإلكتروني" />
            </Form.Item>

            <Form.Item
              name="address"
              label="العنوان"
              className="col-span-2"
            >
              <Input size="large" placeholder="العنوان" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="default" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              حفظ
            </Button>
          </div>
        </Form>
    </Modal>
  );
}