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
import { Button, Input, DatePicker, TimePicker } from "antd";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

interface EditAttendanceProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecord: {
    id: number;
    employeeId: number;
    date: string;
    checkIn: string;
    checkOut: string | null;
    notes: string | null;
  };
}

export default function EditAttendance({
  isOpen,
  onClose,
  attendanceRecord,
}: EditAttendanceProps) {
  const [form, setForm] = useState({
    id: attendanceRecord.id,
    employeeId: attendanceRecord.employeeId.toString(),
    date: dayjs(attendanceRecord.date),
    checkIn: dayjs(attendanceRecord.checkIn),
    checkOut: attendanceRecord.checkOut
      ? dayjs(attendanceRecord.checkOut)
      : null,
    notes: attendanceRecord.notes || "",
  });

  const [errors, setErrors] = useState<any>({});

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/attendance/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم تعديل سجل الحضور بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "حدث خطأ أثناء تعديل سجل الحضور!";
      toast.error(errorMessage);
    },
  });

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
    if (!form.date) formErrors.date = "يرجى تحديد التاريخ";
    if (!form.checkIn) formErrors.checkIn = "يرجى تحديد وقت الحضور";
    return formErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      const attendanceData = {
        id: form.id,
        employeeId: parseInt(form.employeeId),
        date: form.date.format("YYYY-MM-DD"),
        checkIn: form.checkIn.format(),
        checkOut: form.checkOut ? form.checkOut.format() : null,
        notes: form.notes || null,
      };

      mutation.mutate(attendanceData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تعديل سجل الحضور
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2 col-span-2">
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
              className="w-full"
              format="HH:mm"
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
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
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
