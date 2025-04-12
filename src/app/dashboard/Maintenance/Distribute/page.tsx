"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Table, Tag, Input, Form, Select, Spin, InputNumber, Alert, Card, Divider } from "antd";
import { toast } from "react-hot-toast";
import { ArrowLeftOutlined, CheckOutlined, SyncOutlined, SaveOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { TextArea } = Input;

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

export default function DistributeMaintenance() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [form] = Form.useForm();

  // جلب سجلات الصيانة التي بحالة "تم الإرسال"
  const { data: maintenanceRecords = [], isLoading } = useQuery({
    queryKey: ["maintenance", "sent"],
    queryFn: async () => {
      const response = await axios.get("/api/maintenance?status=sent");
      return response.data;
    },
  });

  // توزيع المعدات
  const distributeMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!selectedMaintenance) return null;
      const response = await axios.put(`/api/maintenance/${selectedMaintenance.id}/distribute`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("تم توزيع المعدات بنجاح");
      form.resetFields();
      setSelectedMaintenance(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء توزيع المعدات");
    },
  });

  // عند تغيير المعدة، قم بتحديث النموذج
  useEffect(() => {
    if (selectedMaintenance) {
      form.setFieldsValue({
        workingQuantity: 0,
        brokenQuantity: 0,
        pendingQuantity: selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity,
        notes: selectedMaintenance.notes || "",
      });
    } else {
      form.resetFields();
    }
  }, [selectedMaintenance, form]);

  // التحقق من مجموع الكميات
  const validateQuantities = (values: any) => {
    if (!selectedMaintenance) return false;
    
    const { workingQuantity, brokenQuantity, pendingQuantity } = values;
    const totalQuantity = (workingQuantity || 0) + (brokenQuantity || 0) + (pendingQuantity || 0);
    const originalQuantity = selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity;
    
    return totalQuantity === originalQuantity;
  };

  // تقديم النموذج
  const onFinish = (values: any) => {
    if (!validateQuantities(values)) {
      toast.error("مجموع الكميات يجب أن يساوي الكمية الأصلية");
      return;
    }
    
    distributeMutation.mutate(values);
  };

  // حساب الكمية المتبقية تلقائيًا
  const calculateRemainingQuantity = () => {
    if (!selectedMaintenance) return;
    
    const workingQty = Number(form.getFieldValue("workingQuantity") || 0);
    const brokenQty = Number(form.getFieldValue("brokenQuantity") || 0);
    const originalQty = selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity;
    
    const pendingQty = originalQty - workingQty - brokenQty;
    form.setFieldsValue({ pendingQuantity: pendingQty >= 0 ? pendingQty : 0 });
  };

  // ترجمة حالة الصيانة
  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "تم إرسالها للصيانة";
      case "returned":
        return "تم استلامها من الصيانة";
      case "broken":
        return "معطلة";
      case "fixed":
        return "تم إصلاحها";
      default:
        return status;
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG");
  };

  // أعمدة جدول سجلات الصيانة
  const columns = [
    {
      title: "المعدة",
      dataIndex: ["equipment", "name"],
      key: "name",
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
      title: "الكمية المرسلة",
      dataIndex: "pendingQuantity",
      key: "pendingQuantity",
      render: (qty: number, record: Maintenance) => (
        <span>{qty || record.equipment.quantity}</span>
      ),
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
        <Button
          type="primary"
          onClick={() => setSelectedMaintenance(record)}
        >
          توزيع المعدة
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">توزيع المعدات بعد الصيانة</h1>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push("/dashboard/Maintenance")}
        >
          العودة للصيانة
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spin size="large" />
        </div>
      ) : maintenanceRecords.length === 0 ? (
        <Alert
          message="لا توجد معدات للتوزيع"
          description="لا توجد معدات مرسلة للصيانة حاليًا"
          type="info"
          showIcon
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="المعدات المرسلة للصيانة" className="h-full">
              <Table
                dataSource={maintenanceRecords}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card 
              title={
                selectedMaintenance
                  ? `توزيع معدة: ${selectedMaintenance.equipment.name}`
                  : "توزيع المعدات"
              }
              className="h-full"
            >
              {!selectedMaintenance ? (
                <div className="py-10 text-center text-gray-500">
                  يرجى اختيار معدة من القائمة
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                >
                  <div className="mb-4">
                    <p className="text-lg font-medium">تفاصيل المعدة</p>
                    <p>الكود: {selectedMaintenance.equipment.code}</p>
                    <p>تاريخ الإرسال: {formatDate(selectedMaintenance.date)}</p>
                    <p>
                      الكمية الكلية:{" "}
                      <span className="font-bold">
                        {selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity}
                      </span>
                    </p>
                  </div>

                  <Divider />

                  <p className="mb-4 text-lg font-medium">توزيع الكميات</p>

                  <Form.Item
                    name="workingQuantity"
                    label="عدد المعدات التي تم إصلاحها"
                    rules={[{ required: true, message: "يرجى إدخال العدد" }]}
                  >
                    <InputNumber
                      min={0}
                      max={selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity}
                      onChange={calculateRemainingQuantity}
                      className="w-full"
                    />
                  </Form.Item>

                  <Form.Item
                    name="brokenQuantity"
                    label="عدد المعدات التالفة"
                    rules={[{ required: true, message: "يرجى إدخال العدد" }]}
                  >
                    <InputNumber
                      min={0}
                      max={selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity}
                      onChange={calculateRemainingQuantity}
                      className="w-full"
                    />
                  </Form.Item>

                  <Form.Item
                    name="pendingQuantity"
                    label="عدد المعدات المتبقية في الصيانة"
                    rules={[{ required: true, message: "يرجى إدخال العدد" }]}
                  >
                    <InputNumber
                      min={0}
                      max={selectedMaintenance.pendingQuantity || selectedMaintenance.equipment.quantity}
                      className="w-full"
                      readOnly
                    />
                  </Form.Item>

                  <Form.Item
                    name="notes"
                    label="ملاحظات"
                  >
                    <TextArea rows={4} />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={distributeMutation.isPending}
                      block
                    >
                      حفظ التوزيع
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 