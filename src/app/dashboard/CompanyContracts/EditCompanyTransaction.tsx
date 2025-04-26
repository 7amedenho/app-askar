"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Input, Form, DatePicker, InputNumber, Select, Modal } from "antd";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

interface EditCompanyTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  companyId: number;
}

export default function EditCompanyTransaction({
  isOpen,
  onClose,
  transaction,
  companyId,
}: EditCompanyTransactionProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const statusOptions = [
    { value: "مكتمل", label: "مكتمل" },
    { value: "جارٍ التنفيذ", label: "جارٍ التنفيذ" },
    { value: "متوقف", label: "متوقف" },
    { value: "مفقود", label: "مفقود" },
  ];

  // تحميل بيانات المعاملة في النموذج عند فتح النافذة
  useEffect(() => {
    if (transaction && isOpen) {
      form.setFieldsValue({
        ...transaction,
        contractDate: transaction.contractDate ? dayjs(transaction.contractDate) : null,
        fileOpenDate: transaction.fileOpenDate ? dayjs(transaction.fileOpenDate) : null,
        certificateDate: transaction.certificateDate ? dayjs(transaction.certificateDate) : null,
      });
    }
  }, [transaction, isOpen, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/company-transactions/${transaction.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم تعديل معاملة الشركة بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["companyTransactions", companyId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`فشل في تعديل معاملة الشركة: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      title="تعديل معاملة الشركة"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      zIndex={1500}
    >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="py-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="projectName"
              label="اسم المشروع"
              rules={[{ required: true, message: "اسم المشروع مطلوب" }]}
              className="col-span-2"
            >
              <Input size="large" placeholder="اسم المشروع" />
            </Form.Item>

            <Form.Item
              name="contractNumber"
              label="رقم العقد"
              rules={[{ required: true, message: "رقم العقد مطلوب" }]}
            >
              <Input size="large" placeholder="رقم العقد" />
            </Form.Item>

            <Form.Item
              name="contractDate"
              label="تاريخ العقد"
              rules={[{ required: true, message: "تاريخ العقد مطلوب" }]}
            >
              <DatePicker size="large" style={{ width: "100%" }} placeholder="تاريخ العقد" />
            </Form.Item>

            <Form.Item
              name="fileOpenDate"
              label="تاريخ فتح الملف"
              rules={[{ required: true, message: "تاريخ فتح الملف مطلوب" }]}
            >
              <DatePicker size="large" style={{ width: "100%" }} placeholder="تاريخ فتح الملف" />
            </Form.Item>

            <Form.Item
              name="fileNumber"
              label="رقم الملف"
              rules={[{ required: true, message: "رقم الملف مطلوب" }]}
            >
              <Input size="large" placeholder="رقم الملف" />
            </Form.Item>

            <Form.Item
              name="percentage"
              label="النسبة (%)"
              rules={[{ required: true, message: "النسبة مطلوبة" }]}
            >
              <InputNumber
                size="large"
                style={{ width: "100%" }}
                placeholder="النسبة"
                min={0}
                max={100}
                step={0.01}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="contractValue"
              label="قيمة العقد"
              rules={[{ required: true, message: "قيمة العقد مطلوبة" }]}
            >
              <InputNumber
                size="large"
                style={{ width: "100%" }}
                placeholder="قيمة العقد"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="invoiceNumber"
              label="رقم الفاتورة"
            >
              <Input size="large" placeholder="رقم الفاتورة" />
            </Form.Item>

            <Form.Item
              name="invoiceValue"
              label="قيمة الفاتورة"
            >
              <InputNumber
                size="large"
                style={{ width: "100%" }}
                placeholder="قيمة الفاتورة"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="certificateNumber"
              label="رقم الشهادة"
            >
              <Input size="large" placeholder="رقم الشهادة" />
            </Form.Item>

            <Form.Item
              name="certificateDate"
              label="تاريخ الشهادة"
            >
              <DatePicker size="large" style={{ width: "100%" }} placeholder="تاريخ الشهادة" />
            </Form.Item>

            <Form.Item
              name="certificateValue"
              label="القيمة المدفوعة للشهادة"
            >
              <InputNumber
                size="large"
                style={{ width: "100%" }}
                placeholder="القيمة المدفوعة للشهادة"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="الحالة"
              rules={[{ required: true, message: "الحالة مطلوبة" }]}
            >
              <Select
                size="large"
                placeholder="اختر الحالة"
                options={statusOptions}
              />
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