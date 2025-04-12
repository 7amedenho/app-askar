"use client";

import { Form, Input, Button, Card, Typography, message, Alert } from "antd";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [hasUsers, setHasUsers] = useState(true);
  const router = useRouter();

  // التحقق من وجود مستخدمين في النظام
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const response = await fetch("/api/auth/check-users");
        const data = await response.json();
        
        setHasUsers(data.hasUsers);
        
        // إذا لم يكن هناك مستخدمين، توجيه المستخدم إلى صفحة الإعداد
        if (!data.hasUsers) {
          message.info("النظام بحاجة للإعداد، يتم توجيهك إلى صفحة الإعداد الأولي");
          setTimeout(() => {
            router.push("/setup");
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

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ أثناء تسجيل الدخول");
      }

      // حفظ بيانات المستخدم في localStorage
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      // إطلاق حدث لتحديث المكونات الأخرى
      window.dispatchEvent(new Event("storage"));
      
      message.success("تم تسجيل الدخول بنجاح");
      router.push("/dashboard");
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">جاري التحقق من حالة النظام...</h2>
        </div>
      </div>
    );
  }

  if (!hasUsers) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Alert
              message="النظام بحاجة للإعداد"
              description="لم يتم العثور على أي مستخدمين في النظام. يجب إعداد النظام وإنشاء أول مستخدم مدير."
              type="info"
              showIcon
            />
            <Button 
              className="mt-4" 
              type="primary" 
              onClick={() => router.push("/setup")}
            >
              الذهاب إلى صفحة الإعداد
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card
        className="w-full max-w-md shadow-lg"
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
            شركة عسكر للمقاولات العمومية
          </Title>
          <Text type="secondary">تسجيل الدخول إلى نظام إدارة المشاريع</Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
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
            ]}
          >
            <Input.Password placeholder="أدخل كلمة المرور" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              loading={loading}
            >
              تسجيل الدخول
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 