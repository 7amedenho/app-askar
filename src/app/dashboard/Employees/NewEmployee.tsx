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

interface NewEmployeeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewEmployee({ isOpen, onClose }: NewEmployeeProps) {
  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    phoneNumber: "",
    nationalId: "",
    dailySalary: "",
  });

  const [errors, setErrors] = useState<any>({});

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post("/api/employees", {
        ...data,
        dailySalary: parseFloat(data.dailySalary), // تحويل إلى عدد
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم إنشاء الموظف بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setForm({
        name: "",
        jobTitle: "",
        phoneNumber: "",
        nationalId: "",
        dailySalary: "",
      });
      setErrors({});
      onClose();
    },
    onError: (error: any) => {
      console.error("خطأ أثناء إنشاء الموظف:", error);
      const errorMessage =
        error.response?.data?.error || "حدث خطأ أثناء إنشاء الموظف!";
      toast.error(errorMessage);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const validateForm = () => {
    let formErrors: any = {};
    if (!form.name) formErrors.name = "هذا الحقل مطلوب";
    if (!form.jobTitle) formErrors.jobTitle = "هذا الحقل مطلوب";
    if (!form.phoneNumber) formErrors.phoneNumber = "هذا الحقل مطلوب";
    if (!form.nationalId) formErrors.nationalId = "هذا الحقل مطلوب";
    if (!form.dailySalary) {
      formErrors.dailySalary = "هذا الحقل مطلوب";
    } else if (isNaN(parseFloat(form.dailySalary))) {
      formErrors.dailySalary = "الراتب اليومي يجب أن يكون رقمًا صالحًا";
    }
    return formErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      console.log("البيانات المرسلة:", form);
      mutation.mutate(form);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            إضافة موظف جديد
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              size="large"
              placeholder="اسم الموظف"
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
              placeholder="المسمى الوظيفي"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleInputChange}
            />
            {errors.jobTitle && (
              <span className="text-red-500 text-sm">{errors.jobTitle}</span>
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
              placeholder="الرقم القومي"
              name="nationalId"
              value={form.nationalId}
              onChange={handleInputChange}
            />
            {errors.nationalId && (
              <span className="text-red-500 text-sm">{errors.nationalId}</span>
            )}
          </div>

          <div>
            <Input
              size="large"
              placeholder="الراتب اليومي"
              type="number"
              name="dailySalary"
              value={form.dailySalary}
              onChange={handleInputChange}
            />
            {errors.dailySalary && (
              <span className="text-red-500 text-sm">{errors.dailySalary}</span>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black"
          >
            إلغاء
          </Button>
          <Button
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !form.name ||
              !form.jobTitle ||
              !form.phoneNumber ||
              !form.nationalId ||
              !form.dailySalary ||
              isNaN(parseFloat(form.dailySalary))
            }
            loading={mutation.isPending}
          >
            {mutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الموظف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
