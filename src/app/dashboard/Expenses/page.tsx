"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, DatePicker, Input, Modal, Select } from "antd";
import {
  File,
  PlusCircleIcon,
  Search,
  AlignJustify,
  Edit,
  Trash,
  Printer,
} from "lucide-react";
import { useState, useEffect } from "react"; // أضفنا useEffect
import NewExpense from "./NewExpense";
import EditExpense from "./EditExpense";
import ExpenseReports from "./ExpenseReports";
import ExpenseChart from "./ExpenseChart";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import dayjs from "dayjs"; // استيراد dayjs للتعامل مع التواريخ

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseType: string;
  responsiblePerson: string;
  custodyId: number;
  custody: { name: string; remaining: number; budget: number };
  projectId: number | null;
  project: { name: string } | null;
  date: string;
  createdAt: string;
}

export default function Page() {
  const queryClient = useQueryClient();

  // API Calls
  const fetchExpenses = async (): Promise<Expense[]> => {
    const response = await axios.get("/api/expenses");
    return response.data;
  };

  const deleteExpense = async (id: number) => {
    await axios.delete(`/api/expenses/${id}`);
  };

  // States
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false); // حالة جديدة للتحكم في عرض ExpenseChart
  const [searchInput, setSearchInput] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  // Query and Mutation
  const {
    data: expenses = [],
    isLoading,
    error,
  } = useQuery<Expense[], Error>({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const mutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("تم حذف المصروف وإعادة المبلغ للعهدة بنجاح!");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  // تعيين تاريخ اليوم كقيمة افتراضية عند تحميل الصفحة
  useEffect(() => {
    const today = new Date();
    setDateRange([today, today]); // تعيين تاريخ اليوم فقط كنطاق افتراضي
  }, []);

  const filteredExpenses = expenses
    .filter((exp) => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchInput.toLowerCase()) ||
        exp.responsiblePerson.toLowerCase().includes(searchInput.toLowerCase());
      const matchesType =
        filterType === "all" || exp.expenseType === filterType;
      const expDate = new Date(exp.date);
      const matchesDate =
        !dateRange[0] ||
        !dateRange[1] ||
        (expDate >= dateRange[0] && expDate <= dateRange[1]);
      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Print Function (دون تعديل)
  const handlePrint = () => {
    // الكود الخاص بالطباعة كما هو
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error)
    return (
      <div className="text-center p-6 text-red-500">
        حدث خطأ: {error.message}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-center mb-6">
        إدارة المصروفات
      </h1>

      {/* Summary Section - مع زر عرض التفاصيل */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>ملخص المصروفات</CardTitle>
            <Button type="primary" onClick={() => setIsChartOpen(true)}>
              عرض التفاصيل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* <ExpenseChart expenses={expenses} isOpen={false} onClose={() => { setIsChartOpen(false) }} /> */}
        </CardContent>
      </Card>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 border-b pb-4 items-center">
        <Input
          placeholder="ابحث بوصف أو مسؤول"
          prefix={<Search />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="md:w-1/3"
        />
        <Select
          value={filterType}
          onChange={setFilterType}
          className="md:w-1/5"
          placeholder="نوع المصروف"
        >
          <Option value="all">الكل</Option>
          <Option value="مصروفات مكتبية">مصروفات مكتبية</Option>
          <Option value="مصروفات صيانة">مصروفات صيانة</Option>
          <Option value="مصروفات عامة">مصروفات عامة</Option>
          <Option value="مصروفات خاصة">مصروفات خاصة</Option>
        </Select>
        <RangePicker
          className="md:w-1/4"
          value={[
            dateRange[0] ? dayjs(dateRange[0]) : null,
            dateRange[1] ? dayjs(dateRange[1]) : null,
          ]} // تحويل التاريخ إلى صيغة dayjs
          onChange={(dates) =>
            setDateRange(
              dates
                ? [dates[0]?.toDate() || null, dates[1]?.toDate() || null]
                : [null, null]
            )
          }
        />
        <div className="flex gap-2 ml-auto">
          <Button type="primary" onClick={() => setIsNewOpen(true)}>
            <PlusCircleIcon size={18} className="ml-2" /> إضافة مصروف
          </Button>
          <Button type="default" onClick={() => setIsReportsOpen(true)}>
            <File size={18} className="ml-2" /> التقارير
          </Button>
          <Button type="default" onClick={handlePrint}>
            <Printer size={18} className="ml-2" /> طباعة
          </Button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{expense.description}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <AlignJustify className="cursor-pointer" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedExpense(expense);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit size={16} className="ml-2" /> تعديل
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ:</span>
                  <span>{Number(expense.amount).toLocaleString()} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">النوع:</span>
                  <span>{expense.expenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المسؤول:</span>
                  <span>{expense.responsiblePerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span>
                    {new Date(expense.date).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العهدة:</span>
                  <span>{expense.custody.name}</span>
                </div>
                {expense.project && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المشروع:</span>
                    <span>{expense.project.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center p-6 border rounded-lg">
            لا توجد مصروفات
          </div>
        )}
      </div>

      {/* Modals */}
      <NewExpense
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSuccess={() => {
          console.log("Invalidating expenses query");
          queryClient.invalidateQueries({
            queryKey: ["expenses"],
            exact: true,
          });
          queryClient.refetchQueries({ queryKey: ["expenses"], exact: true });
          setIsNewOpen(false);
        }}
      />
      {selectedExpense && (
        <EditExpense
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            setIsEditOpen(false);
            setSelectedExpense(null);
          }}
        />
      )}
      <ExpenseReports
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        expenses={expenses}
      />
      {/* Modal لعرض ExpenseChart */}
      {isChartOpen && (
        <ExpenseChart
          expenses={expenses}
          isOpen={isChartOpen}
          onClose={() => setIsChartOpen(false)}
        />
      )}
      {/* <ExpenseChart
        expenses={expenses}
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
      /> */}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-1/4 mx-auto" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                {Array(5)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full mb-2" />
                  ))}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
