"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Tabs,
  Typography,
  Divider,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // جلب بيانات المستخدم من localStorage
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserData(user);
      form.setFieldsValue({ name: user.name });
    }
  }, [form]);

  const handleProfileUpdate = async (values: { name: string }) => {
    if (!userData) {
      message.error("بيانات المستخدم غير متوفرة");
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        userId: userData.id,
        name: values.name,
      };

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        // تحديث بيانات المستخدم في localStorage
        const updatedUserData = { ...userData, name: values.name };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        message.success(data.message || "تم تحديث الملف الشخصي بنجاح");

        // Trigger storage event for other components to update
        window.dispatchEvent(new Event("storage"));
      } else {
        message.error(data.error || "فشل تحديث الملف الشخصي");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("حدث خطأ أثناء تحديث الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (!userData) {
      message.error("بيانات المستخدم غير متوفرة");
      return;
    }

    // تحقق من تطابق كلمة المرور الجديدة
    if (values.newPassword !== values.confirmPassword) {
      message.error("كلمة المرور الجديدة وتأكيدها غير متطابقين");
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        userId: userData.id,
        currentPassword: values.currentPassword,
        password: values.newPassword,
      };

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(data.message || "تم تحديث كلمة المرور بنجاح");
        form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
      } else {
        message.error(data.error || "فشل تحديث كلمة المرور");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      message.error("حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ direction: "rtl" }}>
      <Card>
        <Title level={3}>إعدادات الحساب</Title>
        <Text type="secondary" className="mb-6 block">
          قم بتحديث معلومات حسابك وإعدادات الأمان
        </Text>

        <Divider />

        <Tabs defaultActiveKey="profile">
          <TabPane
            tab={
              <span>
                <UserOutlined /> الملف الشخصي
              </span>
            }
            key="profile"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              className="max-w-2xl"
            >
              <Form.Item
                name="name"
                label="الاسم"
                rules={[{ required: true, message: "الرجاء إدخال الاسم" }]}
              >
                <Input placeholder="أدخل اسمك" size="large" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  حفظ التغييرات
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <LockOutlined /> كلمة المرور
              </span>
            }
            key="password"
          >
            <Form
              layout="vertical"
              onFinish={handlePasswordUpdate}
              className="max-w-2xl"
            >
              <Form.Item
                name="currentPassword"
                label="كلمة المرور الحالية"
                rules={[
                  {
                    required: true,
                    message: "الرجاء إدخال كلمة المرور الحالية",
                  },
                ]}
              >
                <Input.Password placeholder="أدخل كلمة المرور الحالية" size="large" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="كلمة المرور الجديدة"
                rules={[
                  {
                    required: true,
                    message: "الرجاء إدخال كلمة المرور الجديدة",
                  },
                ]}
              >
                <Input.Password placeholder="أدخل كلمة المرور الجديدة" size="large" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="تأكيد كلمة المرور الجديدة"
                rules={[
                  {
                    required: true,
                    message: "الرجاء تأكيد كلمة المرور الجديدة",
                  },
                ]}
              >
                <Input.Password placeholder="أدخل كلمة المرور الجديدة مرة أخرى" size="large" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  تحديث كلمة المرور
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
} 