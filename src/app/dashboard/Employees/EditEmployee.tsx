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
import { Button, Input, Modal, Switch, Tooltip } from "antd";
import { toast } from "react-hot-toast";
import { QuestionCircleOutlined } from "@ant-design/icons";

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
    isActive: boolean;
    fingerprint?: string | null;
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
    isActive: boolean;
    fingerprint?: string | null;
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
    isActive: true,
    fingerprint: "",
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
        isActive: employee.isActive !== false, // Default to true if undefined
        fingerprint: employee.fingerprint || "",
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
      isActive: boolean;
      fingerprint?: string | null;
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

  const handleSwitchChange = (checked: boolean) => {
    setForm((prevForm) => ({ ...prevForm, isActive: checked }));
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
      isActive: form.isActive,
      fingerprint: form.fingerprint || null,
    };

    mutation.mutate(payload);
  };

 
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="تعديل بيانات الموظف"
      footer={[
        <Button key="cancel" onClick={onClose}>إلغاء</Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          loading={mutation.isPending}
        >
          حفظ
        </Button>
      ]}
    >
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
        <div className="flex items-center">
          <span className="ml-2">موظف نشط</span>
          <Switch 
            checked={form.isActive} 
            onChange={handleSwitchChange} 
            checkedChildren="نشط" 
            unCheckedChildren="غير نشط"
          />
        </div>
        <div className="col-span-2">
          <Input
            size="large"
            placeholder="معرف البصمة"
            name="fingerprint"
            value={form.fingerprint}
            onChange={handleInputChange}
            suffix={
              <Tooltip title="أدخل معرف الموظف من نظام البصمة ZKTeco لاستخدامه في تحميل بيانات الحضور والانصراف">
                <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
              </Tooltip>
            }
          />
        </div>
      </div>
    </Modal>
  );
}
