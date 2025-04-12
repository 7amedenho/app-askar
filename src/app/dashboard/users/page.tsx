"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Checkbox,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { items } from "@/components/menu-items";

const { Title } = Typography;

interface Permission {
  menuItem: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  permissions: Permission[];
}

// Get all menu items
const getAllMenuItems = () => {
  const allItems: string[] = [];
  items.forEach((group) => {
    group.items.forEach((item) => {
      allItems.push(item.title);
    });
  });
  return allItems;
};

// Group menu items by category
const getMenuItemsGrouped = () => {
  return items.map((group) => ({
    title: group.title,
    items: group.items.map((item) => item.title),
  }));
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const allMenuItems = getAllMenuItems();
  const menuItemsGrouped = getMenuItemsGrouped();

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      
      if (!response.ok) {
        throw new Error("فشل في جلب المستخدمين، الخادم أرجع خطأ: " + response.status);
      }

      const data = await response.json();
      console.log("بيانات المستخدمين:", data); // للتصحيح

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("تنسيق البيانات غير صحيح:", data);
        message.error("تنسيق البيانات المستلمة غير صحيح");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("حدث خطأ أثناء جلب المستخدمين: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle add/edit user
  const handleAddEditUser = (user: User | null = null) => {
    setCurrentUser(user);
    setModalTitle(user ? "تعديل مستخدم" : "إضافة مستخدم جديد");

    if (user) {
      // Map permissions for the form
      const userPermissions = user.permissions.map((p) => p.menuItem);
      form.setFieldsValue({
        ...user,
        permissions: userPermissions,
        password: "", // Don't show password
        confirmPassword: "",
      });
    } else {
      form.resetFields();
    }

    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Validate password match
      if (values.password !== values.confirmPassword) {
        message.error("كلمات المرور غير متطابقة");
        setLoading(false);
        return;
      }

      // Remove confirmPassword from values
      const { confirmPassword, ...userData } = values;

      let response;

      if (currentUser) {
        // Update user
        response = await fetch(`/api/users/${currentUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      } else {
        // Create user
        response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        message.success(data.message);
        fetchUsers();
        setModalVisible(false);
      } else {
        message.error(data.error);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      message.error("حدث خطأ أثناء حفظ المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        message.success(data.message);
        fetchUsers();
      } else {
        message.error(data.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("حدث خطأ أثناء حذف المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // Define table columns
  const columns = [
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "البريد الإلكتروني",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "الدور",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "blue" : "green"}>{role}</Tag>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            نشط
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            غير نشط
          </Tag>
        ),
    },
    {
      title: "آخر تسجيل دخول",
      dataIndex: "lastLogin",
      key: "lastLogin",
      render: (lastLogin: string | Date | undefined) =>
        lastLogin ? new Date(lastLogin).toLocaleString("ar-EG") : "لم يسجل دخول بعد",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleAddEditUser(record)}
            type="link"
          />
          <Popconfirm
            title="هل أنت متأكد من حذف هذا المستخدم؟"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="نعم"
            cancelText="لا"
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={<Title level={4}>إدارة المستخدمين</Title>}
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => handleAddEditUser()}
          >
            إضافة مستخدم جديد
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        style={{ direction: "rtl" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true, permissions: [] }}
        >
          <Form.Item
            name="name"
            label="الاسم"
            rules={[{ required: true, message: "الرجاء إدخال اسم المستخدم" }]}
          >
            <Input placeholder="أدخل اسم المستخدم" />
          </Form.Item>

          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[
              { required: true, message: "الرجاء إدخال البريد الإلكتروني" },
              { type: "email", message: "الرجاء إدخال بريد إلكتروني صحيح" },
            ]}
          >
            <Input placeholder="أدخل البريد الإلكتروني" />
          </Form.Item>

          <Form.Item
            name="role"
            label="الدور"
            rules={[{ required: true, message: "الرجاء إدخال دور المستخدم" }]}
          >
            <Input placeholder="أدخل دور المستخدم" />
          </Form.Item>

          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[
              {
                required: !currentUser,
                message: "الرجاء إدخال كلمة المرور",
              },
            ]}
          >
            <Input.Password placeholder="أدخل كلمة المرور" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            rules={[
              {
                required: !currentUser,
                message: "الرجاء تأكيد كلمة المرور",
              },
            ]}
          >
            <Input.Password placeholder="أدخل كلمة المرور مرة أخرى" />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>حساب نشط</Checkbox>
          </Form.Item>

          <Form.Item
            name="permissions"
            label="الصلاحيات (عناصر القائمة)"
          >
            <Checkbox.Group>
              {menuItemsGrouped.map((group, index) => (
                <div key={index} className="mb-5 pb-4 border-b border-gray-200">
                  <div className="font-semibold mb-3 text-blue-600">{group.title}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.items.map((item, idx) => (
                      <Checkbox key={idx} value={item}>
                        {item}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end">
              <Button onClick={() => setModalVisible(false)} className="ml-2">
                إلغاء
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                حفظ
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 