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
              margin: 10px;
              padding: 20px;
              background-color: #f0f4f8;
              color: #2c3e50;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: #fff;
              padding: 0px;
              border-radius: 15px;
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
              border: 2px solid #3498db;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 20px;
              border-bottom: 3px solid #3498db;
              background: #ecf0f1;
              color: #2c3e50;
              border-radius: 10px 10px 0 0;
              padding: 15px;
            }
            .header .logo img {
              max-width: 130px;
              height: auto;
            }
            .header .company-info {
              text-align: center;
              flex: 1;
            }
            .header .company-info h1 {
              font-size: 28px;
              margin: 0;
              font-weight: 700;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
            }
            .header .company-info p {
              font-size: 16px;
              margin: 5px 0 0;
              opacity: 0.9;
            }
            h2 {
              text-align: center;
              font-size: 24px;
              color: #2c3e50;
              margin: 25px 0;
              font-weight: 700;
              position: relative;
            }
            h2::after {
              content: '';
              width: 60px;
              height: 3px;
              background: #3498db;
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              border-radius: 2px;
            }
            .date-range {
              text-align: center;
              font-size: 13px;
              color: #7f8c8d;
              margin: 15px 0;
              font-style: italic;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 20px 0;
              font-size: 15px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            th, td {
              border: 1px solid #bdc3c7;
              padding: 12px;
              text-align: center;
            }
            th {
              background: #3498db;
              color: #fff;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            td {
              background: #fff;
            }
            tr:nth-child(even) td {
              background: #ecf0f1;
            }
            tr:hover td {
              background: #d5e8f7;
              transition: background 0.3s ease;
            }
            tfoot td {
              font-weight: bold;
              background: #f8f9fa;
              color: #2980b9;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #3498db;
              font-size: 13px;
              color: #7f8c8d;
            }
            .footer strong {
              color: #3498db;
              font-weight: 700;
            }
            @media print {
              body {
                padding: 0;
                background: #fff;
              }
              .container {
                box-shadow: none;
                border: none;
              }
              .header {
                background: #ecf0f1;
                -webkit-print-color-adjust: exact;
              }
              table th, table td {
                font-size: 12px;
                padding: 8px;
              }
              .footer {
                font-size: 11px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-info">
                <h1>عسكر للمقاولات العمومية</h1>
                <p>Askar Group for General Contracting</p>
              </div>
              <div class="logo">
                <img src="/logo.webp" alt="شعار عسكر للمقاولات العمومية" />
              </div>
            </div>
  
            <h2>كشف حساب المورد: ${supplier.name}</h2>
            <div class="date-range">
              الفترة من: ${dateRange ? dateRange[0].format("YYYY-MM-DD") : "غير محدد"} إلى: ${dateRange ? dateRange[1].format("YYYY-MM-DD") : "غير محدد"}
            </div>
  
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
                ${dataSource.map((item) => `
                  <tr>
                    <td>${new Date(item.date).toLocaleDateString("ar-EG")}</td>
                    <td>${item.description}</td>
                    <td>${Number(item.debit).toLocaleString()} ج.م</td>
                    <td>${Number(item.credit).toLocaleString()} ج.م</td>
                    <td>${Number(item.balance).toLocaleString()} ج.م</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4">الرصيد النهائي</td>
                  <td>${Number(runningBalance).toLocaleString()} ج.م</td>
                </tr>
              </tfoot>
            </table>
  
            <div class="footer">
              <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
              <p>تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 10000);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>كشف حساب المورد: {supplier.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2 flex flex-col gap-2">
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
