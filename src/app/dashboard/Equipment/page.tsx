"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Table, Tag, Modal, Input, Form, Select, Spin, Badge, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, WarningOutlined, FilterOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Printer } from "lucide-react";
import NewEquipment from "./NewEquipment";
import EditEquipment from "./EditEquipment";
import { useRouter } from "next/navigation";
import { ColumnType } from "antd/es/table";

const { Option } = Select;

interface Equipment {
  id: number;
  name: string;
  code: string;
  quantity: number;
  brand: string;
  status: string;
  supplier: {
    id: number;
    name: string;
  };
}

export default function EquipmentPage() {
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const response = await axios.get("/api/equipment");
      return response.data;
    },
  });

  // جلب الموردين
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axios.get("/api/suppliers");
      return response.data;
    },
  });

  // حساب إحصائيات المعدات
  const statsData = {
    total: equipment.reduce((sum: number, item: Equipment) => sum + item.quantity, 0),
    available: equipment.filter((item: Equipment) => item.status === "available").reduce((sum: number, item: Equipment) => sum + item.quantity, 0),
    underMaintenance: equipment.filter((item: Equipment) => item.status === "under_maintenance").reduce((sum: number, item: Equipment) => sum + item.quantity, 0),
    broken: equipment.filter((item: Equipment) => item.status === "broken").reduce((sum: number, item: Equipment) => sum + item.quantity, 0),
  };

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/equipment/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("تم حذف المعدة بنجاح");
      setIsDeleteModalVisible(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء حذف المعدة");
    },
  });

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsEditOpen(true);
  };

  const showDeleteConfirm = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDeleteModalVisible(true);
  };

  const handleDelete = () => {
    if (selectedEquipment) {
      deleteEquipmentMutation.mutate(selectedEquipment.id);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  };

  // تصفية المعدات
  const filteredEquipment = equipment.filter((item: Equipment) => {
    // تصفية حسب النص
    const matchesSearch =
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchText.toLowerCase()));

    // تصفية حسب الحالة
    const matchesStatus = filterStatus ? item.status === filterStatus : true;

    // تصفية حسب المورد
    const matchesSupplier = filterSupplier ? item.supplier.id === filterSupplier : true;

    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // دالة تغيير حالة المعدة
  const changeEquipmentStatus = async (equipment: Equipment, newStatus: string) => {
    try {
      await axios.put(`/api/equipment/${equipment.id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("تم تحديث حالة المعدة بنجاح");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء تحديث حالة المعدة");
    }
  };

  // دالة طباعة تقرير المعدات
  const handlePrint = () => {
    router.push("/dashboard/Equipment/reports");
  };

  const columns = [
    {
      title: "الكود",
      dataIndex: "code",
      key: "code",
      sorter: (a: Equipment, b: Equipment) => a.code.localeCompare(b.code),
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
      sorter: (a: Equipment, b: Equipment) => a.name.localeCompare(b.name),
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a: Equipment, b: Equipment) => a.quantity - b.quantity,
      render: (quantity: number) => (
        <div>
          {quantity <= 5 ? (
            <Tooltip title="الكمية منخفضة">
              <span className="flex items-center">
                {quantity} <WarningOutlined className="text-red-500 ml-1" />
              </span>
            </Tooltip>
          ) : (
            quantity
          )}
        </div>
      ),
    },
    {
      title: "الماركة",
      dataIndex: "brand",
      key: "brand",
      render: (brand: string) => brand || "-",
    },
    {
      title: "المورد",
      dataIndex: ["supplier", "name"],
      key: "supplier",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "متاح", value: "available" },
        { text: "تحت الصيانة", value: "under_maintenance" },
        { text: "تالف", value: "broken" },
      ],
      onFilter: (value: string, record: Equipment) => record.status === value,
      render: (status: string) => {
        const color = status === "available" ? "green" : status === "under_maintenance" ? "orange" : "red";
        const text = status === "available" ? "متاح" : status === "under_maintenance" ? "تحت الصيانة" : "تالف";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: Equipment) => (
        <div className="flex gap-2">
          <Button
            type="text"
            onClick={() => handleEdit(record)}
            title="تعديل"
          >
            <EditOutlined className="text-blue-500" />
          </Button>
          <Button
            type="text"
            onClick={() => showDeleteConfirm(record)}
            disabled={deleteEquipmentMutation.isPending}
            title="حذف"
          >
            <DeleteOutlined className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-center">إدارة المعدات</h1>

      {/* إحصائيات المعدات */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">إجمالي كميات المعدات</p>
            <p className="text-3xl font-bold text-blue-600">{statsData.total}</p>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات المعدات المتاحة</p>
            <p className="text-3xl font-bold text-green-600">{statsData.available}</p>
          </div>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات تحت الصيانة</p>
            <p className="text-3xl font-bold text-orange-500">{statsData.underMaintenance}</p>
          </div>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات المعدات التالفة</p>
            <p className="text-3xl font-bold text-red-600">{statsData.broken}</p>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="بحث عن معدة"
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <div className="flex-1 min-w-[200px] flex gap-2">
          <Select
            placeholder="تصفية حسب الحالة"
            style={{ width: '100%' }}
            onChange={(value) => setFilterStatus(value)}
            allowClear
            onClear={() => setFilterStatus(null)}
          >
            <Option value="available">متاح</Option>
            <Option value="under_maintenance">تحت الصيانة</Option>
            <Option value="broken">تالف</Option>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px] flex gap-2">
          <Select
            placeholder="تصفية حسب المورد"
            style={{ width: '100%' }}
            onChange={(value) => setFilterSupplier(value)}
            allowClear
            onClear={() => setFilterSupplier(null)}
          >
            {suppliers.map((supplier: any) => (
              <Option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </Option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            إضافة معدة
          </Button>
          <Button
            type="default"
            icon={<Printer size={16} className="ml-1" />}
            onClick={handlePrint}
          >
            تقارير
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns as ColumnType<Equipment>[]}
            dataSource={filteredEquipment}
            pagination={{ pageSize: 10 }}
            className="shadow-md rounded-lg"
            bordered
            rowKey="id"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    عدد المعدات
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={5}>
                    {filteredEquipment.length}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        )}
      </Card>

      {isModalOpen && (
        <NewEquipment
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isEditOpen && selectedEquipment && (
        <EditEquipment
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          equipment={selectedEquipment}
        />
      )}

      <Modal
        title="تأكيد الحذف"
        open={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="حذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true }}
      >
        <p>
          هل أنت متأكد من حذف المعدة:{" "}
          <strong>{selectedEquipment?.name}</strong>؟
        </p>
        <p>لا يمكن التراجع عن هذا الإجراء.</p>
      </Modal>
    </div>
  );
} 