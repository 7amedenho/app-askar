"use client";
import { Table, Input, Button, Spin, Modal } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FaTrashAlt, FaPen } from "react-icons/fa";
import { useState } from "react";
import { Printer } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import NewSupplier from "./NewSupplier";
import EditSupplier from "./EditSupplier";
import NewInvoice from "./NewInvoice";
import SupplierStatement from "./SupplierStatement";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export default function SuppliersPage() {
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
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
          <title>تقرير الموردين</title>
          <style>
            body { font-family: 'Cairo', sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
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
                    <td>${sup.balance}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const columns = [
    { title: "الاسم", dataIndex: "name", key: "name" },
    { title: "رقم الهاتف", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "العنوان", dataIndex: "address", key: "address" },
    { title: "الرصيد", dataIndex: "balance", key: "balance" },
    {
      title: "العمليات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
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
          >
            إضافة فاتورة
          </Button>
          <Button
            type="default"
            onClick={() => {
              setSelectedSupplier(record);
              setIsStatementOpen(true);
            }}
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
      <div className="flex items-center">
        <Input
          placeholder="بحث عن مورد"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
        />
        <div className="flex items-center gap-2 mx-2">
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
          <div className="flex justify-center items-center">
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
      <Modal
        title="تأكيد الحذف"
        visible={isDeleteModalVisible}
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
