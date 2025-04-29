"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Input, Select, Modal, Spin } from "antd";
import { toast } from "react-hot-toast";

const { Option } = Select;

// تعريف الأنواع
interface Supplier {
  id: number;
  name: string;
}

interface Item {
  itemId?: number;
  itemName: string;
  quantity: string;
  unitPrice: string;
  brand: string;
  unit?: string;
  isNew?: boolean;
}

interface Equipment {
  id: number;
  name: string;
  brand?: string;
}

interface Consumable {
  id: number;
  name: string;
  unit: string;
  brand?: string;
}

interface NewInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
}

interface FormState {
  invoiceType: "معدات" | "مستهلكات";
  items: Item[];
}

interface NewItemForm {
  name: string;
  unit: string;
  brand: string;
}

interface Errors {
  [key: string]: string;
}

export default function NewInvoice({
  isOpen,
  onClose,
  supplier,
}: NewInvoiceProps) {
  const [form, setForm] = useState<FormState>({
    invoiceType: "معدات",
    items: [{ itemName: "", quantity: "", unitPrice: "", brand: "", unit: "" }],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [newItemModal, setNewItemModal] = useState<{
    open: boolean;
    index: number;
  }>({
    open: false,
    index: -1,
  });
  const [newItemForm, setNewItemForm] = useState<NewItemForm>({
    name: "",
    unit: "",
    brand: "",
  });

  const queryClient = useQueryClient();

  // جلب الأصناف (معدات أو مستهلكات)
  const fetchItems = async (): Promise<Equipment[] | Consumable[]> => {
    const endpoint =
      form.invoiceType === "معدات" ? "/api/equipment" : "/api/consumables";
    const response = await axios.get(endpoint);
    return response.data;
  };

  const { data: itemsData = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items", form.invoiceType],
    queryFn: fetchItems,
  });

  // إنشاء فاتورة
  const mutation = useMutation({
    mutationFn: async (data: {
      invoiceType: string;
      items: Array<{
        itemId?: number;
        itemName: string;
        quantity: number;
        unitPrice: number;
        brand: string;
        unit?: string;
        isNew: boolean;
      }>;
    }) => {
      const response = await axios.post(
        `/api/suppliers/${supplier.id}/invoices`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم إنشاء الفاتورة بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setForm({
        invoiceType: "معدات",
        items: [
          { itemName: "", quantity: "", unitPrice: "", brand: "", unit: "" },
        ],
      });
      setErrors({});
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        `فشل في إنشاء الفاتورة: ${
          error.response?.data?.error || "خطأ غير معروف"
        }`
      );
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: keyof Item
  ) => {
    const { value } = e.target;
    setForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleSelectItem = (value: string, index: number) => {
    if (value === "new") {
      setNewItemModal({ open: true, index });
    } else {
      const selectedItem = itemsData.find(
        (item) => item.id === parseInt(value)
      );
      if (selectedItem) {
        setForm((prev) => {
          const newItems = [...prev.items];
          newItems[index] = {
            ...newItems[index],
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            unit:
              form.invoiceType === "مستهلكات"
                ? (selectedItem as Consumable).unit
                : "",
            brand: selectedItem.brand || "",
            isNew: false,
          };
          return { ...prev, items: newItems };
        });
      }
    }
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { itemName: "", quantity: "", unitPrice: "", brand: "", unit: "" },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): Errors => {
    const formErrors: Errors = {};
    if (!form.invoiceType) formErrors.invoiceType = "هذا الحقل مطلوب";
    form.items.forEach((item, index) => {
      if (!item.itemName && !item.itemId)
        formErrors[`itemName${index}`] = "اسم الصنف مطلوب";
      if (!item.quantity || isNaN(parseInt(item.quantity)))
        formErrors[`quantity${index}`] = "الكمية يجب أن تكون رقمًا";
      if (!item.unitPrice || isNaN(parseFloat(item.unitPrice)))
        formErrors[`unitPrice${index}`] = "السعر يجب أن يكون رقمًا";
      if (!item.brand) formErrors[`brand${index}`] = "الماركة مطلوبة";
      if (form.invoiceType === "مستهلكات" && !item.unit && item.isNew)
        formErrors[`unit${index}`] = "الوحدة مطلوبة للأصناف الجديدة";
    });
    return formErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      mutation.mutate({
        invoiceType: form.invoiceType,
        items: form.items.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: parseInt(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          brand: item.brand,
          unit: item.unit,
          isNew: item.isNew || false,
        })),
      });
    }
  };

  const handleNewItemSubmit = () => {
    if (
      !newItemForm.name ||
      (form.invoiceType === "مستهلكات" && !newItemForm.unit)
    ) {
      toast.error("يرجى إدخال اسم الصنف والوحدة (للمستهلكات)");
      return;
    }
    setForm((prev) => {
      const newItems = [...prev.items];
      newItems[newItemModal.index] = {
        ...newItems[newItemModal.index],
        itemName: newItemForm.name,
        brand: newItemForm.brand,
        unit: newItemForm.unit,
        isNew: true,
      };
      return { ...prev, items: newItems };
    });
    setNewItemForm({ name: "", unit: "", brand: "" });
    setNewItemModal({ open: false, index: -1 });
  };

  // التحكم في إغلاق الـ Modal الرئيسي
  const handleModalClose = () => {
    if (form.items.some((item) => item.itemName || item.quantity || item.unitPrice || item.brand)) {
      Modal.confirm({
        title: "هل أنت متأكد؟",
        content: "ستفقد جميع البيانات المدخلة إذا قمت بالإغلاق. هل تريد المتابعة؟",
        okText: "نعم",
        cancelText: "لا",
        onOk: () => {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleModalClose}
      title={<div className="text-2xl font-bold text-center mb-4">إنشاء فاتورة جديدة للمورد: {supplier.name}</div>}
      footer={[
        <Button key="cancel" onClick={handleModalClose}>إلغاء</Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          loading={mutation.isPending}
        >
          إنشاء الفاتورة
        </Button>
      ]}
      width={1200}
    >
      <div className="space-y-8">
        {/* اختيار نوع الفاتورة */}
        <div>
          <label className="block mb-2 font-semibold">نوع الفاتورة</label>
          <Select
            value={form.invoiceType}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, invoiceType: value }))
            }
            className="w-64"
            size="large"
          >
            <Option value="معدات">معدات</Option>
            <Option value="مستهلكات">مستهلكات</Option>
          </Select>
          {errors.invoiceType && (
            <p className="text-red-500 mt-1">{errors.invoiceType}</p>
          )}
        </div>

        {/* بنود الفاتورة */}
        <div>
          <h3 className="text-lg font-semibold mb-4">عناصر الفاتورة</h3>
          {itemsLoading ? (
            <div className="flex justify-center p-8">
              <Spin size="large" />
            </div>
          ) : (
            <div className="space-y-6">
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-4">
                  <div className="col-span-1">
                    <label className="block mb-2 text-sm">اسم الصنف</label>
                    <Select
                      value={item.itemId?.toString() || ""}
                      onChange={(value) => handleSelectItem(value, index)}
                      placeholder="اختر صنف"
                      showSearch
                      filterOption={(input, option) =>
                        option?.children
                          ?.toString()
                          .toLowerCase()
                          .includes(input.toLowerCase()) ?? false
                      }
                      size="large"
                    >
                      {itemsData.map((item) => (
                        <Option key={item.id} value={item.id.toString()}>
                          {item.name}
                        </Option>
                      ))}
                      <Option value="new">إضافة صنف جديد</Option>
                    </Select>
                    {errors[`itemName${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`itemName${index}`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">الكمية</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="الكمية"
                      value={item.quantity}
                      onChange={(e) => handleInputChange(e, index, "quantity")}
                      size="large"
                    />
                    {errors[`quantity${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`quantity${index}`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">سعر الوحدة</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="السعر"
                      value={item.unitPrice}
                      onChange={(e) => handleInputChange(e, index, "unitPrice")}
                      size="large"
                    />
                    {errors[`unitPrice${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`unitPrice${index}`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">الماركة</label>
                    <Input
                      placeholder="الماركة"
                      value={item.brand}
                      onChange={(e) => handleInputChange(e, index, "brand")}
                      size="large"
                    />
                    {errors[`brand${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`brand${index}`]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    {index > 0 && (
                      <Button
                        danger
                        onClick={() => removeItem(index)}
                        className="mb-0.5 ml-2"
                      >
                        حذف
                      </Button>
                    )}
                    {index === form.items.length - 1 && (
                      <Button
                        onClick={addItem}
                        type="primary"
                        className="mb-0.5"
                      >
                        إضافة صنف
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* New Item Modal */}
      <Modal
        open={newItemModal.open}
        onCancel={() => setNewItemModal({ open: false, index: -1 })}
        title={`إضافة ${form.invoiceType === "معدات" ? "معدات" : "مستهلكات"} جديدة`}
        footer={[
          <Button key="cancel" onClick={() => setNewItemModal({ open: false, index: -1 })}>
            إلغاء
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleNewItemSubmit}
          >
            إضافة
          </Button>
        ]}
      >
        <div className="space-y-6 p-4">
          <div>
            <label className="block mb-2">اسم الصنف</label>
            <Input
              placeholder="اسم الصنف"
              value={newItemForm.name}
              onChange={(e) =>
                setNewItemForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              size="large"
            />
          </div>
          {form.invoiceType === "مستهلكات" && (
            <div>
              <label className="block mb-2">الوحدة</label>
              <Input
                placeholder="الوحدة (متر، كيلو، عبوة، قطعة...)"
                value={newItemForm.unit}
                onChange={(e) =>
                  setNewItemForm((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
                size="large"
              />
            </div>
          )}
          <div>
            <label className="block mb-2">الماركة</label>
            <Input
              placeholder="الماركة"
              value={newItemForm.brand}
              onChange={(e) =>
                setNewItemForm((prev) => ({
                  ...prev,
                  brand: e.target.value,
                }))
              }
              size="large"
            />
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
