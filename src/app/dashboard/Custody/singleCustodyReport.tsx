"use client";
import { useState, useEffect } from "react";
import { DatePicker, Button, Table, Select, Card } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseItem {
  id: number;
  custodyId: number;
  description: string;
  amount: number | string;
  date: string;
  expenseType: string;
  responsiblePerson: string;
}

interface Custody {
  id: number;
  name: string;
  code: string;
  budget: number;
  remaining: number;
}

export default function SingleCustodyReport() {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [selectedCustody, setSelectedCustody] = useState<number | null>(null);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseItem[]>([]);

  // Fetch all custodies for the dropdown
  const { data: custodies = [], isLoading: isCustodiesLoading } = useQuery<
    Custody[],
    Error
  >({
    queryKey: ["custodies"],
    queryFn: async () => {
      const response = await axios.get("/api/custodies");
      return response.data;
    },
  });

  // Fetch expenses for the selected custody
  const {
    data: expenses = [],
    isLoading: isExpensesLoading,
    refetch: refetchExpenses,
  } = useQuery<ExpenseItem[], Error>({
    queryKey: ["custodyExpenses", selectedCustody],
    queryFn: async () => {
      if (!selectedCustody) return [];
      const response = await axios.get(`/api/custodies/${selectedCustody}/expenses`);
      return response.data;
    },
    enabled: !!selectedCustody,
  });

  // Filter expenses based on date range
  useEffect(() => {
    if (!expenses.length) {
      setFilteredExpenses([]);
      return;
    }

    if (dateRange[0] && dateRange[1]) {
      const start = dateRange[0].format("YYYY-MM-DD");
      const end = dateRange[1].format("YYYY-MM-DD");

      const filtered = expenses.filter((expense) => {
        // Make sure we have a date string in the proper format
        const expenseDate = typeof expense.date === 'string' 
          ? expense.date.substring(0, 10) // Extract YYYY-MM-DD part
          : new Date(expense.date).toISOString().substring(0, 10);
        
        return expenseDate >= start && expenseDate <= end;
      });
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [expenses, dateRange]);

  const handleSearch = () => {
    refetchExpenses();
  };

  const columns = [
    { title: "البيان", dataIndex: "description", key: "description" },
    { 
      title: "المبلغ", 
      dataIndex: "amount", 
      key: "amount",
      render: (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return numAmount.toLocaleString("ar-EG");
      }
    },
    { title: "نوع المصروف", dataIndex: "expenseType", key: "expenseType" },
    { title: "المسؤول", dataIndex: "responsiblePerson", key: "responsiblePerson" },
    { 
      title: "التاريخ", 
      dataIndex: "date", 
      key: "date",
      render: (date: string) => {
        // Handle both string date format and Date object
        return typeof date === 'string' 
          ? new Date(date).toLocaleDateString("ar-EG") 
          : new Date(date).toLocaleDateString("ar-EG");
      }
    },
  ];

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => {
      const amount = typeof expense.amount === 'string' 
        ? parseFloat(expense.amount) 
        : expense.amount;
      return total + amount;
    }, 0);
  };

  const selectedCustodyData = custodies.find(c => c.id === selectedCustody);

  if (isCustodiesLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-1/4 mx-auto mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-center">تقرير مصروفات العهدة</h1>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          className="min-w-[200px]"
          placeholder="اختر العهدة"
          onChange={(value) => setSelectedCustody(Number(value))}
          value={selectedCustody}
        >
          {custodies.map((custody) => (
            <Select.Option key={custody.id} value={custody.id}>
              {custody.name}
            </Select.Option>
          ))}
        </Select>
        
        <DatePicker.RangePicker
          onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])}
          placeholder={["تاريخ البداية", "تاريخ النهاية"]}
        />
        
        <Button 
          type="primary" 
          onClick={handleSearch}
          disabled={!selectedCustody}
        >
          عرض التقرير
        </Button>
      </div>

      {selectedCustodyData && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">المبلغ الإجمالي</div>
              <div className="text-2xl">{selectedCustodyData.budget.toLocaleString("ar-EG")}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">إجمالي المصروفات</div>
              <div className="text-2xl">{calculateTotalExpenses().toLocaleString("ar-EG")}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">المبلغ المتبقي</div>
              <div className="text-2xl">{selectedCustodyData.remaining.toLocaleString("ar-EG")}</div>
            </div>
          </div>
        </Card>
      )}

      {isExpensesLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {selectedCustody ? (
            <>
              {filteredExpenses.length > 0 ? (
                <Table 
                  columns={columns} 
                  dataSource={filteredExpenses} 
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>الإجمالي</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>{calculateTotalExpenses().toLocaleString("ar-EG")}</Table.Summary.Cell>
                      <Table.Summary.Cell index={2}></Table.Summary.Cell>
                      <Table.Summary.Cell index={3}></Table.Summary.Cell>
                      <Table.Summary.Cell index={4}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              ) : (
                <div className="text-center p-10 text-gray-500">
                  لا توجد مصروفات في الفترة المحددة
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-10 text-gray-500">
              يرجى اختيار عهدة لعرض تقرير المصروفات
            </div>
          )}
        </>
      )}
    </div>
  );
} 