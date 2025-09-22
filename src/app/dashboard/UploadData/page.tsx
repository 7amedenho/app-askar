"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Upload,
  Button,
  message,
  Table,
  Divider,
  Spin,
  Space,
  Alert,
  Tag,
  Tooltip,
  Tabs,
} from "antd";
import {
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import type { UploadFile, TabsProps } from "antd";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface UploadResult {
  processed: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}

export default function UploadDataPage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch employees to validate fingerprints
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("/api/employees");
        setEmployees(res.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);
  const handleUpload = async () => {
    const formData = new FormData();
    if (fileList.length === 0) {
      message.error("يرجى اختيار ملف للتحميل");
      return;
    }

    const file = fileList[0] as RcFile;
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post("/api/upload-attendance", formData);
      setResult(res.data);
      if (res.data.processed > 0) {
        message.success(`تم معالجة ${res.data.processed} سجل بنجاح`);
      }
      if (res.data.failed > 0) {
        message.warning(`فشل في معالجة ${res.data.failed} سجل`);
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      message.error(error.response?.data?.error || "حدث خطأ أثناء التحميل");
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  const props = {
    onRemove: () => {
      setFileList([]);
      setResult(null);
    },
    beforeUpload: (file: RcFile) => {
      // Validate file type
      const isExcel =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv");

      if (!isExcel) {
        message.error("يمكنك فقط تحميل ملفات Excel/CSV!");
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return false;
    },
    fileList,
  };

  const errorColumns = [
    {
      title: "#",
      key: "index",
      render: (_: any, __: any, index: number) => index + 1,
      width: 80,
    },
    {
      title: "معرف المستخدم",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "الخطأ",
      dataIndex: "error",
      key: "error",
    },
  ];

  // Instructions for each template type
  const attendanceInstructions = (
    <>
      <Title level={4}>تنسيق ملف الحضور والانصراف</Title>
      <Paragraph>يجب أن يحتوي ملف Excel على الأعمدة التالية:</Paragraph>
      <ul>
        <li>
          <Text strong>userId/fingerprint</Text>: معرف المستخدم في نظام البصمة
          (يجب أن يتطابق مع حقل fingerprint في بيانات الموظف)
        </li>
        <li>
          <Text strong>date</Text>: تاريخ الحضور (بتنسيق YYYY-MM-DD)
        </li>
        <li>
          <Text strong>checkIn</Text>: وقت الحضور (بتنسيق HH:MM)
        </li>
        <li>
          <Text strong>checkOut</Text>: وقت الانصراف (بتنسيق HH:MM، اختياري)
        </li>
      </ul>
      <Alert
        type="info"
        message="ملاحظة"
        description="تأكد من تطابق معرف المستخدم (userId/fingerprint) مع حقل fingerprint في بيانات الموظف. إذا لم يتم العثور على الموظف المطابق، سيتم تسجيل الخطأ."
        showIcon
      />
    </>
  );

  // Generate example content for download
  const exampleContent = [
    employees.map((emp: any) => ({
      fingerprint: emp.fingerprint,
      name: emp.name,
      date: "",
      checkIn: "",
      checkOut: "",
    })),
  ];

  // Function to download example template
  // const downloadExample = () => {
  //   // Create CSV content
  //   const headers = ["fingerprint", name, "date", "checkIn", "checkOut"];
  //   const csvContent = [
  //     headers.join(","),
  //     ...exampleContent.map((row) =>
  //       headers.map((header) => row[header as keyof typeof row]).join(",")
  //     ),
  //   ].join("\n");

  //   // Create blob and download link
  //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.setAttribute("download", "نموذج_حضور_وانصراف.csv");
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };
  const downloadTemplate = async () => {
    try {
      const res = await axios.get("/api/attendance-template", {
        responseType: "blob", // مهم علشان ينزل كملف
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "نموذج_الحضور.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      message.error("حصل خطأ أثناء تنزيل النموذج");
    }
  };

  // Tabs configuration
  const tabItems: TabsProps["items"] = [
    {
      key: "upload",
      label: "تحميل البيانات",
      children: (
        <Card>
          <Title level={3}>تحميل بيانات الحضور والانصراف</Title>
          <Paragraph>
            استخدم هذه الصفحة لتحميل بيانات الحضور والانصراف من نظام البصمة
            بتنسيق Excel أو CSV.
          </Paragraph>

          <Divider />

          <Dragger {...props} disabled={uploading}>
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined
                style={{ fontSize: "48px", color: "#52c41a" }}
              />
            </p>
            <p className="ant-upload-text">
              انقر أو اسحب ملف Excel/CSV لتحميله
            </p>
            <p className="ant-upload-hint">
              يدعم فقط ملفات Excel (.xlsx، .xls) وملفات CSV
            </p>
          </Dragger>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <Space>
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploading}
                disabled={fileList.length === 0}
                icon={<UploadOutlined />}
              >
                {uploading ? "جاري التحميل..." : "تحميل"}
              </Button>
              <Button onClick={downloadTemplate} icon={<FileExcelOutlined />}>
                تنزيل نموذج
              </Button>
            </Space>
          </div>

          {uploading && (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <Spin tip="جاري معالجة البيانات..." />
            </div>
          )}

          {result && (
            <div style={{ marginTop: "24px" }}>
              <Divider>نتائج المعالجة</Divider>
              <div style={{ marginBottom: "16px" }}>
                <Space size="large">
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    تمت المعالجة: {result.processed}
                  </Tag>
                  {result.failed > 0 && (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                      فشل: {result.failed}
                    </Tag>
                  )}
                </Space>
              </div>

              {result.errors.length > 0 && (
                <>
                  <Title level={5}>سجلات الأخطاء</Title>
                  <Table
                    columns={errorColumns}
                    dataSource={result.errors}
                    rowKey={(record) => `${record.userId}-${record.error}`}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </>
              )}
            </div>
          )}
        </Card>
      ),
    },
    {
      key: "instructions",
      label: "تعليمات",
      children: (
        <Card>
          <Title level={3}>تعليمات تحميل البيانات</Title>

          <Alert
            message="يرجى التأكد من ربط معرف المستخدم في نظام البصمة مع الموظف في النظام"
            description="قبل استخدام ميزة تحميل البيانات، تأكد من تحديث حقل fingerprint لكل موظف ليطابق معرف المستخدم الخاص به في نظام البصمة ZKTeco."
            type="warning"
            showIcon
            style={{ marginBottom: "20px" }}
          />

          {attendanceInstructions}

          <Divider />

          <Title level={4}>تعليمات الاستخدام</Title>
          <ol>
            <li>اختر ملف Excel أو CSV بتنسيق البيانات المطلوب</li>
            <li>انقر على زر "تحميل" لبدء عملية المعالجة</li>
            <li>انتظر حتى اكتمال العملية وعرض نتائج المعالجة</li>
            <li>يمكنك مراجعة أي أخطاء ظهرت أثناء المعالجة</li>
          </ol>

          <Alert
            message="تلميح"
            description="يمكنك تنزيل نموذج من صفحة التحميل لمعرفة التنسيق المطلوب بالضبط."
            type="info"
            showIcon
          />
        </Card>
      ),
    },
    {
      key: "help",
      label: "المساعدة",
      children: (
        <Card>
          <Title level={3}>الأسئلة الشائعة</Title>

          <Title level={4}>ما المقصود بمعرف المستخدم (fingerprint)؟</Title>
          <Paragraph>
            معرف المستخدم هو الرقم التعريفي للموظف في نظام البصمة ZKTeco. يجب
            تعيين هذا المعرف في حقل fingerprint لكل موظف في صفحة إدارة الموظفين.
          </Paragraph>

          <Title level={4}>ماذا لو لم يكن لدي وقت انصراف لبعض الموظفين؟</Title>
          <Paragraph>
            يمكنك ترك عمود checkOut فارغًا للموظفين الذين ليس لديهم وقت انصراف
            مسجل. ستتم معالجة هذه السجلات كحضور فقط بدون وقت انصراف.
          </Paragraph>

          <Title level={4}>هل سيتم تحديث السجلات الموجودة؟</Title>
          <Paragraph>
            نعم، إذا كان هناك سجل حضور موجود بالفعل لنفس الموظف في نفس اليوم،
            سيتم تحديثه بالبيانات الجديدة من الملف المحمل.
          </Paragraph>

          <Title level={4}>ما هي تنسيقات التاريخ والوقت المدعومة؟</Title>
          <Paragraph>
            يجب أن تكون التواريخ بتنسيق YYYY-MM-DD (مثال: 2023-10-15) وأوقات
            الحضور والانصراف بتنسيق HH:MM (مثال: 08:30).
          </Paragraph>

          <Divider />

          <Paragraph>
            إذا كنت بحاجة إلى مساعدة إضافية، يرجى التواصل مع مسؤول النظام.
          </Paragraph>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Tabs
        defaultActiveKey="upload"
        items={tabItems}
        onChange={(key) => setActiveTab(key)}
        size="large"
      />
    </div>
  );
}
