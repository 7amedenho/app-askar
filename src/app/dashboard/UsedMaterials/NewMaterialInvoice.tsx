"use client";
import { Button, Form, Input, Modal, App, Select, DatePicker, InputNumber, Table, Space, Switch } from "antd";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Package, Wrench } from "lucide-react";
import dayjs from "dayjs";

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

interface InvoiceItem {
  key: string;
  itemType: string; // "inventory_equipment" or "inventory_consumable"
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface InventoryEquipment {
  id: number;
  name: string;
  code: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  status: string;
  notes?: string;
}

interface InventoryConsumable {
  id: number;
  name: string;
  code: string;
  unit: string;
  brand: string | null;
  stock: number;
  baseQuantity: number;
}

interface NewMaterialInvoiceProps {
  onCancel: () => void;
  open: boolean;
  company: ClientCompany;
}

const { Option } = Select;

const NewMaterialInvoice = ({ onCancel, open, company }: NewMaterialInvoiceProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Fetch inventory equipment
  const { data: inventoryEquipment = [], refetch: refetchEquipment } = useQuery<InventoryEquipment[]>({
    queryKey: ["inventoryEquipment"],
    queryFn: async () => {
      const response = await axios.get("/api/inventory-equipment");
      return response.data;
    },
  });

  // Fetch inventory consumables
  const { data: inventoryConsumables = [], refetch: refetchConsumables } = useQuery<InventoryConsumable[]>({
    queryKey: ["inventoryConsumables"],
    queryFn: async () => {
      const response = await axios.get("/api/inventory-consumables");
      return response.data;
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post("/api/material-invoices", values);
      return response.data;
    },
    onSuccess: () => {
      // Refetch all related data to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ["materialInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["clientCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryConsumables"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryEquipment"] });
      
      // Directly refetch to ensure immediate update
      refetchConsumables();
      refetchEquipment();
      
      toast.success("تم إنشاء الفاتورة بنجاح");
      form.resetFields();
      setItems([]);
      setTotalAmount(0);
      setIsFormDirty(false);
      onCancel();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "حدث خطأ أثناء إنشاء الفاتورة"
      );
    },
  });

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${randomNumbers}`;
  };

  // Initialize form with default values
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        clientCompanyId: company.id,
        clientCompanyName: company.name,
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: dayjs(),
        status: "pending",
      });
      setIsFormDirty(false);
    }
  }, [open, company, form]);

  // Track form changes
  const handleValuesChange = () => {
    setIsFormDirty(true);
  };

  // Confirm modal close if form has changes
  const handleCancel = () => {
    if (isFormDirty || items.length > 0) {
      Modal.confirm({
        title: "هل أنت متأكد؟",
        content: "لديك تغييرات غير محفوظة، هل تريد الإغلاق؟",
        okText: "نعم",
        cancelText: "لا",
        onOk: () => {
          form.resetFields();
          setItems([]);
          setTotalAmount(0);
          setIsFormDirty(false);
          onCancel();
        },
      });
    } else {
      form.resetFields();
      setItems([]);
      setTotalAmount(0);
      onCancel();
    }
  };

  // Add new item to invoice
  const addItem = () => {
    const newItem: InvoiceItem = {
      key: Date.now().toString(),
      itemType: "",
      itemId: 0,
      itemName: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
    setIsFormDirty(true);
  };

  // Remove item from invoice
  const removeItem = (key: string) => {
    const updatedItems = items.filter(item => item.key !== key);
    setItems(updatedItems);

    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotalAmount(newTotal);

    setIsFormDirty(true);
  };

  // Update item details
  const updateItem = (key: string, field: string, value: any) => {
    const updatedItems = items.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };

        // Update item name when item type and id change
        if (field === 'itemType' || field === 'itemId') {
          if (updatedItem.itemType === 'inventory_equipment' && updatedItem.itemId) {
            const selectedEquipment = inventoryEquipment.find(e => e.id === updatedItem.itemId);
            if (selectedEquipment) {
              updatedItem.itemName = selectedEquipment.name;
            }
          } else if (updatedItem.itemType === 'inventory_consumable' && updatedItem.itemId) {
            const selectedConsumable = inventoryConsumables.find(c => c.id === updatedItem.itemId);
            if (selectedConsumable) {
              updatedItem.itemName = selectedConsumable.name;
            }
          }
        }

        // Recalculate total price when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
        }

        return updatedItem;
      }
      return item;
    });

    setItems(updatedItems);

    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotalAmount(newTotal);

    setIsFormDirty(true);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      toast.error("الرجاء إضافة أصناف إلى الفاتورة");
      return;
    }

    setLoading(true);
    try {
      const formattedItems = items.map(item => {
        let inventoryConsumableId = null;
        let inventoryEquipmentId = null;

        if (item.itemType === 'inventory_consumable') {
          inventoryConsumableId = item.itemId;
        } else if (item.itemType === 'inventory_equipment') {
          inventoryEquipmentId = item.itemId;
        }

        return {
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes || null,
          inventoryConsumableId,
          inventoryEquipmentId
        };
      });

      const invoiceData = {
        ...values,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        totalAmount,
        paidAmount: 0,
        items: formattedItems,
        updateInventory: true, // Ensure this flag is set to update inventory quantities
      };

      await createInvoiceMutation.mutateAsync(invoiceData);
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'نوع الصنف',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (_: any, record: InvoiceItem) => (
        <Select
          placeholder="اختر النوع"
          value={record.itemType || undefined}
          onChange={value => updateItem(record.key, 'itemType', value)}
          className="w-full"
          size="middle"
        >
          <Option value="inventory_equipment">
            <div className="flex items-center gap-2">
              <Wrench size={16} />
              <span>معدات</span>
            </div>
          </Option>
          <Option value="inventory_consumable">
            <div className="flex items-center gap-2">
              <Package size={16} />
              <span>مستهلكات</span>
            </div>
          </Option>
        </Select>
      ),
    },
    {
      title: 'الصنف',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (_: any, record: InvoiceItem) => (
        <Select
          placeholder="اختر الصنف"
          value={record.itemId || undefined}
          onChange={value => updateItem(record.key, 'itemId', value)}
          className="w-full"
          size="middle"
          disabled={!record.itemType}
        >
          {record.itemType === 'inventory_equipment' && inventoryEquipment.map(item => (
            <Option key={item.id} value={item.id}>
              {item.name} {item.brand ? `(${item.brand})` : ''} {item.model ? `- ${item.model}` : ''}
            </Option>
          ))}
          {record.itemType === 'inventory_consumable' && inventoryConsumables.map(item => (
            <Option key={item.id} value={item.id}>
              {item.name} {item.brand ? `(${item.brand})` : ''} - {item.unit}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'الكمية',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: InvoiceItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={value => updateItem(record.key, 'quantity', value)}
          className="w-full"
          max={record.itemType === 'inventory_consumable' && record.itemId ?
            inventoryConsumables.find(c => c.id === record.itemId)?.stock :
            record.itemType === 'inventory_equipment' && record.itemId ?
              inventoryEquipment.find(e => e.id === record.itemId)?.quantity :
              undefined}
        />
      ),
    },
    {
      title: 'سعر الوحدة',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (_: any, record: InvoiceItem) => (
        <InputNumber
          min={0}
          step={0.01}
          value={record.unitPrice}
          onChange={value => updateItem(record.key, 'unitPrice', value)}
          className="w-full"
          addonAfter="جنيه"
        />
      ),
    },
    {
      title: 'الإجمالي',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      render: (_: any, record: InvoiceItem) => (
        <span className="font-bold">{record.totalPrice.toLocaleString()} جنيه</span>
      ),
    },
    {
      title: 'الإجراءات',
      key: 'action',
      width: 80,
      render: (_: any, record: InvoiceItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      title="إنشاء فاتورة جديدة"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={1000}
      className="rounded-lg"
      maskClosable={false}
      destroyOnClose={true}
    >
      <App>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          preserve={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
            {/* معلومات الشركة - غير قابلة للتعديل */}
            <Form.Item
              name="clientCompanyName"
              label="اسم الشركة"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              name="clientCompanyId"
              label="معرف الشركة"
              hidden
            >
              <Input type="hidden" />
            </Form.Item>

            {/* رقم الفاتورة */}
            <Form.Item
              name="invoiceNumber"
              label="رقم الفاتورة"
              rules={[{ required: true, message: "الرجاء إدخال رقم الفاتورة" }]}
            >
              <Input placeholder="أدخل رقم الفاتورة" />
            </Form.Item>

            {/* تاريخ الفاتورة */}
            <Form.Item
              name="invoiceDate"
              label="تاريخ الفاتورة"
              rules={[{ required: true, message: "الرجاء تحديد تاريخ الفاتورة" }]}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>

            {/* تاريخ الاستحقاق (اختياري) */}
            <Form.Item
              name="dueDate"
              label="تاريخ الاستحقاق (اختياري)"
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>

            {/* حالة الفاتورة */}
            <Form.Item
              name="status"
              label="حالة الفاتورة"
              rules={[{ required: true, message: "الرجاء تحديد حالة الفاتورة" }]}
            >
              <Select placeholder="اختر الحالة">
                <Option value="pending">معلقة</Option>
                <Option value="completed">مكتملة</Option>
                <Option value="canceled">ملغاة</Option>
              </Select>
            </Form.Item>

            {/* ملاحظات (اختياري) */}
            <Form.Item
              name="notes"
              label="ملاحظات"
              className="col-span-3"
            >
              <Input.TextArea rows={2} placeholder="أدخل أي ملاحظات إضافية" />
            </Form.Item>
          </div>

          {/* جدول الأصناف */}
          <div className="border rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">الأصناف</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addItem}
              >
                إضافة صنف
              </Button>
            </div>

            <Table
              dataSource={items}
              columns={columns}
              pagination={false}
              rowKey="key"
              locale={{ emptyText: "اضغط على زر إضافة صنف لإضافة الأصناف إلى الفاتورة" }}
            />

            <div className="flex justify-end mt-6">
              <div className="p-4 rounded-md w-64">
                <div className="flex justify-between items-center font-bold text-lg mb-2">
                  <span>الإجمالي:</span>
                  <span>{totalAmount.toLocaleString()} جنيه</span>
                </div>
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleCancel}
              className="text-gray-500"
              size="large"
            >
              إلغاء
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              disabled={items.length === 0}
            >
              إنشاء الفاتورة
            </Button>
          </div>
        </Form>
      </App>
    </Modal>
  );
};

export default NewMaterialInvoice; 