"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialChart } from "@/components/ui/cyrclechart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button, Input, Modal, Select } from "antd";
import {
  File,
  PlusCircleIcon,
  Search,
  AlignJustify,
  Edit,
  Trash,
  ArrowUp01Icon,
} from "lucide-react";
import { useState } from "react";
import { AddAmount } from "./AddAmount";
import New from "./NewCustody";
import EditCustody from "./EditCustody";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

const { Option } = Select;

interface Custody {
  id: number;
  name: string;
  code: string;
  company: string;
  budget: number;
  date: string;
  status: string;
  time: string;
  amount: number;
  createdAt: string;
  remaining: number;
  project: { name: string } | null;
}

export default function Page() {
  const queryClient = useQueryClient();
  const fetchCustodies = async (): Promise<Custody[]> => {
    const response = await axios.get("/api/custodies");
    return response.data;
  };
  const deleteCustody = async (id: number) => {
    await axios.delete(`/api/custodies/${id}`);
  };

  const [isAddAmountOpen, setIsAddAmountOpen] = useState<boolean>(false);
  const [isNewOpen, setIsNewOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustodyId, setSelectedCustodyId] = useState<number | null>(
    null
  );
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all"); // "all" أو "active"

  const {
    data: custodies = [],
    isLoading,
    error,
  } = useQuery<Custody[], Error>({
    queryKey: ["custodies"],
    queryFn: fetchCustodies,
  });

  const mutation = useMutation({
    mutationFn: deleteCustody,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custodies"] });
      toast.success("تم حذف العهدة بنجاح!");
    },
    onError: () => {
      toast.error("حدث خطاء في حذف العهدة");
    },
  });

  // تصفية وترتيب العهدات
  const filteredAndSortedCustodies = custodies
    .filter((custody) => {
      const matchesSearch =
        custody.name &&
        custody.company.toLowerCase().includes(searchInput.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || custody.status === "active";
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/4 mx-auto" />
        <div className="flex items-center gap-4 border-b pb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {Array(2)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="w-full">
                <CardHeader className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-full" />
                    <div className="space-y-4 col-span-2">
                      {Array(10)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i}>
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-3/4 mt-1" />
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-500">
        حدث خطأ: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-center">إدارة العهدات</h1>
      <div className="flex items-center gap-4 border-b pb-4">
        <Input
          className="w-full"
          placeholder="بحث"
          prefix={<Search />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          value={filterStatus}
          onChange={(value) => setFilterStatus(value)}
          className="w-32"
        >
          <Option value="all">الكل</Option>
          <Option value="active">المفعلة فقط</Option>
        </Select>
        <Button
          type="primary"
          className="flex items-center gap-2"
          onClick={() => setIsNewOpen(true)}
        >
          <PlusCircleIcon size={18} />
          <span>إنشاء عهدة</span>
        </Button>
        <Button type="text" className="flex items-center gap-2">
          <File size={18} />
          <span>تقارير</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {filteredAndSortedCustodies?.map((custody: Custody) => (
          <Card key={custody.id} className="w-full">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>تفاصيل العهدة</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <AlignJustify className="cursor-pointer hover:opacity-80 duration-300" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCustodyId(custody.id);
                      setIsAddAmountOpen(true);
                    }}
                  >
                    <ArrowUp01Icon className="mr-2" /> إضافة مبلغ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCustody(custody);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="mr-2" /> تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-800"
                    onClick={() => {
                      setSelectedCustodyId(custody.id);
                      setIsModalOpen(true);
                    }}
                  >
                    <Trash className="mr-2 text-red-500" /> حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FinancialChart
                  totalAmount={custody.budget}
                  remainingAmount={custody.remaining}
                />
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  {[
                    { label: "اسم العهدة", value: custody.name },
                    { label: "الكود", value: custody.code },
                    { label: "الشركة", value: custody.company },
                    {
                      label: "الكمية الإجمالية",
                      value: custody.budget.toLocaleString("ar-EG"),
                    },
                    {
                      label: "الكمية المتبقية",
                      value: custody.remaining.toLocaleString("ar-EG"),
                    },
                    {
                      label: "الحالة",
                      value:
                        custody.status === "active" ? "مفعلة" : "غير مفعلة",
                    },
                    {
                      label: "الوقت",
                      value: new Date(custody.time).toLocaleString("ar-EG"),
                    },
                    // {
                    //   label: "تاريخ الإنشاء",
                    //   value: new Date(custody.createdAt).toLocaleDateString(
                    //     "ar-EG"
                    //   ),
                    // },
                    {
                      label: "المشروع المرتبط",
                      value: custody.project
                        ? custody.project.name
                        : "غير مرتبط بمشروع",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex space-x-2">
                      <p className="text-md text-gray-900 dark:text-white">
                        {item.label}:
                      </p>
                      <p
                        className={
                          item.label === "الحالة" && custody.status === "active"
                            ? "text-green-700 dark:text-green-300"
                            : item.label === "الحالة" &&
                              custody.status === "inactive"
                            ? "text-red-700 dark:text-red-300"
                            : "text-blue-700 dark:text-blue-300"
                        }
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Modal
        title="تأكيد الحذف"
        open={isModalOpen}
        onOk={() => {
          if (selectedCustodyId !== null) {
            mutation.mutate(selectedCustodyId);
            setIsModalOpen(false);
          }
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="نعم، احذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true }}
      >
        <p>هل أنت متأكد أنك تريد حذف هذه العهدة؟</p>
      </Modal>
      {isNewOpen && (
        <New isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} />
      )}
      {isAddAmountOpen && selectedCustodyId && (
        <AddAmount
          isOpen={isAddAmountOpen}
          onClose={() => setIsAddAmountOpen(false)}
          custodyId={selectedCustodyId}
        />
      )}

      {isEditOpen && selectedCustody && (
        <EditCustody
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          custody={selectedCustody}
        />
      )}
    </div>
  );
}
