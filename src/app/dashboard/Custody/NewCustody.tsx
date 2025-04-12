"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputNumber, Button, Input, DatePicker } from "antd";
import { File } from "lucide-react";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";

interface AddCustody {
  isOpen: boolean;
  onClose: () => void;
}

const createCustody = async (data: {
  name: string;
  code: string;
  company: string;
  remaining: number;
  date: string;
  budget: number;
}) => {
  console.log("Sending request with data:", data); // Log قبل الـ request
  const response = await axios.post("/api/custodies", data);
  return response.data;
};

export default function New({ isOpen, onClose }: AddCustody) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    company: "",
    date: null as dayjs.Dayjs | null,
    budget: null as number | null,
    remaining: null as number | null, // اجعله null مبدئيًا
  });

  // تحديث remaining عند تغيير budget
  React.useEffect(() => {
    if (form.budget !== null) {
      setForm((prev) => ({ ...prev, remaining: prev.budget }));
    }
  }, [form.budget]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCustody,
    onSuccess: (data) => {
      console.log("Mutation success:", data);
      queryClient.invalidateQueries({ queryKey: ["custodies"] });
      toast.success("تم إنشاء العهدة بنجاح!");
      onClose();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error.response?.data || error.message);
      toast.error(
        `فشل في إنشاء العهدة: ${error.response?.data?.error || error.message}`
      );
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAmountChange = (value: number | null) => {
    setForm((prev) => ({ ...prev, budget: value ?? 0 })); // لو null، حطه 0
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setForm((prev) => ({ ...prev, date }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.code || !form.date || form.budget === null) {
      console.error("Form incomplete:", form);
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const payload = {
      name: form.name,
      code: form.code,
      company: form.company,
      remaining: form.budget,
      date: form.date.toISOString(),
      budget: Number(form.budget), // تأكد إنه number
    };
    console.log("Submitting payload:", payload);
    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">
            إنشاء عهدة جديدة
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
            className="mt-2 w-full"
            value={form.date}
            onChange={handleDateChange}
          />
        </div>

        <DialogFooter>
          <Button
            className="cursor-pointer"
            onClick={handleSubmit}
            disabled={
              !form.name ||
              !form.code ||
              !form.date ||
              form.budget === null ||
              mutation.isPending
            }
            loading={mutation.isPending}
          >
            <File size={18} />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
