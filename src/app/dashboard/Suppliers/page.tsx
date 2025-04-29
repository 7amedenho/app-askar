"use client";
import { Table, Input, Button, Spin, Modal } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FaTrashAlt, FaPen } from "react-icons/fa";
import { useState } from "react";
import { Printer, DollarSign, FileText } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import NewSupplier from "./NewSupplier";
import EditSupplier from "./EditSupplier";
import NewInvoice from "./NewInvoice";
import SupplierStatement from "./SupplierStatement";
import InvoicesList from "./InvoicesList";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export default function SuppliersPage() {
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isInvoicesListOpen, setIsInvoicesListOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const queryClient = useQueryClient();

  // جلب بيانات الموردين
  const fetchSuppliers = async () => {
    const res = await axios.get("/api/suppliers");
    return res.data;
  };

  const { data: suppliersData = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  // البحث عن مورد
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  };

  // دالة الحذف
  const deleteSupplier = async (id: number) => {
    const response = await axios.delete(`/api/suppliers/${id}`);
    return response.data;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success("تم حذف المورد بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      toast.error(`فشل في حذف المورد: ${error.response?.data?.error}`);
    },
  });

  const showDeleteConfirm = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDeleteModalVisible(true);
  };

  // دالة طباعة تقرير الموردين
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير الموردين - عسكر للمقاولات العمومية</title>
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
  
            <h2>تقرير الموردين</h2>
  
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الهاتف</th>
                  <th>العنوان</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                ${suppliersData
          .filter((sup: any) =>
            sup.name.toLowerCase().includes(searchText)
          )
          .map(
            (sup: any) => `
                    <tr>
                      <td>${sup.name}</td>
                      <td>${sup.phoneNumber}</td>
                      <td>${sup.address}</td>
                      <td>${Number(sup.balance).toLocaleString()} ج.م</td>
                    </tr>
                  `
          )
          .join("")}
              </tbody>
            </table>
  
            <div class="timestamp">
              تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}
            </div>
  
            <div class="footer">
              <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
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

  const columns = [
    { title: "الاسم", dataIndex: "name", key: "name" },
    { title: "رقم الهاتف", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "العنوان", dataIndex: "address", key: "address" },
    { 
      title: "الرصيد", 
      dataIndex: "balance", 
      key: "balance",
      render: (value: number) => `${Number(value).toLocaleString()} ج.م`
    },
    {
      title: "العمليات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2 flex-wrap">
          <Button
            type="text"
            onClick={() => {
              setSelectedSupplier(record);
              setIsEditOpen(true);
            }}
          >
            <FaPen className="text-blue-500" />
          </Button>
          <Button
            type="text"
            onClick={() => showDeleteConfirm(record)}
            disabled={deleteMutation.isPending}
          >
            <FaTrashAlt className="text-red-500" />
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setSelectedSupplier(record);
              setIsInvoiceOpen(true);
            }}
            icon={<PlusOutlined />}
          >
            إضافة فاتورة
          </Button>
          <Button
            type="default"
            onClick={() => {
              setSelectedSupplier(record);
              setIsInvoicesListOpen(true);
            }}
            icon={<FileText className="h-4 w-4" />}
          >
            قائمة الفواتير
          </Button>
          <Button
            type="default"
            onClick={() => {
              setSelectedSupplier(record);
              setIsStatementOpen(true);
            }}
            icon={<DollarSign className="h-4 w-4" />}
          >
            كشف حساب
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-center">إدارة الموردين</h1>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Input
          placeholder="بحث عن مورد"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
          className="w-64"
        />
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            إضافة مورد
          </Button>
          <Button type="default" icon={<Printer />} onClick={handlePrint}>
            طباعة
          </Button>
        </div>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={suppliersData.filter((sup: any) =>
              sup.name.toLowerCase().includes(searchText)
            )}
            pagination={{ pageSize: 5 }}
            className="shadow-md rounded-lg"
            bordered
            rowKey="id"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    عدد الموردين
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    {suppliersData.length}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    إجمالي الأرصدة
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {suppliersData.reduce((sum: number, sup: any) => sum + Number(sup.balance), 0).toLocaleString()} ج.م
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        )}
      </Card>
      {isModalOpen && (
        <NewSupplier
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isEditOpen && selectedSupplier && (
        <EditSupplier
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          supplier={selectedSupplier}
        />
      )}
      {isInvoiceOpen && selectedSupplier && (
        <NewInvoice
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          supplier={selectedSupplier}
        />
      )}
      {isStatementOpen && selectedSupplier && (
        <SupplierStatement
          isOpen={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
          supplier={selectedSupplier}
        />
      )}
      {isInvoicesListOpen && selectedSupplier && (
        <InvoicesList
          isOpen={isInvoicesListOpen}
          onClose={() => setIsInvoicesListOpen(false)}
          supplier={selectedSupplier}
        />
      )}
      <Modal
        title="تأكيد الحذف"
        open={isDeleteModalVisible}
        onOk={() => {
          deleteMutation.mutate(selectedSupplier.id);
          setIsDeleteModalVisible(false);
        }}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="حذف"
        cancelText="إلغاء"
        confirmLoading={deleteMutation.isPending}
      >
        <p>هل أنت متأكد أنك تريد حذف هذا المورد؟</p>
      </Modal>
    </div>
  );
}
