"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Input } from "antd";
import { toast } from "react-hot-toast";

interface NewSupplierProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSupplier({ isOpen, onClose }: NewSupplierProps) {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
  });
  const [errors, setErrors] = useState<any>({});

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post("/api/suppliers", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم إنشاء المورد بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setForm({ name: "", phoneNumber: "", address: "" });
      setErrors({});
      onClose();
    },
    onError: (error: any) => {
      toast.error(`فشل في إنشاء المورد: ${error.response?.data?.error}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let formErrors: any = {};
    if (!form.name) formErrors.name = "هذا الحقل مطلوب";
    if (!form.phoneNumber) formErrors.phoneNumber = "هذا الحقل مطلوب";
    if (!form.address) formErrors.address = "هذا الحقل مطلوب";
    return formErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      mutation.mutate(form);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مورد جديد</DialogTitle>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              size="large"
              placeholder="اسم المورد"
              name="name"
              value={form.name}
              onChange={handleInputChange}
            />
            {errors.name && (
              <span className="text-red-500 text-sm">{errors.name}</span>
            )}
          </div>
          <div>
            <Input
              size="large"
              placeholder="رقم الهاتف"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleInputChange}
            />
            {errors.phoneNumber && (
              <span className="text-red-500 text-sm">{errors.phoneNumber}</span>
            )}
          </div>
          <div>
            <Input
              size="large"
              placeholder="العنوان"
              name="address"
              value={form.address}
              onChange={handleInputChange}
            />
            {errors.address && (
              <span className="text-red-500 text-sm">{errors.address}</span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            loading={mutation.isPending}
          >
            إنشاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
