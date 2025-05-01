"use client";
import { useEffect, useState } from "react";
import { Modal, Button, Descriptions, Table, Tag, Divider, Steps } from "antd";
import { PrinterOutlined, EditOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { Package, Wrench, Building, FileText, Truck, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface MaterialInvoiceItem {
  id: number;
  invoiceId: number;
  itemType: string;
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
}

interface MaterialInvoice {
  id: number;
  clientCompanyId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  items: MaterialInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

interface ClientCompany {
  id: number;
  name: string;
  code: string;
  phoneNumber: string | null;
  address: string | null;
  email: string | null;
  contactName: string | null;
}

interface InvoiceDetailsProps {
  onCancel: () => void;
  open: boolean;
  invoice: MaterialInvoice;
}

const { Step } = Steps;

const InvoiceDetails = ({ onCancel, open, invoice }: InvoiceDetailsProps) => {
  const queryClient = useQueryClient();
  const [company, setCompany] = useState<ClientCompany | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch company details
  const fetchCompany = async () => {
    const response = await axios.get(`/api/client-companies/${invoice.clientCompanyId}`);
    setCompany(response.data);
  };

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await axios.patch(`/api/material-invoices/${invoice.id}`, { 
        status 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialInvoices"] });
      toast.success("تم تحديث حالة الفاتورة بنجاح");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء تحديث حالة الفاتورة"
      );
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/material-invoices/${invoice.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialInvoices"] });
      toast.success("تم حذف الفاتورة بنجاح");
      onCancel();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء حذف الفاتورة"
      );
    },
  });

  useEffect(() => {
    if (open && invoice) {
      fetchCompany();
    }
  }, [open, invoice]);

  // Handle invoice status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Handle invoice delete
  const handleDelete = () => {
    setConfirmDelete(true);
  };

  // Confirm delete
  const confirmInvoiceDelete = () => {
    deleteInvoiceMutation.mutate();
  };

  // Handle print invoice
  const handlePrint = () => {
    window.print();
  };

  // Table columns for invoice items
  const columns = [
    {
      title: 'الصنف',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text: string, record: MaterialInvoiceItem) => (
        <div className="flex items-center gap-2">
          {record.itemType === 'equipment' ? (
            <Wrench size={16} className="text-blue-500" />
          ) : (
            <Package size={16} className="text-green-500" />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'النوع',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (text: string) => (
        <Tag color={text === 'equipment' ? 'blue' : 'green'}>
          {text === 'equipment' ? 'معدات' : 'مستهلكات'}
        </Tag>
      ),
    },
    {
      title: 'الكمية',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'سعر الوحدة',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (price: number) => (
        <span>{price.toLocaleString()} جنيه</span>
      ),
    },
    {
      title: 'الإجمالي',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      render: (price: number) => (
        <span className="font-bold">{price.toLocaleString()} جنيه</span>
      ),
    },
  ];

  // Get current step based on status
  const getCurrentStep = () => {
    switch (invoice.status) {
      case 'pending':
        return 0;
      case 'completed':
        return 1;
      case 'canceled':
        return 2;
      default:
        return 0;
    }
  };

  return (
    <Modal
      title={`تفاصيل الفاتورة #${invoice.invoiceNumber}`}
      open={open}
      onCancel={onCancel}
      width={1000}
      className="rounded-lg print:shadow-none"
      footer={
        <div className="flex justify-between items-center">
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            className="print:hidden"
          >
            حذف الفاتورة
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={onCancel}
              icon={<CloseOutlined />}
              className="print:hidden"
            >
              إغلاق
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              className="print:hidden"
            >
              طباعة
            </Button>
          </div>
        </div>
      }
    >
      <div className="invoice-details p-4">
        {/* Logo and Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">فاتورة توريد مواد</h1>
            <p className="text-gray-500">شركة عسكر للمقاولات</p>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold">#{invoice.invoiceNumber}</h2>
            <p className="text-gray-500">
              تاريخ: {new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="mb-6 print:hidden">
          <Steps
            current={getCurrentStep()}
            items={[
              {
                title: 'معلقة',
                description: 'الفاتورة معلقة',
                status: invoice.status === 'pending' ? 'process' : (invoice.status === 'completed' ? 'finish' : 'wait'),
              },
              {
                title: 'مكتملة',
                description: 'تم تنفيذ الفاتورة',
                status: invoice.status === 'completed' ? 'finish' : 'wait',
              },
              {
                title: 'ملغاة',
                description: 'تم إلغاء الفاتورة',
                status: invoice.status === 'canceled' ? 'error' : 'wait',
              },
            ]}
          />
        </div>

        {/* Status Actions */}
        <div className="mb-6 flex gap-2 justify-center print:hidden">
          <Button
            type={invoice.status === 'pending' ? 'primary' : 'default'}
            onClick={() => handleStatusChange('pending')}
            disabled={invoice.status === 'pending'}
          >
            تعليق
          </Button>
          <Button
            type={invoice.status === 'completed' ? 'primary' : 'default'}
            onClick={() => handleStatusChange('completed')}
            disabled={invoice.status === 'completed'}
            style={{ backgroundColor: invoice.status === 'completed' ? '#52c41a' : '', borderColor: invoice.status === 'completed' ? '#52c41a' : '' }}
          >
            إكمال
          </Button>
          <Button
            danger
            type={invoice.status === 'canceled' ? 'primary' : 'default'}
            onClick={() => handleStatusChange('canceled')}
            disabled={invoice.status === 'canceled'}
          >
            إلغاء
          </Button>
        </div>

        <Divider />

        {/* Company and Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Building size={18} />
              <span>معلومات الشركة</span>
            </h3>
            {company && (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="اسم الشركة">{company.name}</Descriptions.Item>
                <Descriptions.Item label="كود الشركة">{company.code}</Descriptions.Item>
                {company.phoneNumber && (
                  <Descriptions.Item label="رقم الهاتف">{company.phoneNumber}</Descriptions.Item>
                )}
                {company.contactName && (
                  <Descriptions.Item label="جهة الاتصال">{company.contactName}</Descriptions.Item>
                )}
                {company.address && (
                  <Descriptions.Item label="العنوان">{company.address}</Descriptions.Item>
                )}
              </Descriptions>
            )}
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <FileText size={18} />
              <span>معلومات الفاتورة</span>
            </h3>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="رقم الفاتورة">{invoice.invoiceNumber}</Descriptions.Item>
              <Descriptions.Item label="تاريخ الفاتورة">
                {new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}
              </Descriptions.Item>
              {invoice.dueDate && (
                <Descriptions.Item label="تاريخ الاستحقاق">
                  {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="حالة الفاتورة">
                <Tag color={
                  invoice.status === 'pending' ? 'gold' :
                  invoice.status === 'completed' ? 'green' : 'red'
                }>
                  {invoice.status === 'pending' ? 'معلقة' :
                   invoice.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="المبلغ الإجمالي">
                <span className="font-bold">{invoice.totalAmount.toLocaleString()} جنيه</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Truck size={18} />
            <span>أصناف الفاتورة</span>
          </h3>
          <Table
            columns={columns}
            dataSource={invoice.items}
            pagination={false}
            rowKey="id"
            bordered
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                    الإجمالي
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} className="font-bold text-base">
                    {invoice.totalAmount.toLocaleString()} جنيه
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">ملاحظات</h3>
            <div className="border p-4 rounded-lg bg-gray-50">
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Print Footer - only visible when printing */}
        <div className="hidden print:block mt-12 text-center text-gray-500 text-sm">
          <p>تم إصدار هذه الفاتورة من نظام إدارة شركة عسكر للمقاولات</p>
          <p>{new Date().toLocaleDateString('ar-EG')} {new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="تأكيد الحذف"
        open={confirmDelete}
        onOk={confirmInvoiceDelete}
        onCancel={() => setConfirmDelete(false)}
        okText="حذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true }}
      >
        <p>هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.</p>
      </Modal>
    </Modal>
  );
};

export default InvoiceDetails; 