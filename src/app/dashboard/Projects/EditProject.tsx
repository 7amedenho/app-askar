"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, DatePicker, Input, Select, Skeleton } from "antd";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { Combobox } from "@/components/ui/autoComplete";
import SkeletonInput from "antd/es/skeleton/Input";

interface EditProjectProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
}

export default function EditProject({
  isOpen,
  onClose,
  projectId,
}: EditProjectProps) {
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [custodyId, setCustodyId] = useState<string>("");
  const [status, setStatus] = useState<string>("active");

  const queryClient = useQueryClient();
  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await axios.get(`/api/projects/${projectId}`);
      return res.data;
    },
    enabled: !!projectId, // يتأكد من تنفيذ الاستعلام فقط عند وجود ID
  });
  useEffect(() => {
    if (projectData) {
      setName(projectData.name);
      setManagerName(projectData.managerName);
      setStartDate(dayjs(projectData.startDate));
      setCustodyId(projectData.custodies?.[0]?.id?.toString() || "");
      setStatus(projectData.status);
    }
  }, [projectData]);

  const { data: custodies = [] } = useQuery({
    queryKey: ["custodies"],
    queryFn: async () => {
      const res = await axios.get("/api/custodies");
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await axios.put(`/api/projects/${projectId}`, {
        name,
        managerName,
        startDate: startDate.format("YYYY-MM-DD"),
        custodyId: Number(custodyId),
        status,
      });
    },
    onSuccess: () => {
      toast.success("تم تحديث المشروع بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث المشروع!");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل المشروع</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="py-4 text-center">جاري التحميل...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Input
              size="large"
              placeholder="اسم المشروع"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              size="large"
              placeholder="اسم المدير"
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

            <Select
              size="large"
              value={status}
              onChange={(value) => setStatus(value)}
              options={[
                { value: "active", label: "نشط" },
                { value: "inactive", label: "غير نشط" },
              ]}
            />
          </div>
        )}

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
            {mutation.isPending ? "جارٍ التحديث..." : "تحديث المشروع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
