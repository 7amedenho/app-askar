"use client";
import { useState, useEffect } from "react";
import { DatePicker, Button, Table, AutoComplete } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface ReportItem {
  id: number;
  custodyName: string;
  amount: number;
  date: string;
}

export default function CustodyReports() {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [filteredData, setFilteredData] = useState<ReportItem[]>([]);

  // بيانات العهدة المصروفة
  const custodyExpenses: ReportItem[] = [
    { id: 1, custodyName: "عهدة رقم 1", amount: 50, date: "2024-03-01" },
    { id: 2, custodyName: "عهدة رقم 2", amount: 30, date: "2024-03-10" },
    { id: 3, custodyName: "عهدة رقم 1", amount: 20, date: "2024-03-15" },
  ];

  // عرض جميع البيانات عند تحميل الصفحة
  useEffect(() => {
    setFilteredData(custodyExpenses);
  }, []);

  const handleFilter = () => {
    if (dateRange[0] && dateRange[1]) {
      const start = dateRange[0].format("YYYY-MM-DD");
      const end = dateRange[1].format("YYYY-MM-DD");

      const filtered = custodyExpenses.filter(
        (expense) => expense.date >= start && expense.date <= end
      );

      setFilteredData(filtered);
    }
  };

  const columns = [
    { title: "اسم العهدة", dataIndex: "custodyName", key: "custodyName" },
    { title: "المبلغ المصروف", dataIndex: "amount", key: "amount" },
    { title: "التاريخ", dataIndex: "date", key: "date" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <AutoComplete placeholder="اسم العهدة" />
        <DatePicker.RangePicker
          onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])}
          placeholder={["تاريخ البداية", "تاريخ النهاية"]}
        />
        <Button type="primary" onClick={handleFilter}>
          عرض التقارير
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredData} rowKey="id" />
    </div>
  );
}
