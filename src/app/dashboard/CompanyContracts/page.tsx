"use client";
import { Table, Input, Button, Spin, Modal, Drawer, Tabs, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FaTrashAlt, FaPen, FaFileInvoice } from "react-icons/fa";
import { Printer } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import NewCompanyContract from "./NewCompanyContract";
import EditCompanyContract from "./EditCompanyContract";
import NewCompanyTransaction from "./NewCompanyTransaction";
import EditCompanyTransaction from "./EditCompanyTransaction";
import PrintTransaction from "./PrintTransaction";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

export default function CompanyContractsPage() {
  const [searchText, setSearchText] = useState("");
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isPrintTransactionOpen, setIsPrintTransactionOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDeleteCompanyModalVisible, setIsDeleteCompanyModalVisible] =
    useState(false);
  const [isDeleteTransactionModalVisible, setIsDeleteTransactionModalVisible] =
    useState(false);
  const [isTransactionsDrawerOpen, setIsTransactionsDrawerOpen] =
    useState(false);
  const queryClient = useQueryClient();

  // جلب بيانات الشركات
  const fetchCompanies = async () => {
    const res = await axios.get(`/api/company-contracts?search=${searchText}`);
    return res.data;
  };

  const { data: companiesData = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companyContracts", searchText],
    queryFn: fetchCompanies,
  });

  // جلب معاملات شركة محددة
  const fetchCompanyTransactions = async (companyId: number) => {
    if (!companyId) return [];
    const res = await axios.get(
      `/api/company-transactions?companyId=${companyId}`
    );
    return res.data;
  };

  const { data: transactionsData = [], isLoading: isLoadingTransactions } =
    useQuery({
      queryKey: ["companyTransactions", selectedCompany?.id],
      queryFn: () => fetchCompanyTransactions(selectedCompany?.id),
      enabled: !!selectedCompany?.id && isTransactionsDrawerOpen,
    });

  // البحث عن شركة
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  };

  // حذف شركة
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/company-contracts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم حذف الشركة بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["companyContracts"] });
      setIsDeleteCompanyModalVisible(false);
    },
    onError: (error: any) => {
      toast.error(
        `فشل في حذف الشركة: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // حذف معاملة
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/company-transactions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("تم حذف المعاملة بنجاح!");
      queryClient.invalidateQueries({
        queryKey: ["companyTransactions", selectedCompany?.id],
      });
      setIsDeleteTransactionModalVisible(false);
    },
    onError: (error: any) => {
      toast.error(
        `فشل في حذف المعاملة: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // عرض تأكيد حذف شركة
  const showDeleteCompanyConfirm = (company: any) => {
    setSelectedCompany(company);
    setIsDeleteCompanyModalVisible(true);
  };

  // عرض تأكيد حذف معاملة
  const showDeleteTransactionConfirm = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDeleteTransactionModalVisible(true);
  };

  // فتح درج معاملات الشركة
  const openTransactionsDrawer = (company: any) => {
    setSelectedCompany(company);
    setIsTransactionsDrawerOpen(true);
  };

  // تعديل شركة
  const handleEditCompany = (company: any) => {
    setSelectedCompany(company);
    setIsEditCompanyOpen(true);
  };

  // تعديل معاملة
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  // طباعة معاملة
  const handlePrintTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsPrintTransactionOpen(true);
  };

  // أعمدة جدول الشركات
  const companyColumns = [
    {
      title: "اسم الشركة",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: "رقم الهاتف",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (text: string) => text || "-",
    },
    {
      title: "البريد الإلكتروني",
      dataIndex: "email",
      key: "email",
      render: (text: string) => text || "-",
    },
    {
      title: "عدد المعاملات",
      dataIndex: "transactions",
      key: "transactions",
      render: (transactions: any[]) => transactions?.length || 0,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (text: string, record: any) => (
        <div className="flex space-x-2 space-x-reverse">
          <Button
            type="primary"
            size="small"
            onClick={() => openTransactionsDrawer(record)}
          >
            معاملات
          </Button>
          <Button
            type="default"
            size="small"
            icon={<FaPen className="text-blue-500" />}
            onClick={() => handleEditCompany(record)}
          />
          <Button
            type="default"
            size="small"
            icon={<FaTrashAlt className="text-red-500" />}
            onClick={() => showDeleteCompanyConfirm(record)}
          />
        </div>
      ),
    },
  ];

  // أعمدة جدول المعاملات
  const transactionColumns = [
    {
      title: "اسم المشروع",
      dataIndex: "projectName",
      key: "projectName",
      sorter: (a: any, b: any) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: "رقم العقد",
      dataIndex: "contractNumber",
      key: "contractNumber",
    },
    {
      title: "تاريخ العقد",
      dataIndex: "contractDate",
      key: "contractDate",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
      sorter: (a: any, b: any) =>
        new Date(a.contractDate).getTime() - new Date(b.contractDate).getTime(),
    },
    {
      title: "رقم الملف",
      dataIndex: "fileNumber",
      key: "fileNumber",
    },
    {
      title: "قيمة العقد",
      dataIndex: "contractValue",
      key: "contractValue",
      render: (value: number) => value?.toLocaleString() + " جنيه" || "-",
      sorter: (a: any, b: any) => a.contractValue - b.contractValue,
    },
    {
      title: "النسبة (%)",
      dataIndex: "percentage",
      key: "percentage",
      render: (value: number) => value + "%" || "-",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "";
        switch (status) {
          case "مكتمل":
            color = "success";
            break;
          case "جارٍ التنفيذ":
            color = "processing";
            break;
          case "متوقف":
            color = "error";
            break;
          case "مفقود":
            color = "default";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{status}</Tag>;
      },
      filters: [
        { text: "مكتمل", value: "مكتمل" },
        { text: "جارٍ التنفيذ", value: "جارٍ التنفيذ" },
        { text: "متوقف", value: "متوقف" },
        { text: "مفقود", value: "مفقود" },
      ],
      onFilter: (value: string, record: any) => record.status === value,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (text: string, record: any) => (
        <div className="flex space-x-2 space-x-reverse">
          <Button
            type="default"
            size="small"
            icon={<FaPen className="text-blue-500" />}
            onClick={() => handleEditTransaction(record)}
          />
          <Button
            type="default"
            size="small"
            icon={<FaTrashAlt className="text-red-500" />}
            onClick={() => showDeleteTransactionConfirm(record)}
          />
          <Button
            type="default"
            size="small"
            icon={<Printer className="h-3 w-3 text-green-500" />}
            onClick={() => handlePrintTransaction(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <div className="flex justify-between items-center mb-6 px-5">
          <h1 className="text-2xl font-bold">إدارة عقود الشركات</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsNewCompanyOpen(true)}
          >
            إضافة شركة جديدة
          </Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="البحث عن شركة..."
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            value={searchText}
            allowClear
          />
        </div>

        {isLoadingCompanies ? (
          <div className="flex justify-center items-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={companiesData}
            columns={companyColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "لا توجد بيانات" }}
          />
        )}

        {/* نافذة إضافة شركة جديدة */}
        <NewCompanyContract
          isOpen={isNewCompanyOpen}
          onClose={() => setIsNewCompanyOpen(false)}
        />

        {/* نافذة تعديل شركة */}
        {selectedCompany && (
          <EditCompanyContract
            isOpen={isEditCompanyOpen}
            onClose={() => setIsEditCompanyOpen(false)}
            company={selectedCompany}
          />
        )}

        {/* مربع حوار تأكيد حذف شركة */}
        <Modal
          title="تأكيد الحذف"
          open={isDeleteCompanyModalVisible}
          onOk={() => deleteCompanyMutation.mutate(selectedCompany?.id)}
          onCancel={() => setIsDeleteCompanyModalVisible(false)}
          okText="حذف"
          cancelText="إلغاء"
          okButtonProps={{
            danger: true,
            loading: deleteCompanyMutation.isPending,
          }}
        >
          <p>
            هل أنت متأكد من حذف الشركة &quot;{selectedCompany?.name}&quot;؟
            <br />
            <strong className="text-red-500">
              سيتم حذف جميع المعاملات المرتبطة بهذه الشركة أيضًا.
            </strong>
          </p>
        </Modal>

        {/* نافذة معاملات الشركة */}
        <Modal
          title={`معاملات شركة: ${selectedCompany?.name || ""}`}
          open={isTransactionsDrawerOpen}
          onCancel={() => setIsTransactionsDrawerOpen(false)}
          footer={null}
          width={1200}
          centered
          style={{ top: 20 }}
        >
          <div className="flex justify-end mb-4">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsNewTransactionOpen(true)}
            >
              إضافة معاملة جديدة
            </Button>
          </div>
          {isLoadingTransactions ? (
            <div className="flex justify-center items-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={transactionsData}
              columns={transactionColumns as any}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "لا توجد معاملات لهذه الشركة" }}
            />
          )}

          {/* نافذة إضافة معاملة جديدة */}
          {selectedCompany && (
            <NewCompanyTransaction
              isOpen={isNewTransactionOpen}
              onClose={() => setIsNewTransactionOpen(false)}
              companyId={selectedCompany.id}
            />
          )}

          {/* نافذة تعديل معاملة */}
          {selectedTransaction && (
            <EditCompanyTransaction
              isOpen={isEditTransactionOpen}
              onClose={() => setIsEditTransactionOpen(false)}
              transaction={selectedTransaction}
              companyId={selectedCompany?.id}
            />
          )}

          {/* نافذة طباعة معاملة */}
          {selectedTransaction && isPrintTransactionOpen && (
            <div
              style={{
                zIndex: 99999,
              }}
            >
              <PrintTransaction
                isOpen={isPrintTransactionOpen}
                onClose={() => setIsPrintTransactionOpen(false)}
                transactionId={selectedTransaction.id}
              />
            </div>
          )}

          {/* مربع حوار تأكيد حذف معاملة */}
          <Modal
            title="تأكيد الحذف"
            open={isDeleteTransactionModalVisible}
            onOk={() =>
              deleteTransactionMutation.mutate(selectedTransaction?.id)
            }
            onCancel={() => setIsDeleteTransactionModalVisible(false)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{
              danger: true,
              loading: deleteTransactionMutation.isPending,
            }}
          >
            <p>
              هل أنت متأكد من حذف معاملة المشروع &quot;
              {selectedTransaction?.projectName}&quot;؟
            </p>
          </Modal>
        </Modal>
      </Card>
    </div>
  );
}
