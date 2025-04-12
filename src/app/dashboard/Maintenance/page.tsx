"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Input, Modal, Select, Table, Spin, Tag, Form, DatePicker, Badge, Tooltip } from "antd";
import { PlusCircle, Search, Edit, Trash, ArrowUpRight, Printer, BarChart2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

const { Option } = Select;
const { RangePicker } = DatePicker;

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

interface Maintenance {
  id: number;
  equipment: {
    id: number;
    name: string;
    code: string;
    quantity: number;
  };
  status: string;
  date: string;
  notes: string;
  returnedQuantity?: number;
  brokenQuantity?: number;
  pendingQuantity?: number;
}

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEquipment, setFilterEquipment] = useState<number | null>(null);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [sendForm] = Form.useForm();
  const [distributeForm] = Form.useForm();

  // جلب بيانات المعدات للفلترة
  const fetchEquipment = async () => {
    const response = await axios.get("/api/equipment");
    return response.data;
  };

  // جلب سجلات الصيانة
  const fetchMaintenance = async (): Promise<Maintenance[]> => {
    const response = await axios.get("/api/maintenance");
    return response.data;
  };

  // حذف سجل صيانة
  const deleteMaintenance = async (id: number) => {
    await axios.delete(`/api/maintenance/${id}`);
  };

  const { data: equipment = [], isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["equipment"],
    queryFn: fetchEquipment,
  });

  const { data: maintenance = [], isLoading } = useQuery<Maintenance[], Error>({
    queryKey: ["maintenance"],
    queryFn: fetchMaintenance,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("تم حذف سجل الصيانة بنجاح!");
      setIsDeleteModalVisible(false);
    },
    onError: () => {
      toast.error("حدث خطأ في حذف سجل الصيانة");
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await axios.put(`/api/maintenance/${id}`, { status, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("تم تحديث حالة الصيانة بنجاح");
      setIsStatusModalVisible(false);
    },
  });

  // جلب المعدات المتاحة للإرسال للصيانة
  const { data: availableEquipment = [], isLoading: isLoadingEquipmentAvailable } = useQuery({
    queryKey: ["equipment", "available"],
    queryFn: async () => {
      const response = await axios.get("/api/equipment?status=available");
      return response.data;
    },
  });

  // إحصائيات الصيانة
  const statsData = {
    total: maintenance.reduce((sum: number, item: Maintenance) => sum + (item.pendingQuantity || item.equipment.quantity), 0),
    sent: maintenance.filter((item: Maintenance) => item.status === "sent").reduce((sum: number, item: Maintenance) => sum + (item.pendingQuantity || item.equipment.quantity), 0),
    returned: maintenance.filter((item: Maintenance) => item.status === "returned").reduce((sum: number, item: Maintenance) => sum + (item.returnedQuantity || 0), 0),
    broken: maintenance.filter((item: Maintenance) => item.status === "broken").reduce((sum: number, item: Maintenance) => sum + (item.brokenQuantity || 0), 0),
    fixed: maintenance.filter((item: Maintenance) => item.status === "fixed").reduce((sum: number, item: Maintenance) => sum + (item.returnedQuantity || 0), 0),
  };

  // تصفية سجلات الصيانة حسب البحث والحالة والمعدة
  const filteredMaintenance = maintenance.filter((item) => {
    const matchesSearch =
      item.equipment.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      item.equipment.code.toLowerCase().includes(searchInput.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchInput.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" ||
      item.status === filterStatus;

    const matchesEquipment =
      filterEquipment === null ||
      item.equipment.id === filterEquipment;

    return matchesSearch && matchesStatus && matchesEquipment;
  });

  // تأكيد حذف سجل صيانة
  const showDeleteConfirm = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDeleteModalVisible(true);
  };

  // تنفيذ الحذف
  const handleDelete = () => {
    if (selectedMaintenance) {
      deleteMutation.mutate(selectedMaintenance.id);
    }
  };

  const handleStatusChange = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsStatusModalVisible(true);
    form.setFieldsValue({
      status: maintenance.status,
      notes: maintenance.notes,
    });
  };

  const onFinish = (values: any) => {
    if (selectedMaintenance) {
      updateMaintenanceMutation.mutate({
        id: selectedMaintenance.id,
        status: values.status,
        notes: values.notes,
      });
    }
  };

  // ترجمة حالة الصيانة
  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "تم إرسالها للصيانة";
      case "returned":
        return "تم استلامها";
      case "broken":
        return "معطلة";
      case "fixed":
        return "تم إصلاحها";
      default:
        return status;
    }
  };

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  };

  const handleSendToMaintenance = () => {
    sendForm
      .validateFields()
      .then((values) => {
        // إرسال الطلب للخادم
        axios
          .post("/api/maintenance", values)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["maintenance"] });
            queryClient.invalidateQueries({ queryKey: ["equipment"] });
            toast.success("تم إرسال المعدة للصيانة بنجاح");
            setIsSendModalOpen(false);
            sendForm.resetFields();
          })
          .catch((error) => {
            toast.error(error.response?.data?.message || "حدث خطأ أثناء إرسال المعدة للصيانة");
          });
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDistribute = () => {
    distributeForm
      .validateFields()
      .then((values) => {
        if (selectedMaintenance) {
          // التحقق من أن مجموع الكميات صحيح
          const { workingQuantity, brokenQuantity, pendingQuantity } = values;
          const totalQuantity = parseInt(workingQuantity) + parseInt(brokenQuantity) + parseInt(pendingQuantity);
          const originalQuantity = selectedMaintenance.pendingQuantity || 0;

          if (totalQuantity !== originalQuantity) {
            toast.error(`مجموع الكميات يجب أن يساوي ${originalQuantity}`);
            return;
          }

          // إرسال الطلب للخادم
          axios
            .put(`/api/maintenance/${selectedMaintenance.id}/distribute`, values)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["maintenance"] });
              queryClient.invalidateQueries({ queryKey: ["equipment"] });
              toast.success("تم توزيع المعدات بنجاح");
              setIsDistributeModalOpen(false);
              distributeForm.resetFields();
            })
            .catch((error) => {
              toast.error(error.response?.data?.message || "حدث خطأ أثناء توزيع المعدات");
            });
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const showDistributeModal = (record: Maintenance) => {
    setSelectedMaintenance(record);
    setIsDistributeModalOpen(true);
    distributeForm.setFieldsValue({
      workingQuantity: 0,
      brokenQuantity: 0,
      pendingQuantity: record.pendingQuantity || record.equipment.quantity,
    });
  };

  // طباعة التقرير
  const handlePrint = () => {
    router.push("/dashboard/Maintenance/reports");
  };

  const columns = [
    {
      title: "المعدة",
      dataIndex: ["equipment", "name"],
      key: "equipment",
      render: (text: string, record: Maintenance) => (
        <span>
          {text} ({record.equipment.code})
        </span>
      ),
    },
    {
      title: "تاريخ الإرسال",
      dataIndex: "date",
      key: "date",
      render: (date: string) => formatDate(date),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "";
        if (status === "sent") color = "orange";
        else if (status === "returned") color = "green";
        else if (status === "broken") color = "red";
        else if (status === "fixed") color = "blue";

        return <Tag color={color}>{getStatusText(status)}</Tag>;
      },
    },
    {
      title: "الكمية الكلية",
      dataIndex: "pendingQuantity",
      key: "pendingQuantity",
      render: (qty: number, record: Maintenance) => (
        <span>{qty || record.equipment.quantity}</span>
      ),
    },
    {
      title: "الكمية الصالحة",
      dataIndex: "returnedQuantity",
      key: "returnedQuantity",
      render: (qty: number) => <span>{qty || 0}</span>,
    },
    {
      title: "الكمية التالفة",
      dataIndex: "brokenQuantity",
      key: "brokenQuantity",
      render: (qty: number) => <span>{qty || 0}</span>,
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || "-",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: Maintenance) => (
        <div className="flex gap-2">
          <Button
            type="text"
            onClick={() => handleStatusChange(record)}
            title="تحديث الحالة"
            icon={<EditOutlined className="text-blue-500" />}
          />
          <Button
            type="text"
            onClick={() => showDistributeModal(record)}
            disabled={record.status !== "sent"}
            title="توزيع المعدة"
            icon={<ArrowUpRight className="text-green-500" />}
          />
          <Button
            type="text"
            onClick={() => showDeleteConfirm(record)}
            title="حذف"
            icon={<DeleteOutlined className="text-red-500" />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-center">إدارة الصيانة</h1>

      {/* إحصائيات الصيانة */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="dark border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">إجمالي كميات المعدات</p>
            <p className="text-3xl font-bold text-blue-600">{statsData.total}</p>
          </div>
        </Card>
        <Card className="border-orange-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات مرسلة للصيانة</p>
            <p className="text-3xl font-bold text-orange-500">{statsData.sent}</p>
          </div>
        </Card>
        <Card className="border-green-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات تم إصلاحها</p>
            <p className="text-3xl font-bold text-green-600">{statsData.fixed}</p>
          </div>
        </Card>
        <Card className="border-red-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات معطلة</p>
            <p className="text-3xl font-bold text-red-600">{statsData.broken}</p>
          </div>
        </Card>
        <Card className="border-blue-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">كميات تم استلامها</p>
            <p className="text-3xl font-bold text-blue-600">{statsData.returned}</p>
          </div>
        </Card>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            type="primary"
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center gap-1"
            icon={<PlusOutlined />}
          >
            إرسال معدة للصيانة
          </Button>
          <Button
            onClick={() => router.push("/dashboard/Maintenance/Distribute")}
            className="flex items-center gap-1"
            icon={<ArrowUpRight size={16} />}
          >
            توزيع المعدات
          </Button>
          <Button
            type="default"
            onClick={handlePrint}
            className="flex items-center gap-1"
            icon={<Printer size={16} />}
          >
            تقارير الصيانة
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="بحث في سجلات الصيانة..."
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                placeholder="تصفية حسب المعدة"
                className="w-full"
                onChange={(value) => setFilterEquipment(value)}
                allowClear
                onClear={() => setFilterEquipment(null)}
              >
                {equipment.map((item: any) => (
                  <Option key={item.id} value={item.id}>
                    {item.name} - {item.code}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                placeholder="تصفية حسب الحالة"
                className="w-full"
                onChange={(value) => setFilterStatus(value)}
                defaultValue="all"
              >
                <Option value="all">جميع الحالات</Option>
                <Option value="sent">تم إرسالها للصيانة</Option>
                <Option value="returned">تم استلامها من الصيانة</Option>
                <Option value="broken">معطلة</Option>
                <Option value="fixed">تم إصلاحها</Option>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={filteredMaintenance}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "لا توجد سجلات صيانة" }}
              bordered
            />
          )}
        </CardContent>
      </Card>

      {/* نافذة تحديث الحالة */}
      <Modal
        title="تحديث حالة الصيانة"
        open={isStatusModalVisible}
        onCancel={() => setIsStatusModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="status"
            label="الحالة"
            rules={[{ required: true, message: "يرجى اختيار الحالة" }]}
          >
            <Select>
              <Option value="sent">تم الإرسال</Option>
              <Option value="returned">تم الاستلام</Option>
              <Option value="fixed">تم الإصلاح</Option>
              <Option value="broken">تالف</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="ملاحظات"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              حفظ التغييرات
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* نافذة تأكيد الحذف */}
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
          هل أنت متأكد من حذف سجل صيانة المعدة:{" "}
          <strong>{selectedMaintenance?.equipment.name}</strong>؟
        </p>
        <p>لا يمكن التراجع عن هذا الإجراء.</p>
      </Modal>

      {/* نافذة إرسال معدة للصيانة */}
      <Modal
        title="إرسال معدة للصيانة"
        open={isSendModalOpen}
        onOk={handleSendToMaintenance}
        onCancel={() => setIsSendModalOpen(false)}
        okText="إرسال"
        cancelText="إلغاء"
      >
        <Form
          form={sendForm}
          layout="vertical"
        >
          <Form.Item
            name="equipmentId"
            label="المعدة"
            rules={[{ required: true, message: "يرجى اختيار المعدة" }]}
          >
            <Select
              loading={isLoadingEquipmentAvailable}
              placeholder="اختر المعدة"
            >
              {availableEquipment.map((equipment: Equipment) => (
                <Option key={equipment.id} value={equipment.id}>
                  {equipment.name} - {equipment.code} (الكمية: {equipment.quantity})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="الكمية المرسلة للصيانة"
            rules={[{ required: true, message: "يرجى إدخال الكمية" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item
            name="notes"
            label="ملاحظات"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* نافذة توزيع المعدة */}
      <Modal
        title="توزيع المعدة"
        open={isDistributeModalOpen}
        onOk={handleDistribute}
        onCancel={() => setIsDistributeModalOpen(false)}
        okText="توزيع"
        cancelText="إلغاء"
      >
        {selectedMaintenance && (
          <Form
            form={distributeForm}
            layout="vertical"
          >
            <div className="mb-4">
              <p className="font-bold">المعدة: {selectedMaintenance.equipment.name}</p>
              <p>الكمية الكلية: {selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity}</p>
            </div>

            <Form.Item
              name="workingQuantity"
              label="عدد المعدات التي تم إصلاحها"
              rules={[{ required: true, message: "يرجى إدخال العدد" }]}
            >
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item
              name="brokenQuantity"
              label="عدد المعدات التالفة"
              rules={[{ required: true, message: "يرجى إدخال العدد" }]}
            >
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item
              name="pendingQuantity"
              label="عدد المعدات المتبقية في الصيانة"
              rules={[{ required: true, message: "يرجى إدخال العدد" }]}
            >
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item
              name="notes"
              label="ملاحظات"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}