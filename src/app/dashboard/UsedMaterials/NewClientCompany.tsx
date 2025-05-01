"use client";
import { Button, Form, Input, Modal, App } from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface NewClientCompanyProps {
  onCancel: () => void;
  open: boolean;
}

const NewClientCompany = ({ onCancel, open }: NewClientCompanyProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Create client company mutation
  const createClientCompanyMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post("/api/client-companies", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientCompanies"] });
      toast.success("تم إضافة الشركة بنجاح");
      form.resetFields();
      setIsFormDirty(false);
      onCancel();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء إضافة الشركة"
      );
    },
  });

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createClientCompanyMutation.mutateAsync(values);
    } finally {
      setLoading(false);
    }
  };

  // Track form changes
  const handleValuesChange = () => {
    setIsFormDirty(true);
  };

  // Confirm modal close if form has changes
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

  // Generate random company code
  const generateCompanyCode = () => {
    const prefix = "CO";
    const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${randomNumbers}`;
  };

  // Set default code when the form is first opened
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        code: generateCompanyCode(),
      });
    }
  }, [open, form]);

  return (
    <Modal
      title="إضافة شركة جديدة"
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
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4"
        >
          {/* اسم الشركة */}
          <Form.Item
            name="name"
            label="اسم الشركة"
            rules={[{ required: true, message: "الرجاء إدخال اسم الشركة" }]}
          >
            <Input
              placeholder="أدخل اسم الشركة"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* كود الشركة */}
          <Form.Item
            name="code"
            label="كود الشركة"
            rules={[{ required: true, message: "الرجاء إدخال كود الشركة" }]}
          >
            <Input
              placeholder="أدخل كود الشركة"
              className="rounded-lg border-gray-300"
              size="large"
              addonAfter={
                <Button 
                  type="text" 
                  size="small"
                  onClick={() => {
                    form.setFieldsValue({ code: generateCompanyCode() });
                    setIsFormDirty(true);
                  }}
                >
                  توليد
                </Button>
              }
            />
          </Form.Item>

          {/* رقم الهاتف */}
          <Form.Item
            name="phoneNumber"
            label="رقم الهاتف"
          >
            <Input
              placeholder="أدخل رقم الهاتف"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* البريد الإلكتروني */}
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[
              {
                type: 'email',
                message: 'الرجاء إدخال بريد إلكتروني صحيح',
              },
            ]}
          >
            <Input
              placeholder="أدخل البريد الإلكتروني"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* اسم جهة الاتصال */}
          <Form.Item
            name="contactName"
            label="اسم جهة الاتصال"
          >
            <Input
              placeholder="أدخل اسم جهة الاتصال"
              className="rounded-lg border-gray-300"
              size="large"
            />
          </Form.Item>

          {/* العنوان */}
          <Form.Item
            name="address"
            label="العنوان"
            className="sm:col-span-2"
          >
            <Input.TextArea
              placeholder="أدخل عنوان الشركة"
              className="rounded-lg border-gray-300"
              rows={3}
            />
          </Form.Item>

          {/* أزرار التحكم */}
          <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
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

export default NewClientCompany; 