"use client";
import { useEffect, useState } from "react";
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

interface EditEmployeeProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: number;
    name: string;
    jobTitle: string;
    phoneNumber: string;
    nationalId: string;
    dailySalary: number;
  };
}

const updateEmployee = async (
  id: number,
  data: {
    name: string;
    jobTitle: string;
    phoneNumber: string;
    nationalId: string;
    dailySalary: number;
  }
) => {
  const response = await axios.put(`/api/employees/${id}`, data);
  return response.data;
};

export default function EditEmployee({
  isOpen,
  onClose,
  employee,
}: EditEmployeeProps) {
  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    phoneNumber: "",
    nationalId: "",
    dailySalary: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (employee && isOpen) {
      setForm({
        name: employee.name || "",
        jobTitle: employee.jobTitle || "",
        phoneNumber: employee.phoneNumber || "",
        nationalId: employee.nationalId || "",
        dailySalary: employee.dailySalary?.toString() || "",
      });
    }
  }, [employee, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      jobTitle: string;
      phoneNumber: string;
      nationalId: string;
      dailySalary: number;
    }) => updateEmployee(employee.id, data),
    onSuccess: () => {
      toast.success("تم تحديث الموظف بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث الموظف: ${error.response?.data?.error}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = () => {
    if (
      !form.name ||
      !form.jobTitle ||
      !form.phoneNumber ||
      !form.nationalId ||
      !form.dailySalary
    ) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const payload = {
      name: form.name,
      jobTitle: form.jobTitle,
      phoneNumber: form.phoneNumber,
      nationalId: form.nationalId,
      dailySalary: parseInt(form.dailySalary, 10),
    };

    mutation.mutate(payload);
  };

 
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تعديل بيانات الموظف
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
          </div>
          <div>
            <Input
              size="large"
              placeholder="المسمى الوظيفي"
              name="jobTitle"
              value={form.jobTitle}
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
              placeholder="الرقم القومي"
              name="nationalId"
              value={form.nationalId}
              onChange={handleInputChange}
            />
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
              isNaN(parseInt(form.dailySalary))
            }
            loading={mutation.isPending}
          >
            {mutation.isPending ? "جارٍ التعديل..." : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
