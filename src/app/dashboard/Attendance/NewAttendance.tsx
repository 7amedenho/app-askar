"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Input, AutoComplete, DatePicker, TimePicker } from "antd";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

interface NewAttendanceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Employee {
  id: number;
  name: string;
  jobTitle: string;
  nationalId: string;
  dailySalary: number;
}

export default function NewAttendance({ isOpen, onClose }: NewAttendanceProps) {
  const [form, setForm] = useState({
    employeeId: "",
    date: dayjs(),
    checkIn: dayjs(),
    checkOut: null as dayjs.Dayjs | null,
    notes: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axios.get("/api/employees");
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post("/api/attendance", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم تسجيل الحضور بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      console.error("خطأ أثناء تسجيل الحضور:", error);
      const errorMessage =
        error.response?.data?.error || "حدث خطأ أثناء تسجيل الحضور!";
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setForm({
      employeeId: "",
      date: dayjs(),
      checkIn: dayjs(),
      checkOut: null,
      notes: "",
    });
    setSearchValue("");
    setErrors({});
  };

  const handleEmployeeSelect = (value: string) => {
    setForm((prevForm) => ({ ...prevForm, employeeId: value }));
    const selectedEmployee = employees.find((emp) => emp.id.toString() === value);
    setSearchValue(selectedEmployee ? selectedEmployee.name : "");
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setForm((prevForm) => ({ ...prevForm, date }));
    }
  };

  const handleCheckInChange = (time: dayjs.Dayjs | null) => {
    if (time) {
      setForm((prevForm) => ({ ...prevForm, checkIn: time }));
    }
  };

  const handleCheckOutChange = (time: dayjs.Dayjs | null) => {
    setForm((prevForm) => ({ ...prevForm, checkOut: time }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prevForm) => ({ ...prevForm, notes: e.target.value }));
  };

  const validateForm = () => {
    let formErrors: any = {};
    if (!form.employeeId) formErrors.employeeId = "يرجى اختيار موظف";
    if (!form.date) formErrors.date = "يرجى تحديد التاريخ";
    if (!form.checkIn) formErrors.checkIn = "يرجى تحديد وقت الحضور";
    return formErrors;
  };

  const calculateAttendanceStatus = (checkIn: dayjs.Dayjs, checkOut: dayjs.Dayjs | null) => {
    if (!checkOut) return "غير محدد";
    const hoursWorked = checkOut.diff(checkIn, "hour", true); // حساب الساعات بدقة
    if (hoursWorked > 8) return "زيادة";
    if (hoursWorked >= 6.5) return "كامل";
    return "ناقص";
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // تحقق من أن وقت الانصراف ليس قبل وقت الحضور
    if (form.checkOut && form.checkOut.isBefore(form.checkIn)) {
      toast.error("وقت الانصراف لا يمكن أن يكون قبل وقت الحضور!");
      setErrors({ checkOut: "وقت الانصراف غير صالح" });
      return;
    }

    const attendanceStatus = calculateAttendanceStatus(form.checkIn, form.checkOut);

    const attendanceData = {
      employeeId: parseInt(form.employeeId),
      date: form.date.format("YYYY-MM-DD"),
      checkIn: form.checkIn.format(),
      checkOut: form.checkOut ? form.checkOut.format() : null,
      notes: form.notes || null,
      attendanceStatus, // إضافة حالة الحضور
    };

    mutation.mutate(attendanceData);
  };

  const options = employees
    .filter((employee) =>
      employee.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    .map((employee) => ({
      value: employee.id.toString(),
      label: employee.name,
    }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تسجيل حضور جديد
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2">
            <AutoComplete
              id="employee"
              placeholder="ابحث عن الموظف"
              value={searchValue}
              options={options}
              onSelect={handleEmployeeSelect}
              onSearch={handleSearchChange}
              status={errors.employeeId ? "error" : ""}
              className="w-full"
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
            {errors.employeeId && (
              <p className="text-red-500 text-sm">{errors.employeeId}</p>
            )}
          </div>

          <div className="grid gap-2">
            <DatePicker
              id="date"
              value={form.date}
              onChange={handleDateChange}
              status={errors.date ? "error" : ""}
              className="w-full"
              format="YYYY-MM-DD"
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date}</p>
            )}
          </div>

          <div className="grid gap-2">
            <TimePicker
              id="checkIn"
              value={form.checkIn}
              onChange={handleCheckInChange}
              status={errors.checkIn ? "error" : ""}
              placeholder="وقت الحضور"
              className="w-full"
              format="HH:mm"
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
            {errors.checkIn && (
              <p className="text-red-500 text-sm">{errors.checkIn}</p>
            )}
          </div>

          <div className="grid gap-2">
            <TimePicker
              id="checkOut"
              value={form.checkOut}
              placeholder="وقت الخروج"
              onChange={handleCheckOutChange}
              status={errors.checkOut ? "error" : ""}
              className="w-full"
              format="HH:mm"
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
            {errors.checkOut && (
              <p className="text-red-500 text-sm">{errors.checkOut}</p>
            )}
          </div>
        </div>
        <div className="grid gap-2">
          <Input.TextArea
            id="notes"
            value={form.notes}
            onChange={handleNotesChange}
            className="w-full"
            placeholder="ملاحظات"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="mr-2">
            إلغاء
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={mutation.isPending}
          >
            تسجيل الحضور
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}