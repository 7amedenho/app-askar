"use client";
import { useState } from "react";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Spin,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Edit, Trash } from "lucide-react";
import dayjs from "dayjs";
import locale from "antd/lib/date-picker/locale/ar_EG";

const { TabPane } = Tabs;
const { Option } = Select;

export default function TransactionHistory() {
  const [activeTab, setActiveTab] = useState("payrolls");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // جلب بيانات المرتبات
  const { data: payrolls = [], isLoading: payrollsLoading } = useQuery({
    queryKey: ["payrolls"],
    queryFn: async () => {
      const res = await axios.get("/api/payroll");
      return res.data;
    },
  });

  // جلب بيانات السلف
  const { data: advances = [], isLoading: advancesLoading } = useQuery({
    queryKey: ["advances"],
    queryFn: async () => {
      const res = await axios.get("/api/advances");
      return res.data;
    },
  });

  // جلب بيانات الخصومات
  const { data: deductions = [], isLoading: deductionsLoading } = useQuery({
    queryKey: ["deductions"],
    queryFn: async () => {
      const res = await axios.get("/api/deductions");
      return res.data;
    },
  });

  // جلب بيانات المكافآت
  const { data: bonuses = [], isLoading: bonusesLoading } = useQuery({
    queryKey: ["bonuses"],
    queryFn: async () => {
      const res = await axios.get("/api/bonuses");
      return res.data;
    },
  });

  // جلب بيانات الموظفين
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axios.get("/api/employees");
      return res.data;
    },
  });

  // تعديل السجلات
  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: any) => {
      return await axios.put(`/api/${endpoint}/${id}`, data);
    },
    onSuccess: () => {
      toast.success("تم تحديث السجل بنجاح");
      setEditModalVisible(false);
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تحديث السجل");
    },
  });

  // حذف السجلات
  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: any) => {
      return await axios.delete(`/api/${endpoint}/${id}`);
    },
    onSuccess: () => {
      toast.success("تم حذف السجل بنجاح");
      setDeleteModalVisible(false);
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء حذف السجل");
    },
  });

  const handleEdit = (record: any) => {
    setSelectedRecord(record);

    switch (activeTab) {
      case "payrolls":
        form.setFieldsValue({
          month: dayjs(record.month),
          dailySalary: record.dailySalary,
          daysWorked: record.daysWorked,
          bonuses: record.bonuses,
          deductions: record.deductions,
          advances: record.advances,
          custody: record.custody, // إضافة العهدة
        });
        break;
      case "advances":
        form.setFieldsValue({
          amount: record.amount,
          requestDate: dayjs(record.requestDate),
          status: record.status,
        });
        break;
      case "deductions":
        form.setFieldsValue({
          amount: record.amount,
          date: dayjs(record.date),
        });
        break;
      case "bonuses":
        form.setFieldsValue({
          amount: record.amount,
          reason: record.reason,
          date: dayjs(record.date),
        });
        break;
    }

    setEditModalVisible(true);
  };

  const handleDelete = (record: any) => {
    setSelectedRecord(record);
    setDeleteModalVisible(true);
  };

  const handleUpdateRecord = () => {
    form.validateFields().then((values) => {
      let endpoint = "";
      let data = {};

      switch (activeTab) {
        case "payrolls":
          endpoint = "payroll";
          data = {
            month: values.month.format("YYYY-MM"),
            dailySalary: values.dailySalary,
            daysWorked: values.daysWorked,
            bonuses: values.bonuses,
            deductions: values.deductions,
            advances: values.advances,
            custody: values.custody, // إضافة العهدة
            totalSalary: values.dailySalary * values.daysWorked,
            netSalary:
              values.dailySalary * values.daysWorked +
              Number(values.bonuses) -
              Number(values.deductions) -
              Number(values.advances),
          };
          break;
        case "advances":
          endpoint = "advances";
          data = {
            amount: values.amount,
            requestDate: values.requestDate.toISOString(),
            status: values.status,
          };
          break;
        case "deductions":
          endpoint = "deductions";
          data = {
            amount: values.amount,
            date: values.date.toISOString(),
          };
          break;
        case "bonuses":
          endpoint = "bonuses";
          data = {
            amount: values.amount,
            reason: values.reason,
            date: values.date.toISOString(),
          };
          break;
      }

      updateMutation.mutate({ endpoint, id: selectedRecord.id, data });
    });
  };

  const handleDeleteRecord = async () => {
    let endpoint = "";
    let amountToRestore = 0; // القيمة التي سيتم إرجاعها إلى العهدة
    let employeeId = selectedRecord?.employeeId; // معرف الموظف

    switch (activeTab) {
      case "payrolls":
        endpoint = "payroll";
        break;
      case "advances":
        endpoint = "advances";
        amountToRestore = selectedRecord.amount; // استرجاع مبلغ السلفة
        break;
      case "deductions":
        endpoint = "deductions";
        amountToRestore = selectedRecord.amount; // استرجاع مبلغ الخصم
        break;
      case "bonuses":
        endpoint = "bonuses";
        amountToRestore = -selectedRecord.amount; // طرح المكافأة لأنها إضافة
        break;
    }

    try {
      // إذا كان السجل ليس مرتباً (payrolls)، قم بتحديث العهدة في جدول payrolls
      if (activeTab !== "payrolls" && amountToRestore !== 0 && employeeId) {
        // البحث عن أحدث سجل مرتب للموظف
        const latestPayroll = payrolls.find(
          (p: any) => p.employeeId === employeeId
        );

        if (latestPayroll) {
          // تحديث العهدة بإضافة القيمة المستعادة
          const updatedCustody = (latestPayroll.custody || 0) + amountToRestore;

          // إرسال طلب تحديث إلى الـ API
          await axios.put(`/api/payroll/${latestPayroll.id}`, {
            ...latestPayroll,
            custody: updatedCustody,
            advances:
              activeTab === "advances"
                ? latestPayroll.advances - selectedRecord.amount
                : latestPayroll.advances,
            deductions:
              activeTab === "deductions"
                ? latestPayroll.deductions - selectedRecord.amount
                : latestPayroll.deductions,
            bonuses:
              activeTab === "bonuses"
                ? latestPayroll.bonuses - selectedRecord.amount
                : latestPayroll.bonuses,
          });

          // تحديث الكاش
          queryClient.invalidateQueries({ queryKey: ["payrolls"] });
        }
      }

      // تنفيذ عملية الحذف بعد التحديث
      deleteMutation.mutate({ endpoint, id: selectedRecord.id });
    } catch (error: any) {
      toast.error("حدث خطأ أثناء معالجة الحذف وإعادة القيمة إلى العهدة");
    }
  };

  // أعمدة جدول المرتبات
  const payrollColumns = [
    {
      title: "الموظف",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (employeeId: number) => {
        const employee = employees.find(
          (emp: { id: number }) => emp.id === employeeId
        );
        return employee ? employee.name : "غير معروف";
      },
    },
    {
      title: "الشهر",
      dataIndex: "month",
      key: "month",
    },
    {
      title: "الراتب اليومي",
      dataIndex: "dailySalary",
      key: "dailySalary",
      render: (text: number) => `${text} ج.م`,
    },
    {
      title: "أيام العمل",
      dataIndex: "daysWorked",
      key: "daysWorked",
    },
    {
      title: "إجمالي الراتب",
      dataIndex: "totalSalary",
      key: "totalSalary",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "المكافآت",
      dataIndex: "bonuses",
      key: "bonuses",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "الخصومات",
      dataIndex: "deductions",
      key: "deductions",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "السلف",
      dataIndex: "advances",
      key: "advances",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "العهدة",
      dataIndex: "custody",
      key: "custody",
      render: (text: number) => `${Number(text || 0).toLocaleString()} ج.م`,
    },
    {
      title: "صافي الراتب",
      dataIndex: "netSalary",
      key: "netSalary",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<Trash size={16} />}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  // أعمدة جدول السلف
  const advanceColumns = [
    {
      title: "الموظف",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (employeeId: number) => {
        const employee = employees.find(
          (emp: { id: number }) => emp.id === employeeId
        );
        return employee ? employee.name : "غير معروف";
      },
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "تاريخ الطلب",
      dataIndex: "requestDate",
      key: "requestDate",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (text: string) => {
        switch (text) {
          case "pending":
            return <span className="text-yellow-500">قيد الانتظار</span>;
          case "approved":
            return <span className="text-green-500">تمت الموافقة</span>;
          case "repaid":
            return <span className="text-blue-500">تم السداد</span>;
          default:
            return text;
        }
      },
    },
    {
      title: "تاريخ السداد",
      dataIndex: "repaymentDate",
      key: "repaymentDate",
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString("ar-EG") : "-",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<Trash size={16} />}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  // أعمدة جدول الخصومات
  const deductionColumns = [
    {
      title: "الموظف",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (employeeId: number) => {
        const employee = employees.find(
          (emp: { id: number }) => emp.id === employeeId
        );
        return employee ? employee.name : "غير معروف";
      },
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<Trash size={16} />}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  // أعمدة جدول المكافآت
  const bonusColumns = [
    {
      title: "الموظف",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (employeeId: number) => {
        const employee = employees.find(
          (emp: { id: number }) => emp.id === employeeId
        );
        return employee ? employee.name : "غير معروف";
      },
    },
    {
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => `${Number(text).toLocaleString()} ج.م`,
    },
    {
      title: "السبب",
      dataIndex: "reason",
      key: "reason",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text: string) => new Date(text).toLocaleDateString("ar-EG"),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<Trash size={16} />}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  // محتوى نموذج التعديل بناءً على نوع السجل
  const renderEditForm = () => {
    if (!selectedRecord) return null;

    switch (activeTab) {
      case "payrolls":
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="month"
              label="الشهر"
              rules={[{ required: true, message: "يرجى اختيار الشهر" }]}
            >
              <DatePicker
                picker="month"
                style={{ width: "100%" }}
                locale={locale}
              />
            </Form.Item>
            <Form.Item
              name="dailySalary"
              label="الراتب اليومي"
              rules={[{ required: true, message: "يرجى إدخال الراتب اليومي" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item
              name="daysWorked"
              label="أيام العمل"
              rules={[{ required: true, message: "يرجى إدخال عدد أيام العمل" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="bonuses" label="المكافآت" initialValue={0}>
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item name="deductions" label="الخصومات" initialValue={0}>
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item name="advances" label="السلف" initialValue={0}>
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item name="custody" label="العهدة" initialValue={0}>
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
          </Form>
        );
      case "advances":
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="مبلغ السلفة"
              rules={[{ required: true, message: "يرجى إدخال مبلغ السلفة" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item
              name="requestDate"
              label="تاريخ الطلب"
              rules={[{ required: true, message: "يرجى اختيار تاريخ الطلب" }]}
            >
              <DatePicker style={{ width: "100%" }} locale={locale} />
            </Form.Item>
            <Form.Item
              name="status"
              label="حالة السلفة"
              rules={[{ required: true, message: "يرجى اختيار حالة السلفة" }]}
            >
              <Select placeholder="اختر حالة السلفة">
                <Option value="pending">قيد الانتظار</Option>
                <Option value="approved">تمت الموافقة</Option>
                <Option value="repaid">تم السداد</Option>
              </Select>
            </Form.Item>
          </Form>
        );
      case "deductions":
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="مبلغ الخصم"
              rules={[{ required: true, message: "يرجى إدخال مبلغ الخصم" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item
              name="date"
              label="تاريخ الخصم"
              rules={[{ required: true, message: "يرجى اختيار تاريخ الخصم" }]}
            >
              <DatePicker style={{ width: "100%" }} locale={locale} />
            </Form.Item>
          </Form>
        );
      case "bonuses":
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="مبلغ المكافأة"
              rules={[{ required: true, message: "يرجى إدخال مبلغ المكافأة" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                formatter={(value) => `${value} ج.م`}
                parser={(value: string | undefined) => Number(value?.replace(" ج.م", "") || 0)}
              />
            </Form.Item>
            <Form.Item
              name="reason"
              label="سبب المكافأة"
              rules={[{ required: true, message: "يرجى إدخال سبب المكافأة" }]}
            >
              <Input placeholder="أدخل سبب المكافأة" />
            </Form.Item>
            <Form.Item
              name="date"
              label="تاريخ المكافأة"
              rules={[
                { required: true, message: "يرجى اختيار تاريخ المكافأة" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} locale={locale} />
            </Form.Item>
          </Form>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="المرتبات" key="payrolls">
          {payrollsLoading ? (
            <div className="flex justify-center p-4">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={payrolls}
              columns={payrollColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          )}
        </TabPane>
        <TabPane tab="السلف" key="advances">
          {advancesLoading ? (
            <div className="flex justify-center p-4">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={advances}
              columns={advanceColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          )}
        </TabPane>
        <TabPane tab="الخصومات" key="deductions">
          {deductionsLoading ? (
            <div className="flex justify-center p-4">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={deductions}
              columns={deductionColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          )}
        </TabPane>
        <TabPane tab="المكافآت" key="bonuses">
          {bonusesLoading ? (
            <div className="flex justify-center p-4">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={bonuses}
              columns={bonusColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          )}
        </TabPane>
      </Tabs>

      {/* مودال التعديل */}
      <Modal
        title="تعديل السجل"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            إلغاء
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={updateMutation.isPending}
            onClick={handleUpdateRecord}
          >
            حفظ التغييرات
          </Button>,
        ]}
      >
        {renderEditForm()}
      </Modal>

      {/* مودال الحذف */}
      <Modal
        title="تأكيد الحذف"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            إلغاء
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={deleteMutation.isPending}
            onClick={handleDeleteRecord}
          >
            حذف
          </Button>,
        ]}
      >
        <p>
          هل أنت متأكد من رغبتك في حذف هذا السجل؟ سيتم إرجاع القيمة إلى العهدة.
        </p>
      </Modal>
    </div>
  );
}