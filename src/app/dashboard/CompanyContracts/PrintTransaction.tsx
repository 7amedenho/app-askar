"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button, Spin, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";

interface PrintTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
}

export default function PrintTransaction({
  isOpen,
  onClose,
  transactionId,
}: PrintTransactionProps) {
  // جلب بيانات المعاملة
  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      if (!transactionId) return null;
      const response = await axios.get(
        `/api/company-transactions/${transactionId}`
      );
      return response.data;
    },
    enabled: !!transactionId && isOpen,
  });

  // طباعة المعاملة
  const handlePrint = () => {
    const printContent = document.getElementById("print-transaction");
    const windowPrint = window.open("", "", "width=900,height=600");

    if (windowPrint && printContent) {
      windowPrint.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>معاملة شركة - ${transaction?.companyContract?.name || ""}</title>
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
            .transaction-details {
              padding: 20px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .detail-row {
              display: flex;
              margin-bottom: 15px;
              border-bottom: 1px dashed #e0e0e0;
              padding-bottom: 10px;
            }
            .detail-label {
              font-weight: bold;
              width: 40%;
              color: #3498db;
            }
            .detail-value {
              width: 60%;
            }
            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 5px;
              font-weight: bold;
              color: white;
            }
            .status-completed {
              background-color: #27ae60;
            }
            .status-in-progress {
              background-color: #f39c12;
            }
            .status-stopped {
              background-color: #e74c3c;
            }
            .status-missing {
              background-color: #7f8c8d;
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
            .timestamp {
              text-align: center;
              font-size: 13px;
              color: #7f8c8d;
              margin-top: 15px;
              font-style: italic;
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
              .no-print {
                display: none;
              }
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="/logo.webp" alt="شعار عسكر للمقاولات العمومية">
              </div>
              <div class="company-info">
                <h1>عسكر للمقاولات العمومية</h1>
                <p>تفاصيل معاملة شركة</p>
              </div>
              <div style="width: 130px;"></div>
            </div>
            
            <h2>بيانات المعاملة</h2>
            
            <div class="transaction-details">
              <div class="detail-row">
                <div class="detail-label">اسم الشركة:</div>
                <div class="detail-value">${transaction?.companyContract?.name || "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">اسم المشروع:</div>
                <div class="detail-value">${transaction?.projectName || "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">رقم العقد:</div>
                <div class="detail-value">${transaction?.contractNumber || "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">تاريخ العقد:</div>
                <div class="detail-value">${transaction?.contractDate ? new Date(transaction.contractDate).toLocaleDateString("ar-EG") : "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">تاريخ فتح الملف:</div>
                <div class="detail-value">${transaction?.fileOpenDate ? new Date(transaction.fileOpenDate).toLocaleDateString("ar-EG") : "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">رقم الملف:</div>
                <div class="detail-value">${transaction?.fileNumber || "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">النسبة (%):</div>
                <div class="detail-value">${transaction?.percentage || "0"}%</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">قيمة العقد:</div>
                <div class="detail-value">${transaction?.contractValue?.toLocaleString() || "0"} جنيه</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">رقم الفاتورة:</div>
                <div class="detail-value">${transaction?.invoiceNumber || "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">قيمة الفاتورة:</div>
                <div class="detail-value">${transaction?.invoiceValue ? transaction.invoiceValue.toLocaleString() + " جنيه" : "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">رقم الشهادة:</div>
                <div class="detail-value">${transaction?.certificateNumber || "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">تاريخ الشهادة:</div>
                <div class="detail-value">${transaction?.certificateDate ? new Date(transaction.certificateDate).toLocaleDateString("ar-EG") : "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">القيمة المدفوعة للشهادة:</div>
                <div class="detail-value">${transaction?.certificateValue ? transaction.certificateValue.toLocaleString() + " جنيه" : "-"}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">الحالة:</div>
                <div class="detail-value">
                  <span class="status ${transaction?.status === "مكتمل" ? "status-completed" : transaction?.status === "جارٍ التنفيذ" ? "status-in-progress" : transaction?.status === "متوقف" ? "status-stopped" : "status-missing"}">
                    ${transaction?.status || ""}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>تم إصدار هذا التقرير بواسطة <strong>نظام عسكر للمقاولات العمومية</strong></p>
            </div>
            <div class="timestamp">
              تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}
            </div>
          </div>
        </body>
        </html>
      `);

      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      windowPrint.onafterprint = function () {
        windowPrint.close();
      };
    }
  };

  return (
    <Modal
      title="طباعة معاملة الشركة"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      zIndex={1500}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Spin size="large" />
        </div>
      ) : transaction ? (
        <div className="py-4">
          <div id="print-transaction" className="hidden">
            {/* محتوى الطباعة سيتم إنشاؤه ديناميكيًا في دالة handlePrint */}
          </div>

          <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center p-4 rounded-lg">
              <h3 className="text-lg font-bold ">
                معاملة: {transaction.projectName}
              </h3>
              <p className="">شركة: {transaction.companyContract?.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className=" p-4 rounded-lg shadow-sm">
                  <h4 className="text-base font-semibold mb-3 pb-2 border-b">بيانات العقد</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="">رقم العقد:</span>
                      <span className="font-medium">{transaction.contractNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">تاريخ العقد:</span>
                      <span className="font-medium">{new Date(transaction.contractDate).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">قيمة العقد:</span>
                      <span className="font-medium">{transaction.contractValue?.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">النسبة:</span>
                      <span className="font-medium">{transaction.percentage}%</span>
                    </div>
                  </div>
                </div>

                <div className=" p-4 rounded-lg shadow-sm">
                  <h4 className="text-base font-semibold mb-3 pb-2 border-b">بيانات الملف</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="">رقم الملف:</span>
                      <span className="font-medium">{transaction.fileNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">تاريخ فتح الملف:</span>
                      <span className="font-medium">{transaction.fileOpenDate ? new Date(transaction.fileOpenDate).toLocaleDateString("ar-EG") : "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className=" p-4 rounded-lg shadow-sm">
                  <h4 className="text-base font-semibold mb-3 pb-2 border-b">بيانات الفاتورة</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="">رقم الفاتورة:</span>
                      <span className="font-medium">{transaction.invoiceNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">قيمة الفاتورة:</span>
                      <span className="font-medium">{transaction.invoiceValue ? transaction.invoiceValue.toLocaleString() + " جنيه" : "-"}</span>
                    </div>
                  </div>
                </div>

                <div className=" p-4 rounded-lg shadow-sm">
                  <h4 className="text-base font-semibold mb-3 pb-2 border-b">بيانات الشهادة</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="">رقم الشهادة:</span>
                      <span className="font-medium">{transaction.certificateNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">تاريخ الشهادة:</span>
                      <span className="font-medium">{transaction.certificateDate ? new Date(transaction.certificateDate).toLocaleDateString("ar-EG") : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">قيمة الشهادة:</span>
                      <span className="font-medium">{transaction.certificateValue ? transaction.certificateValue.toLocaleString() + " جنيه" : "-"}</span>
                    </div>
                  </div>
                </div>

                <div className=" p-4 rounded-lg shadow-sm">
                  <h4 className="text-base font-semibold mb-3 pb-2 border-b">الحالة</h4>
                  <div className="flex justify-between items-center">
                    <span className="">حالة المعاملة:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      transaction.status === "مكتمل" ? "bg-green-100 text-green-800" :
                      transaction.status === "جارٍ التنفيذ" ? "bg-yellow-100 text-yellow-800" :
                      transaction.status === "متوقف" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 "
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                size="large"
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
              >
                طباعة المعاملة
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-red-500">
          لا يمكن تحميل بيانات المعاملة
        </div>
      )}
    </Modal>
  );
}
