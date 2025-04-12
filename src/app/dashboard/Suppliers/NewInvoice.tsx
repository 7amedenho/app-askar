"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        itemName: newItemForm.name,
        quantity: "",
        unitPrice: "",
        brand: newItemForm.brand,
        unit: newItemForm.unit,
        isNew: true,
      };
      return { ...prev, items: newItems };
    });
    setNewItemModal({ open: false, index: -1 });
    setNewItemForm({ name: "", unit: "", brand: "" });
  };

  // دالة لتحديد حاوية القائمة المنسدلة
  const getPopupContainer = (triggerNode: HTMLElement) => {
    return triggerNode.parentElement || document.body;
  };

  // التحكم في إغلاق الـ Dialog الرئيسي
  const handleDialogOpenChange = (open: boolean) => {
    if (!newItemModal.open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-6xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            إضافة فاتورة لـ {supplier.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          {/* اختيار نوع الفاتورة */}
          <div className="flex items-center justify-between gap-3">
            <label className="text-lg font-medium">نوع الفاتورة</label>
            <Select
              value={form.invoiceType}
              onChange={(value: "معدات" | "مستهلكات") =>
                setForm((prev) => ({ ...prev, invoiceType: value }))
              }
              className="w-64"
              getPopupContainer={getPopupContainer}
              size="large"
            >
              <Option value="معدات">معدات</Option>
              <Option value="مستهلكات">مستهلكات</Option>
            </Select>
            {errors.invoiceType && (
              <span className="text-red-500 text-sm">{errors.invoiceType}</span>
            )}
          </div>

          {/* قائمة الأصناف */}
          <div className="space-y-6">
            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-end"
              >
                <div className="flex flex-col gap-2">
                  {itemsLoading ? (
                    <Spin />
                  ) : (
                    <Select
                      showSearch
                      placeholder="اختر الصنف"
                      className="w-full"
                      onChange={(value) => handleSelectItem(value, index)}
                      value={
                        item.itemId?.toString() || item.itemName || undefined
                      }
                      filterOption={(input, option) =>
                        option?.children
                          ?.toString()
                          .toLowerCase()
                          .includes(input.toLowerCase()) ?? false
                      }
                      getPopupContainer={getPopupContainer}
                      size="large"
                    >
                      {itemsData.map((i) => (
                        <Option key={i.id} value={i.id.toString()}>
                          {i.name}
                        </Option>
                      ))}
                      <Option value="new">إضافة صنف جديد</Option>
                    </Select>
                  )}
                  {errors[`itemName${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`itemName${index}`]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="الكمية"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleInputChange(e, index, "quantity")}
                    className="w-full"
                    size="large"
                  />
                  {errors[`quantity${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`quantity${index}`]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="سعر الوحدة"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleInputChange(e, index, "unitPrice")}
                    className="w-full"
                    size="large"
                  />
                  {errors[`unitPrice${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`unitPrice${index}`]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="الماركة"
                    value={item.brand}
                    onChange={(e) => handleInputChange(e, index, "brand")}
                    className="w-full"
                    size="large"
                  />
                  {errors[`brand${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`brand${index}`]}
                    </span>
                  )}
                </div>
                {form.invoiceType === "مستهلكات" && (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="الوحدة"
                      value={item.unit}
                      disabled={!item.isNew}
                      onChange={(e) => handleInputChange(e, index, "unit")}
                      className="w-full"
                      size="large"
                    />
                    {errors[`unit${index}`] && (
                      <span className="text-red-500 text-sm">
                        {errors[`unit${index}`]}
                      </span>
                    )}
                  </div>
                )}
                <Button
                  type="text"
                  danger
                  onClick={() => removeItem(index)}
                  disabled={form.items.length === 1}
                  size="large"
                  className="h-10"
                >
                  حذف
                </Button>
              </div>
            ))}
            <Button
              onClick={addItem}
              type="dashed"
              size="large"
              className="w-full mt-4"
            >
              إضافة صنف
            </Button>
          </div>
        </div>
        <DialogFooter className="mt-8 flex justify-end gap-4">
          <Button onClick={onClose} size="large">
            إلغاء
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            loading={mutation.isPending}
            size="large"
          >
            إنشاء
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal لإضافة صنف جديد */}
      <Modal
        title="إضافة صنف جديد"
        open={newItemModal.open}
        onOk={handleNewItemSubmit}
        onCancel={() => setNewItemModal({ open: false, index: -1 })}
        okText="إضافة"
        cancelText="إلغاء"
        getContainer={() =>
          document.querySelector(".max-w-6xl") || document.body
        }
        width={500}
        maskClosable={false} // منع إغلاق الـ Modal عند النقر خارجها
      >
        <div className="space-y-6 p-4">
          <Input
            placeholder="اسم الصنف"
            value={newItemForm.name}
            onChange={(e) =>
              setNewItemForm((prev) => ({ ...prev, name: e.target.value }))
            }
            size="large"
          />
          <Input
            placeholder="الماركة"
            value={newItemForm.brand}
            onChange={(e) =>
              setNewItemForm((prev) => ({ ...prev, brand: e.target.value }))
            }
            size="large"
          />
          {form.invoiceType === "مستهلكات" && (
            <Input
              placeholder="الوحدة (طن، كيلو، ...)"
              value={newItemForm.unit}
              onChange={(e) =>
                setNewItemForm((prev) => ({ ...prev, unit: e.target.value }))
              }
              size="large"
            />
          )}
        </div>
      </Modal>
    </Dialog>
  );
}
