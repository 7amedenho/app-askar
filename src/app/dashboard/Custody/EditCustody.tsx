"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputNumber, Button, Input, DatePicker } from "antd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { File } from "lucide-react";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface EditCustodyProps {
  isOpen: boolean;
  onClose: () => void;
  custody: {
    id: number;
    name: string;
    code: string;
    company: string;
    budget: number;
    remaining: number;
    time: string;
    status: string;
  };
}

const updateCustody = async (
  id: number,
  data: {
    name: string;
    code: string;
    company: string;
    budget: number;
    remaining: number;
    time: string;
    status: string;
  }
) => {
  console.log("Sending update request with data:", { id, ...data });
  const response = await axios.put(`/api/custodies/${id}`, data);
  return response.data;
};

export default function EditCustody({
  isOpen,
  onClose,
  custody,
}: EditCustodyProps) {
  const [form, setForm] = useState({
    name: custody.name,
    code: custody.code,
    company: custody.company,
    time: custody.time ? dayjs(custody.time) : (null as dayjs.Dayjs | null),
    budget: custody.budget as number | null,
    remaining: custody.remaining as number | null,
    status: custody.status || "active",
  });

  useEffect(() => {
    if (form.budget !== null) {
      setForm((prev) => ({ ...prev, remaining: form.budget }));
    }
  }, [form.budget]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      code: string;
      company: string;
      budget: number;
      remaining: number;
      time: string;
      status: string;
    }) => updateCustody(custody.id, data),
    onSuccess: (data) => {
      console.log("Mutation success:", data);
      queryClient.invalidateQueries({ queryKey: ["custodies"] });
      toast.success("تم تعديل العهدة بنجاح!");
      onClose();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error.response?.data || error.message);
      toast.error(
        `فشل في تعديل العهدة: ${error.response?.data?.error || error.message}`
      );
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAmountChange = (value: number | null) => {
    setForm((prev) => ({ ...prev, budget: value ?? 0 }));
  };

  const handleTimeChange = (time: dayjs.Dayjs | null) => {
    setForm((prev) => ({ ...prev, time }));
  };

  const handleStatusChange = (value: string) => {
    setForm((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.code || !form.time || form.budget === null) {
      console.error("Form incomplete:", form);
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const payload = {
      name: form.name,
      code: form.code,
      company: form.company,
      budget: Number(form.budget),
      remaining: form.remaining ?? form.budget,
      time: form.time.toISOString(),
      status: form.status,
    };
    console.log("Submitting payload:", payload);
    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">
            تعديل العهدة
          </DialogTitle>
        </DialogHeader>
        <Input
          size="large"
          placeholder="اسم العهدة"
          className="mt-2"
          name="name"
          value={form.name}
          onChange={handleInputChange}
        />
        <div className="py-2 grid grid-cols-2 gap-2">
          <Input
            size="large"
            placeholder="اسم الشركة"
            className="mt-2"
            name="company"
            value={form.company}
            onChange={handleInputChange}
          />
          <Input
            size="large"
            placeholder="نوع العهدة"
            className="mt-2"
            name="code"
            value={form.code}
            onChange={handleInputChange}
          />
          <InputNumber
            style={{ width: "100%" }}
            decimalSeparator="."
            placeholder="أدخل المبلغ"
            value={form.budget}
            onChange={handleAmountChange}
            formatter={(value) =>
              value
                ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
            parser={(value) => Number(value?.replace(/,/g, "") || 0)}
          />
          <DatePicker
            size="large"
            showTime
            className="mt-2 w-full"
            value={form.time}
            onChange={handleTimeChange}
            placeholder="اختر الوقت"
          />
          <Select onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="حالة العهدة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">مفعلة</SelectItem>
              <SelectItem value="inactive">غير مفعلة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            className="cursor-pointer"
            onClick={handleSubmit}
            disabled={
              !form.name ||
              !form.code ||
              !form.time ||
              form.budget === null ||
              mutation.isPending
            }
            loading={mutation.isPending}
          >
            <File size={18} />
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
