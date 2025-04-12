import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { InputNumber, Button, Spin } from "antd";
import { File } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AddAmountProps {
  isOpen: boolean;
  onClose: () => void;
  custodyId: number; // استلام معرف العهدة
}

export function AddAmount({ isOpen, onClose, custodyId }: AddAmountProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // حالة التحميل
  const queryClient = useQueryClient();

  const handleAddAmount = async () => {
    if (!amount || amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صحيح.");
      return;
    }

    setLoading(true); // تفعيل اللودينج

    try {
      await axios.post("/api/custodies/addAmount", {
        custodyId,
        amount,
      });

      toast.success("تمت إضافة المبلغ بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["custodies"] }); // تحديث البيانات
      onClose();
    } catch (error) {
      console.error("خطأ أثناء الإضافة:", error);
      toast.error("حدث خطأ أثناء إضافة المبلغ.");
    } finally {
      setLoading(false); // تعطيل اللودينج بعد انتهاء العملية
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">
            إضافة مبلغ
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            أدخل المبلغ المراد إضافته للعهدة.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <InputNumber
            style={{ width: "100%" }}
            decimalSeparator="."
            placeholder="أدخل المبلغ"
            value={amount}
            onChange={setAmount}
            formatter={(value) =>
              value
                ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : ""
            }
            parser={(value) => Number(value?.replace(/,/g, ""))}
            disabled={loading} // تعطيل الإدخال أثناء التحميل
          />
        </div>

        <DialogFooter>
          <Button
            type="primary"
            className="cursor-pointer"
            onClick={handleAddAmount}
            disabled={!amount || loading}
          >
            {loading ? <Spin /> : <File size={18} />}{" "}
            {/* اللودينج بدل الأيقونة */}
            {loading ? "جارِ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
