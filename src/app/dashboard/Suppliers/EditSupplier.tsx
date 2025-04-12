"use client";
import { useState, useEffect } from "react";
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

interface EditSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
}

export default function EditSupplier({
  isOpen,
  onClose,
  supplier,
}: EditSupplierProps) {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        phoneNumber: supplier.phoneNumber || "",
        address: supplier.address || "",
      });
    }
  }, [supplier]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/suppliers/${supplier.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم تعديل المورد بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`فشل في تعديل المورد: ${error.response?.data?.error}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.phoneNumber || !form.address) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات المورد</DialogTitle>
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
          </div>
          <div>
            <Input
              size="large"
              placeholder="رقم الهاتف"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Input
              size="large"
              placeholder="العنوان"
              name="address"
              value={form.address}
              onChange={handleInputChange}
            />
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
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
