"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button, Table, DatePicker, Spin, Collapse, Badge, Tag, Modal } from "antd";
import { Printer, Eye, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

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
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

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
    { title: "التاريخ", dataIndex: "date", key: "date" },
    { 
      title: "الوصف", 
      dataIndex: "description", 
      key: "description",
      render: (text: string, record: any) => {
        // Only render details button for invoices
        if (record.type === 'invoice') {
          return (
            <div className="flex items-center justify-between">
              <span>{text}</span>
              <Button 
                type="text"
                icon={<Eye size={16} />}
                onClick={() => setExpandedInvoice(expandedInvoice === record.id ? null : record.id)}
              />
            </div>
          );
        }
        return text;
      }
    },
    { 
      title: "الحالة", 
      dataIndex: "status", 
      key: "status",
      render: (status: string) => status ? (
        <Badge status={getStatusColor(status) as any} text={translateStatus(status)} />
      ) : null
    },
    { 
      title: "المدين", 
      dataIndex: "debit", 
      key: "debit",
      render: (value: number) => value ? value.toLocaleString() + " ج.م" : "0 ج.م"
    },
    { 
      title: "الدائن", 
      dataIndex: "credit", 
      key: "credit",
      render: (value: number) => value ? value.toLocaleString() + " ج.م" : "0 ج.م"
    },
    { 
      title: "الرصيد", 
      dataIndex: "balance", 
      key: "balance",
      render: (value: number) => value.toLocaleString() + " ج.م"
    },
  ];

  const dataSource = [
    ...statementData.invoices.map((inv: any) => ({
      id: inv.id,
      date: new Date(inv.invoiceDate).toLocaleDateString("ar-EG"),
      description: `فاتورة ${inv.invoiceType} #${inv.id}`,
      debit: Number(inv.totalAmount),
      credit: 0,
      balance: null,
      type: 'invoice',
      status: inv.status,
      invoiceDetails: inv,
    })),
    ...statementData.payments.map((pay: any) => ({
      id: pay.id,
      date: new Date(pay.paymentDate).toLocaleDateString("ar-EG"),
      description: pay.notes ? `دفعة #${pay.id} - ${pay.notes}` : `دفعة #${pay.id}`,
      debit: 0,
      credit: Number(pay.amount),
      balance: null,
      type: 'payment',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let runningBalance = 0;
  [...dataSource].reverse().forEach((item) => {
    runningBalance += Number(item.debit) - Number(item.credit);
    item.balance = runningBalance;
  });

  // Reversed again to show latest transactions first
  const sortedDataSource = [...dataSource].reverse();

  // Invoice items detail columns
  const itemColumns = [
    { title: "اسم الصنف", dataIndex: "itemName", key: "itemName" },
    { title: "الكمية", dataIndex: "quantity", key: "quantity" },
    { title: "الوحدة", dataIndex: "unit", key: "unit" },
    { title: "الماركة", dataIndex: "brand", key: "brand" },
    { 
      title: "سعر الوحدة", 
      dataIndex: "unitPrice", 
      key: "unitPrice",
      render: (value: number) => value.toLocaleString() + " ج.م"
    },
    { 
      title: "الإجمالي", 
      dataIndex: "total", 
      key: "total",
      render: (text: string, record: any) => (Number(record.quantity) * Number(record.unitPrice)).toLocaleString() + " ج.م"
    }
  ];

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
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              margin-left: 5px;
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
            .invoice-details {
              margin: 20px;
              border: 1px dashed #3498db;
              padding: 15px;
              border-radius: 10px;
              background-color: #f8f9fa;
            }
            .invoice-details h3 {
              color: #2980b9;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-top: 0;
            }
            .invoice-details table {
              margin: 10px 0;
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
              table th {
                background: #3498db;
                color: #fff;
                -webkit-print-color-adjust: exact;
              }
              table th, table td {
                font-size: 12px;
                padding: 8px;
              }
              .footer {
                font-size: 11px;
              }
              .status-badge {
                -webkit-print-color-adjust: exact;
              }
              .invoice-details {
                break-inside: avoid;
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
                  <th>الحالة</th>
                  <th>المدين</th>
                  <th>الدائن</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                ${sortedDataSource.map((item) => `
                  <tr>
                    <td>${item.date}</td>
                    <td>${item.description}</td>
                    <td>
                      ${item.status ? `
                        <span class="status-badge status-${item.status === 'paid' ? 'paid' : item.status === 'partially_paid' ? 'partially' : 'pending'}">
                          ${translateStatus(item.status)}
                        </span>
                      ` : ''}
                    </td>
                    <td>${Number(item.debit).toLocaleString()} ج.م</td>
                    <td>${Number(item.credit).toLocaleString()} ج.م</td>
                    <td>${Number(item.balance).toLocaleString()} ج.م</td>
                  </tr>
                  ${item.type === 'invoice' ? `
                    <tr>
                      <td colspan="6" class="invoice-details">
                        <h3>تفاصيل الفاتورة ${item.description.split('#')[1]}</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>اسم الصنف</th>
                              <th>الكمية</th>
                              <th>الوحدة</th>
                              <th>الماركة</th>
                              <th>سعر الوحدة</th>
                              <th>الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${item.invoiceDetails.items.map((invItem: any) => {
                              const unit = invItem.consumable?.unit || '';
                              return `
                                <tr>
                                  <td>${invItem.itemName}</td>
                                  <td>${invItem.quantity}</td>
                                  <td>${unit}</td>
                                  <td>${invItem.brand || '-'}</td>
                                  <td>${Number(invItem.unitPrice).toLocaleString()} ج.م</td>
                                  <td>${(Number(invItem.quantity) * Number(invItem.unitPrice)).toLocaleString()} ج.م</td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colspan="5">الإجمالي</td>
                              <td>${Number(item.debit).toLocaleString()} ج.م</td>
                            </tr>
                            ${item.invoiceDetails.paidAmount > 0 ? `
                              <tr>
                                <td colspan="5">المدفوع</td>
                                <td>${Number(item.invoiceDetails.paidAmount).toLocaleString()} ج.م</td>
                              </tr>
                              <tr>
                                <td colspan="5">المتبقي</td>
                                <td>${(Number(item.debit) - Number(item.invoiceDetails.paidAmount)).toLocaleString()} ج.م</td>
                              </tr>
                            ` : ''}
                          </tfoot>
                        </table>
                      </td>
                    </tr>
                  ` : ''}
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5">الرصيد النهائي</td>
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

  const renderInvoiceDetails = (invoice: any) => {
    if (!invoice) return null;
    
    const itemsData = invoice.items.map((item: any) => ({
      key: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      brand: item.brand || '-',
      unit: item.consumable?.unit || '-',
      total: Number(item.quantity) * Number(item.unitPrice)
    }));

    return (
      <div className="p-4 rounded-md border mt-2 mb-4" style={{ borderColor: "#f0f0f0" }}>
        <h3 className="text-lg font-semibold mb-3">تفاصيل الفاتورة #{invoice.id}</h3>
        <div className="flex justify-between mb-3">
          <div>
            <p>نوع الفاتورة: <Tag color="blue">{invoice.invoiceType}</Tag></p>
            <p>تاريخ الفاتورة: {new Date(invoice.invoiceDate).toLocaleDateString("ar-EG")}</p>
          </div>
          <div>
            <p>إجمالي الفاتورة: <span className="font-bold">{Number(invoice.totalAmount).toLocaleString()} ج.م</span></p>
            <p>المدفوع: <span className="font-bold">{Number(invoice.paidAmount).toLocaleString()} ج.م</span></p>
            <p>المتبقي: <span className="font-bold">{(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toLocaleString()} ج.م</span></p>
          </div>
        </div>
        <Table 
          columns={itemColumns}
          dataSource={itemsData}
          pagination={false}
          size="small"
          bordered
          summary={(pageData) => {
            const total = pageData.reduce((sum, item) => sum + Number(item.total), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>الإجمالي</Table.Summary.Cell>
                <Table.Summary.Cell index={5}>{total.toLocaleString()} ج.م</Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<div>كشف حساب المورد: {supplier.name}</div>}
      footer={[
        <Button key="close" onClick={onClose}>إغلاق</Button>
      ]}
      width={1400}
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
              icon={<Printer />}
              onClick={handlePrint}
            >
              طباعة
            </Button>
            
            <Table
              columns={columns}
              dataSource={sortedDataSource}
              pagination={false}
              rowKey={(record) => `${record.type}-${record.id}`}
              expandable={{
                expandedRowRender: (record) => 
                  record.type === 'invoice' && expandedInvoice === record.id 
                    ? renderInvoiceDetails(record.invoiceDetails)
                    : null,
                expandedRowKeys: expandedInvoice ? [`invoice-${expandedInvoice}`] : [],
                onExpand: (expanded, record) => {
                  if (record.type === 'invoice') {
                    setExpandedInvoice(expanded ? record.id : null);
                  }
                },
                expandIcon: () => null, // Hide default expand icon since we use our own button
              }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      الرصيد النهائي
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>
                      {runningBalance.toLocaleString()} ج.م
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
