"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Table, DatePicker, Spin } from "antd";
import { Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface SupplierStatementProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
}

export default function SupplierStatement({
  isOpen,
  onClose,
  supplier,
}: SupplierStatementProps) {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const fetchStatement = async () => {
    const params: any = {};
    if (dateRange) {
      params.startDate = dateRange[0].startOf("day").toISOString();
      params.endDate = dateRange[1].endOf("day").toISOString();
    }
    const response = await axios.get(
      `/api/suppliers/${supplier.id}/statement`,
      {
        params,
      }
    );
    return response.data;
  };

  const { data: statementData = { invoices: [], payments: [] }, isLoading } =
    useQuery({
      queryKey: ["supplierStatement", supplier.id, dateRange],
      queryFn: fetchStatement,
      enabled: isOpen,
    });

  const columns = [
    { title: "التاريخ", dataIndex: "date", key: "date" },
    { title: "الوصف", dataIndex: "description", key: "description" },
    { title: "المدين", dataIndex: "debit", key: "debit" },
    { title: "الدائن", dataIndex: "credit", key: "credit" },
    { title: "الرصيد", dataIndex: "balance", key: "balance" },
  ];

  const dataSource = [
    ...statementData.invoices.map((inv: any) => ({
      date: new Date(inv.invoiceDate).toLocaleDateString("ar-EG"),
      description: `فاتورة ${inv.invoiceType} #${inv.id}`,
      debit: inv.totalAmount,
      credit: 0,
      balance: null,
    })),
    ...statementData.payments.map((pay: any) => ({
      date: new Date(pay.paymentDate).toLocaleDateString("ar-EG"),
      description: `دفعة #${pay.id}`,
      debit: 0,
      credit: pay.amount,
      balance: null,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  dataSource.forEach((item) => {
    runningBalance += item.debit - item.credit;
    item.balance = runningBalance;
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>كشف حساب المورد - ${supplier.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              margin: 20px;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            h1 {
              text-align: center;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: center;
            }
            th {
              background-color: #3498db;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>كشف حساب المورد: ${supplier.name}</h1>
            <p>من: ${dateRange ? dateRange[0].format("YYYY-MM-DD") : "غير محدد"
        } إلى: ${dateRange ? dateRange[1].format("YYYY-MM-DD") : "غير محدد"
        }</p>
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوصف</th>
                  <th>المدين</th>
                  <th>الدائن</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                ${dataSource
          .map(
            (item) => `
                  <tr>
                    <td>${item.date}</td>
                    <td>${item.description}</td>
                    <td>${item.debit}</td>
                    <td>${item.credit}</td>
                    <td>${item.balance}</td>
                  </tr>
                `
          )
          .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4">الرصيد النهائي</td>
                  <td>${runningBalance}</td>
                </tr>
              </tfoot>
            </table>
            <div class="footer">
              تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>كشف حساب المورد: {supplier.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <RangePicker
            onChange={(dates) => setDateRange(dates as any)}
            format="YYYY-MM-DD"
          />
          {isLoading ? (
            <div className="flex justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Button
                className="justify-start"
                type="default"
                icon={<Printer />}
                onClick={handlePrint}
              >
                طباعة
              </Button>
              <Table
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                rowKey={(record, index) => index!.toString()}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        الرصيد النهائي
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        {runningBalance}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
