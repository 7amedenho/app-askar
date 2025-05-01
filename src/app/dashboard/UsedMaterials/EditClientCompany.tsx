"use client";
import { Button, Form, Input, Modal, App } from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface ClientCompany {
  id: number;
  name: string;
  code: string;
  phoneNumber: string | null;
  address: string | null;
  email: string | null;
  contactName: string | null;
  invoices: any[];
  createdAt: string;
  updatedAt: string;
}

interface EditClientCompanyProps {
  onCancel: () => void;
  open: boolean;
  company: ClientCompany;
}

const EditClientCompany = ({ onCancel, open, company }: EditClientCompanyProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Update client company mutation
  const updateClientCompanyMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.put(`/api/client-companies/${company.id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientCompanies"] });
      toast.success("تم تحديث بيانات الشركة بنجاح");
      setIsFormDirty(false);
      onCancel();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء تحديث بيانات الشركة"
      );
    },
  });

  // Initialize form with company data
  useEffect(() => {
    if (open && company) {
      form.setFieldsValue({
        name: company.name,
        code: company.code,
        phoneNumber: company.phoneNumber,
        email: company.email,
        contactName: company.contactName,
        address: company.address,
      });
      setIsFormDirty(false);
    }
  }, [open, company, form]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await updateClientCompanyMutation.mutateAsync(values);
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

  return (
    <Modal
      title="تعديل بيانات الشركة"
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
              disabled
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

          {/* معلومات إضافية */}
          <div className="sm:col-span-2 bg-blue-50 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">معلومات الشركة:</p>
            <p>تاريخ التسجيل: {new Date(company.createdAt).toLocaleDateString('ar-EG')}</p>
            <p>عدد الفواتير: {company.invoices.length}</p>
          </div>

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
              حفظ التغييرات
            </Button>
          </div>
        </Form>
      </App>
    </Modal>
  );
};

export default EditClientCompany; 