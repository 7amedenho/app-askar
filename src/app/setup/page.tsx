"use client";

import { useState, useEffect } from "react";
import { Card, Form, Input, Button, Typography, message, Alert } from "antd";
import { useRouter } from "next/navigation";
import Image from "next/image";

const { Title, Text } = Typography;

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [hasUsers, setHasUsers] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  // التحقق من وجود مستخدمين سابقين
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const response = await fetch("/api/auth/check-users");
        const data = await response.json();

        setHasUsers(data.hasUsers);

        // إذا كان هناك مستخدمين، توجيه المستخدم إلى صفحة تسجيل الدخول
        if (data.hasUsers) {
          message.info("النظام مهيأ بالفعل، يتم توجيهك إلى صفحة تسجيل الدخول");
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking users:", error);
        message.error("حدث خطأ أثناء التحقق من حالة النظام");
      } finally {
        setInitializing(false);
      }
    };

    checkUsers();
  }, [router]);

  // إنشاء المستخدم المدير الأول
  const handleSetup = async (values: { name: string; email: string; password: string; confirmPassword: string }) => {
    // التحقق من تطابق كلمتي المرور
    if (values.password !== values.confirmPassword) {
      message.error("كلمات المرور غير متطابقة");
      return;
    }

    try {
      setLoading(true);
      const { confirmPassword, ...setupData } = values;

      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ أثناء إعداد النظام");
      }

      message.success("تم إعداد النظام بنجاح وإنشاء حساب المدير");

      // الانتظار قليلاً قبل التوجيه
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">جاري التحقق من حالة النظام...</h2>
        </div>
      </div>
    );
  }

  if (hasUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Alert
              message="النظام مهيأ بالفعل"
              description="يوجد مستخدمين في النظام بالفعل، سيتم توجيهك إلى صفحة تسجيل الدخول."
              type="info"
              showIcon
            />
            <Button
              className="mt-4"
              type="primary"
              onClick={() => router.push("/login")}
            >
              الذهاب إلى صفحة تسجيل الدخول
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card
        className="w-full max-w-lg shadow-lg"
        bordered={false}
        style={{ direction: "rtl" }}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.webp"
              width={120}
              height={120}
              alt="شركة عسكر للمقاولات"
              className="rounded-full"
            />
          </div>
          <Title level={3} className="!mb-1">
            إعداد النظام لأول مرة
          </Title>
          <Text type="secondary">إنشاء حساب المدير الأول للنظام</Text>
        </div>

        <Alert
          message="تنبيه هام!"
          description="أنت على وشك إنشاء أول مستخدم مدير في النظام. سيتم منح هذا المستخدم كافة الصلاحيات. يرجى الاحتفاظ ببيانات الدخول في مكان آمن."
          type="warning"
          showIcon
          className="mb-6"
        />

        <Form
          name="setup"
          form={form}
          layout="vertical"
          onFinish={handleSetup}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="اسم المستخدم"
            name="name"
            rules={[
              {
                required: true,
                message: "الرجاء إدخال اسم المستخدم",
              },
            ]}
          >
            <Input placeholder="أدخل اسم المستخدم" />
          </Form.Item>

          <Form.Item
            label="البريد الإلكتروني"
            name="email"
            rules={[
              {
                required: true,
                message: "الرجاء إدخال البريد الإلكتروني",
              },
              {
                type: "email",
                message: "الرجاء إدخال بريد إلكتروني صحيح",
              },
            ]}
          >
            <Input placeholder="أدخل البريد الإلكتروني" />
          </Form.Item>

          <Form.Item
            label="كلمة المرور"
            name="password"
            rules={[
              {
                required: true,
                message: "الرجاء إدخال كلمة المرور",
              },
              {
                min: 6,
                message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
              },
            ]}
          >
            <Input.Password placeholder="أدخل كلمة المرور" />
          </Form.Item>

          <Form.Item
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: "الرجاء تأكيد كلمة المرور",
              },
            ]}
          >
            <Input.Password placeholder="أدخل كلمة المرور مرة أخرى" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              loading={loading}
              size="large"
            >
              إنشاء حساب المدير وإعداد النظام
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 