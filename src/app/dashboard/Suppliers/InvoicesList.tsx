"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button, Table, DatePicker, Spin, Badge, Tag, Tooltip, Modal } from "antd";
import { Printer, DollarSign, Eye } from "lucide-react";
import dayjs from "dayjs";
import InvoicePayment from "./InvoicePayment";
import InvoiceDetails from "./InvoiceDetails";

const { RangePicker } = DatePicker;

interface InvoicesListProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
}

export default function InvoicesList({
    isOpen,
    onClose,
    supplier,
}: InvoicesListProps) {
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
        null
    );
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    const fetchInvoices = async () => {
        const params: any = { supplierId: supplier.id };
        if (dateRange) {
            params.startDate = dateRange[0].startOf("day").toISOString();
            params.endDate = dateRange[1].endOf("day").toISOString();
        }
        const response = await axios.get(`/api/invoices`, { params });
        return response.data;
    };

    const { data: invoicesData = [], isLoading } = useQuery({
        queryKey: ["invoices", supplier.id, dateRange],
        queryFn: fetchInvoices,
        enabled: isOpen,
    });

    // Status badge colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "success";
            case "partially_paid":
                return "warning";
            case "pending":
                return "error";
            default:
                return "default";
        }
    };

    // Translates status to Arabic
    const translateStatus = (status: string) => {
        switch (status) {
            case "paid":
                return "مدفوعة";
            case "partially_paid":
                return "مدفوعة جزئياً";
            case "pending":
                return "غير مدفوعة";
            default:
                return status;
        }
    };

    const columns = [
        {
            title: "رقم الفاتورة",
            dataIndex: "id",
            key: "id",
            render: (id: number) => `#${id}`
        },
        {
            title: "التاريخ",
            dataIndex: "invoiceDate",
            key: "invoiceDate",
            render: (date: string) => new Date(date).toLocaleDateString("ar-EG")
        },
        {
            title: "النوع",
            dataIndex: "invoiceType",
            key: "invoiceType",
            render: (type: string) => <Tag color={type === "معدات" ? "blue" : "green"}>{type}</Tag>
        },
        {
            title: "المبلغ الإجمالي",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (amount: number) => `${Number(amount).toLocaleString()} ج.م`
        },
        {
            title: "المدفوع",
            dataIndex: "paidAmount",
            key: "paidAmount",
            render: (amount: number) => `${Number(amount).toLocaleString()} ج.م`
        },
        {
            title: "المتبقي",
            key: "remaining",
            render: (_: any, record: any) => {
                const remaining = Number(record.totalAmount) - Number(record.paidAmount);
                return `${remaining.toLocaleString()} ج.م`;
            }
        },
        {
            title: "الحالة",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Badge status={getStatusColor(status) as any} text={translateStatus(status)} />
            )
        },
        {
            title: "العمليات",
            key: "actions",
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Tooltip title="تفاصيل الفاتورة">
                        <Button
                            type="text"
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => {
                                setSelectedInvoice(record);
                                setIsDetailsModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    {record.status !== "paid" && (
                        <Tooltip title="تسجيل دفعة">
                            <Button
                                type="primary"
                                icon={<DollarSign className="h-4 w-4" />}
                                onClick={() => {
                                    setSelectedInvoice(record);
                                    setIsPaymentModalOpen(true);
                                }}
                            />
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ];

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=900,height=600");
        if (printWindow) {
            printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>فواتير المورد - ${supplier.name}</title>
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
            
            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid {
              background-color: #27ae60;
              color: white;
            }
            .status-partially {
              background-color: #f39c12;
              color: white;
            }
            .status-pending {
              background-color: #e74c3c;
              color: white;
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
              .header, th {
                -webkit-print-color-adjust: exact;
              }
              .status {
                -webkit-print-color-adjust: exact;
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
  
            <h2>فواتير المورد: ${supplier.name}</h2>
            <div class="date-range">
              الفترة من: ${dateRange ? dateRange[0].format("YYYY-MM-DD") : "غير محدد"} إلى: ${dateRange ? dateRange[1].format("YYYY-MM-DD") : "غير محدد"}
            </div>
  
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>المبلغ الإجمالي</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${invoicesData.map((invoice: any) => `
                  <tr>
                    <td>#${invoice.id}</td>
                    <td>${new Date(invoice.invoiceDate).toLocaleDateString("ar-EG")}</td>
                    <td>${invoice.invoiceType}</td>
                    <td>${Number(invoice.totalAmount).toLocaleString()} ج.م</td>
                    <td>${Number(invoice.paidAmount).toLocaleString()} ج.م</td>
                    <td>${(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toLocaleString()} ج.م</td>
                    <td>
                      <span class="status status-${invoice.status === 'paid' ? 'paid' : invoice.status === 'partially_paid' ? 'partially' : 'pending'}">
                        ${translateStatus(invoice.status)}
                      </span>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">الإجمالي</td>
                  <td>${invoicesData.reduce((sum: number, invoice: any) => sum + Number(invoice.totalAmount), 0).toLocaleString()} ج.م</td>
                  <td>${invoicesData.reduce((sum: number, invoice: any) => sum + Number(invoice.paidAmount), 0).toLocaleString()} ج.م</td>
                  <td>${invoicesData.reduce((sum: number, invoice: any) => sum + (Number(invoice.totalAmount) - Number(invoice.paidAmount)), 0).toLocaleString()} ج.م</td>
                  <td></td>
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
        <Modal
            open={isOpen}
            onCancel={onClose}
            title={<div className="text-xl font-bold text-center">فواتير المورد: {supplier.name}</div>}
            footer={[
                <Button key="close" onClick={onClose}>إغلاق</Button>
            ]}
            width={1200}
        >
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
                            className="justify-start w-24"
                            type="default"
                            icon={<Printer className="h-4 w-4" />}
                            onClick={handlePrint}
                        >
                            طباعة
                        </Button>

                        <Table
                            columns={columns}
                            dataSource={invoicesData}
                            pagination={{ pageSize: 5 }}
                            rowKey="id"
                            bordered
                            summary={() => (
                                <Table.Summary>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={3}>
                                            الإجمالي
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3}>
                                            {invoicesData.reduce((sum: number, invoice: any) => sum + Number(invoice.totalAmount), 0).toLocaleString()} ج.م
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={4}>
                                            {invoicesData.reduce((sum: number, invoice: any) => sum + Number(invoice.paidAmount), 0).toLocaleString()} ج.م
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={5}>
                                            {invoicesData.reduce((sum: number, invoice: any) => sum + (Number(invoice.totalAmount) - Number(invoice.paidAmount)), 0).toLocaleString()} ج.م
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={6}></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                    </>
                )}
            </div>

            {selectedInvoice && isPaymentModalOpen && (
                <InvoicePayment
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    invoice={selectedInvoice}
                    supplier={supplier}
                />
            )}

            {selectedInvoice && isDetailsModalOpen && (
                <InvoiceDetails
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    invoice={selectedInvoice}
                />
            )}
        </Modal>
    );
} 