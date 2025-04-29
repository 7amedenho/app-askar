"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Input, InputNumber, Form, Modal } from "antd";
import { toast } from "react-hot-toast";

interface InvoicePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  supplier: any;
}

export default function InvoicePayment({
  isOpen,
  onClose,
  invoice,
  supplier,
}: InvoicePaymentProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  const remainingAmount = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  
  // Mutation for processing payment
  const paymentMutation = useMutation({
    mutationFn: async (values: { amount: number; notes: string }) => {
      // First update the invoice paidAmount
      const newPaidAmount = Number(invoice.paidAmount) + values.amount;
      const newStatus = newPaidAmount >= Number(invoice.totalAmount) 
        ? "paid" 
        : newPaidAmount > 0 
          ? "partially_paid" 
          : "pending";
      
      // Update invoice
      await axios.put(`/api/invoices/${invoice.id}`, {
        paidAmount: newPaidAmount,
        status: newStatus
      });
      
      // Create supplier payment record
      return axios.post(`/api/suppliers/${supplier.id}/payments`, {
        amount: values.amount,
        notes: `دفعة فاتورة رقم ${invoice.id} - ${values.notes || ''}`
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplierStatement"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`فشل في تسجيل الدفعة: ${error.response?.data?.error || "خطأ غير معروف"}`);
    },
  });

  const handleSubmit = (values: any) => {
    if (values.amount <= 0) {
      toast.error("يجب أن يكون المبلغ أكبر من صفر");
      return;
    }
    
    if (values.amount > remainingAmount) {
      toast.error("المبلغ المدخل أكبر من المبلغ المتبقي للفاتورة");
      return;
    }
    
    paymentMutation.mutate(values);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<div className="text-xl font-bold text-center">تسجيل دفعة لفاتورة #{invoice.id}</div>}
      footer={null}
      width={600}
    >
      <div className="py-4">
        <div className="mb-6 p-4 rounded-md" style={{ border: "1px solid #f0f0f0" }}>
          <p className="mb-2"><span className="font-bold">المورد:</span> {supplier.name}</p>
          <p className="mb-2"><span className="font-bold">نوع الفاتورة:</span> {invoice.invoiceType}</p>
          <p className="mb-2"><span className="font-bold">إجمالي الفاتورة:</span> {Number(invoice.totalAmount).toLocaleString()} ج.م</p>
          <p className="mb-2"><span className="font-bold">المدفوع:</span> {Number(invoice.paidAmount).toLocaleString()} ج.م</p>
          <p className="mb-2"><span className="font-bold">المتبقي:</span> {remainingAmount.toLocaleString()} ج.م</p>
        </div>
        
        <Form 
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ amount: remainingAmount, notes: '' }}
        >
          <Form.Item 
            name="amount" 
            label="المبلغ" 
            rules={[{ required: true, message: 'المبلغ مطلوب' }]}
          >
            <InputNumber 
              className="w-full" 
              min={1} 
              max={remainingAmount}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value ? Number(value.replace(/[^\d.-]/g, '')) : 0}
            />
          </Form.Item>
          
          <Form.Item 
            name="notes" 
            label="ملاحظات"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={paymentMutation.isPending}
              disabled={paymentMutation.isPending}
            >
              تسجيل الدفعة
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
} 