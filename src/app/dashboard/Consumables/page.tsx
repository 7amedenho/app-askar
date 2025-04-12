"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialChart } from "@/components/ui/cyrclechart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button, Input, Modal, Select, Progress, Badge, Tooltip } from "antd";
import {
  File,
  PlusCircleIcon,
  Search,
  AlignJustify,
  Edit,
  Trash,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import NewConsumable from "./NewConsumable";
import EditConsumable from "./EditConsumable";
import ConsumableUsageForm from "./ConsumableUsageForm";
import ConsumableReports from "./ConsumableReports";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

const { Option } = Select;

interface Consumable {
  id: number;
  name: string;
  unit: string;
  brand: string | null;
  stock: number;
  supplierId: number;
  supplier: {
    id: number;
    name: string;
  };
  usages: {
    id: number;
    quantityUsed: number;
    usedAt: string;
    project: {
      id: number;
      name: string;
    } | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function Page() {
  const queryClient = useQueryClient();

  const fetchConsumables = async (): Promise<Consumable[]> => {
    const response = await axios.get("/api/consumables");
    return response.data;
  };

  const deleteConsumable = async (id: number) => {
    await axios.delete(`/api/consumables/${id}`);
  };

  const [isNewOpen, setIsNewOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isUsageOpen, setIsUsageOpen] = useState<boolean>(false);
  const [isReportsOpen, setIsReportsOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsumableId, setSelectedConsumableId] = useState<
    number | null
  >(null);
  const [selectedConsumable, setSelectedConsumable] =
    useState<Consumable | null>(null);

  const {
    data: consumables = [],
    isLoading,
    error,
  } = useQuery<Consumable[], Error>({
    queryKey: ["consumables"],
    queryFn: fetchConsumables,
  });

  const mutation = useMutation({
    mutationFn: deleteConsumable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      toast.success("تم حذف المستهلك بنجاح!");
    },
    onError: () => {
      toast.error("حدث خطأ في حذف المستهلك");
    },
  });

  const filteredConsumables = consumables
    .filter((consumable) => {
      return consumable.name.toLowerCase().includes(searchInput.toLowerCase());
    })
    .sort((a, b) => {
      // ترتيب المستهلكات حسب المخزون (الأقل في المقدمة)
      return a.stock - b.stock;
    });

  // تحديد المستهلكات التي تحتاج إلى تنبيه (المخزون أقل من 20%)
  const getLowStockStatus = (stock: number) => {
    if (stock <= 10) return "danger";
    if (stock <= 30) return "warning";
    return "normal";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/4 mx-auto" />
        <div className="flex items-center gap-4 border-b pb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="w-full">
                <CardHeader className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i}>
                          <Skeleton className="h-5 w-1/4" />
                          <Skeleton className="h-5 w-3/4 mt-1" />
                        </div>
                      ))}
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
      <h1 className="text-3xl font-semibold text-center">إدارة المستهلكات</h1>
      <div className="flex items-center gap-4 border-b pb-4">
        <Input
          className="w-full"
          placeholder="بحث"
          prefix={<Search />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button
          type="primary"
          className="flex items-center gap-2"
          onClick={() => setIsNewOpen(true)}
        >
          <PlusCircleIcon size={18} />
          <span>إضافة مستهلك</span>
        </Button>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsUsageOpen(true)}
        >
          <PlusCircleIcon size={18} />
          <span>استخدام مستهلك</span>
        </Button>
        <Button
          type="default"
          className="flex items-center gap-2"
          onClick={() => setIsReportsOpen(true)}
        >
          <BarChart3 size={18} />
          <span>التقارير</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredConsumables.map((consumable) => {
          const stockStatus = getLowStockStatus(consumable.stock);
          const totalUsed =
            consumable.usages?.reduce(
              (sum, usage) => sum + usage.quantityUsed,
              0
            ) || 0;

          return (
            <Card key={consumable.id} className="w-full">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {consumable.name}
                  {stockStatus === "danger" && (
                    <Tooltip title="المخزون منخفض جداً!">
                      <Badge status="error" />
                    </Tooltip>
                  )}
                  {stockStatus === "warning" && (
                    <Tooltip title="المخزون منخفض">
                      <Badge status="warning" />
                    </Tooltip>
                  )}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <AlignJustify className="cursor-pointer hover:opacity-80 duration-300" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedConsumable(consumable);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="mr-2" /> تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-800"
                      onClick={() => {
                        setSelectedConsumableId(consumable.id);
                        setIsModalOpen(true);
                      }}
                    >
                      <Trash className="mr-2 text-red-500" /> حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">الوحدة</p>
                      <p>{consumable.unit}</p>
                    </div>
                    {consumable.brand && (
                      <div>
                        <p className="text-sm text-gray-500">الماركة</p>
                        <p>{consumable.brand}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">المورد</p>
                      <p>{consumable.supplier?.name || "غير محدد"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">تاريخ الإضافة</p>
                      <p>
                        {new Date(consumable.createdAt).toLocaleDateString(
                          "ar-EG"
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-500">المخزون</p>
                      <p className="text-sm">
                        {consumable.stock} {consumable.unit}
                      </p>
                    </div>
                    <Progress
                      percent={Math.min(
                        100,
                        (consumable.stock / (consumable.stock + totalUsed)) *
                          100
                      )}
                      status={
                        stockStatus === "danger"
                          ? "exception"
                          : stockStatus === "warning"
                          ? "normal"
                          : "normal"
                      }
                      showInfo={false}
                    />
                  </div>

                  {consumable.usages && consumable.usages.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm text-gray-500 mb-1">آخر استخدام</p>
                      <div className="text-sm">
                        <p>
                          {consumable.usages[0].quantityUsed} {consumable.unit}{" "}
                          في{" "}
                          {new Date(
                            consumable.usages[0].usedAt
                          ).toLocaleDateString("ar-EG")}
                        </p>
                        <div>
                          <p>المشاريع المستخدمة:</p>
                          <ul className="list-disc list-inside rtl space-y-1">
                            {consumable.usages.map((usage, index) =>
                              usage.project ? (
                                <li key={index}>
                                  {usage.project.name} - بتاريخ{" "}
                                  {new Date(usage.usedAt).toLocaleDateString(
                                    "ar-EG"
                                  )}
                                </li>
                              ) : (
                                <li key={index}>استخدام بدون مشروع</li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        title="تأكيد الحذف"
        open={isModalOpen}
        onOk={() => {
          if (selectedConsumableId !== null) {
            mutation.mutate(selectedConsumableId);
            setIsModalOpen(false);
          }
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="نعم، احذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true }}
      >
        <p>هل أنت متأكد أنك تريد حذف هذا المستهلك؟</p>
      </Modal>

      {isNewOpen && (
        <NewConsumable isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} />
      )}

      {isEditOpen && selectedConsumable && (
        <EditConsumable
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          consumableId={selectedConsumable.id}
        />
      )}

      {isUsageOpen && (
        <ConsumableUsageForm
          isOpen={isUsageOpen}
          onClose={() => setIsUsageOpen(false)}
        />
      )}

      {isReportsOpen && (
        <ConsumableReports
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
        />
      )}
    </div>
  );
}
