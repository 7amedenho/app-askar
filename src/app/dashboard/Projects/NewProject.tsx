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
import { Button, DatePicker, Input } from "antd";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { Combobox } from "@/components/ui/autoComplete"; // استيراد Combobox المخصص

interface NewProjectProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProject({ isOpen, onClose }: NewProjectProps) {
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [custodyId, setCustodyId] = useState<string>(""); // تعديل المتغير إلى string ليتناسب مع Combobox

  const queryClient = useQueryClient();

  // جلب قائمة العهدات باستخدام Axios
  const { data: custodies = [], isLoading } = useQuery({
    queryKey: ["custodies"],
    queryFn: async () => {
      const res = await axios.get("/api/custodies");
      return res.data;
    },
  });

  // إنشاء المشروع
  const mutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/projects", {
        name,
        managerName,
        startDate: startDate.format("YYYY-MM-DD"),
        custodyId: Number(custodyId), // تحويل إلى رقم عند الإرسال
      });
    },
    onSuccess: () => {
      toast.success("تم إنشاء المشروع بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء المشروع!");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مشروع جديد</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Input
            size="large"
            placeholder="اسم المشروع"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            size="large"
            placeholder="اسم الشركة المسئولة"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
          />
          <DatePicker
            size="large"
            placeholder="تاريخ البدء"
            value={startDate}
            onChange={(date) => setStartDate(date!)}
            className="w-full"
          />

          {/* 🔹 Combobox لاختيار العهدة */}
          <Combobox
            placeholder="اختر العهدة"
            options={custodies.map((c: any) => ({
              value: c.id.toString(),
              label: c.name,
            }))}
            value={custodyId}
            onChange={(value) => setCustodyId(value)}
            searchPlaceholder="بحث..."
            width="100%"
          />
        </div>

        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              !name ||
              !managerName ||
              !startDate ||
              !custodyId ||
              mutation.isPending
            }
            loading={mutation.isPending}
          >
            {mutation.isPending ? "جارٍ الإنشاء..." : "إنشاء المشروع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
