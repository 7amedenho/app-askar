"use client";
import { Table, Input, Button, Spin, Modal } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FaTrashAlt, FaPen } from "react-icons/fa";
import { useState } from "react";
import { Printer } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import NewProject from "./NewEmployee";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EditEmployee from "./EditEmployee";
import { toast } from "react-hot-toast";

export default function EmployeesPage() {
  const [, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const queryClient = useQueryClient();

  // جلب بيانات الموظفين من API
  const fetchEmployees = async () => {
    const res = await axios.get("/api/employees");
    return res.data;
  };

  const { data: employeesData = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  // تحديث قائمة الموظفين عند جلب البيانات
  React.useEffect(() => {
    if (employeesData && employeesData.length > 0) {
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
    }
  }, [employeesData]);

  // دالة البحث عن الموظف
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    setFilteredEmployees(
      employees.filter((emp) => emp.name.toLowerCase().includes(value))
    );
  };

  // دالة الحذف باستخدام useMutation
  const deleteEmployee = async (id: number) => {
    const response = await axios.delete(`/api/employees/${id}`);
    return response.data;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success("تم حذف الموظف بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["employees"] }); // تحديث البيانات تلقائيًا
    },
    onError: (error: any) => {
      toast.error(`فشل في حذف الموظف: ${error.response?.data?.error}`);
    },
  });
  const showDeleteConfirm = (employee: any) => {
    setSelectedEmployee(employee);
    setIsModalVisible(true); // فتح المودال
  };
  // دالة تنفيذ الحذف
  const handleDelete = (id: number) => {
    if (id) {
      deleteMutation.mutate(id);
      setIsModalVisible(false);
    } else {
      console.error("لم يتم العثور على id الموظف.");
    }
  };
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير العاملين - عسكر للمقاولات العمومية</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              margin: 0;
              padding: 30px;
              background-color: #f0f4f8;
              color: #2c3e50;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: #fff;
              padding: 25px;
              border-radius: 15px;
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
              border: 2px solid #3498db;
            }
            .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 3px solid #3498db;
  background: #ecf0f1;
  color: #2c3e50;
  border-radius: 10px 10px 0 0;
  padding: 15px;
}
            .header .logo img {
              max-width: 130px;
              height: auto;
            }
            .header .company-info {
              text-align: center;
              flex: 1;
            }
            .header .company-info h1 {
              font-size: 28px;
              margin: 0;
              font-weight: 700;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
            }
            .header .company-info p {
              font-size: 16px;
              margin: 5px 0 0;
              opacity: 0.9;
            }
            h2 {
              text-align: center;
              font-size: 24px;
              color: #2c3e50;
              margin: 25px 0;
              font-weight: 700;
              position: relative;
            }
            h2::after {
              content: '';
              width: 60px;
              height: 3px;
              background: #3498db;
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              border-radius: 2px;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 20px 0;
              font-size: 15px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            th, td {
              border: 1px solid #bdc3c7;
              padding: 12px;
              text-align: center;
            }
            th {
              background: #3498db;
              color: #fff;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            td {
              background: #fff;
            }
            tr:nth-child(even) td {
              background: #ecf0f1;
            }
            tr:hover td {
              background: #d5e8f7;
              transition: background 0.3s ease;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #3498db;
              font-size: 13px;
              color: #7f8c8d;
            }
            .footer strong {
              color: #3498db;
              font-weight: 700;
            }
            .timestamp {
              text-align: center;
              font-size: 13px;
              color: #7f8c8d;
              margin-top: 15px;
              font-style: italic;
            }
            @media print {
              body {
                padding: 0;
                background: #fff;
              }
              .container {
                box-shadow: none;
                border: none;
              }
              .header {
               background: #ecf0f1;
                -webkit-print-color-adjust: exact;
              }
              table th, table td {
                font-size: 12px;
                padding: 8px;
              }
              .footer {
                font-size: 11px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              
              <div class="company-info">
                <h1>عسكر للمقاولات العمومية</h1>
                <p>Askar Group for General Contracting</p>
              </div>
              <div class="logo">
                <img src="/logo.webp" alt="شعار عسكر للمقاولات العمومية" />
              </div>
            </div>
  
            <h2>تقرير العاملين</h2>
  
            <table>
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>اسم العامل</th>
                  <th>الوظيفة</th>
                  <th>الراتب اليومي</th>
                  <th>رقم الهاتف</th>
                  <th>الرقم القومي</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEmployees
                  .map(
                    (data, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${data.name}</td>
                    <td>${data.jobTitle}</td>
                    <td>${data.dailySalary} جنيه</td>
                    <td>${data.phoneNumber}</td>
                    <td>${data.nationalId}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
  
            <div class="timestamp">
              تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}
            </div>
  
            <div class="footer">
              <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      setTimeout(() => {
        printWindow.close();
      }, 10000);
    }
  };
  // إعداد الأعمدة للـ Table
  const columns = [
    { title: "الاسم", dataIndex: "name", key: "name" },
    { title: "الوظيفة", dataIndex: "jobTitle", key: "jobTitle" },
    { title: "اليومية", dataIndex: "dailySalary", key: "dailySalary" },
    { title: "رقم الهاتف", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "الرقم القومي", dataIndex: "nationalId", key: "nationalId" },
    {
      title: "العمليات",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex">
          <Button
            type="text"
            onClick={() => {
              setSelectedEmployee(record);
              setIsEditOpen(true);
            }}
          >
            <FaPen className="text-blue-500" />
          </Button>
          <Button
            type="text"
            onClick={() => showDeleteConfirm(record)}
            disabled={deleteMutation.isPending} // تعطيل الزر أثناء الحذف
          >
            <FaTrashAlt className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-center">إدارة الموظفين</h1>
      <div className="items-center flex">
        <Input
          placeholder="بحث عن الموظف"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
        />
        <div className="flex items-center justify-between gap-2 mx-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            إضافة عامل
          </Button>
          <Button type="default" icon={<Printer />} onClick={handlePrint}>
            طباعة
          </Button>
        </div>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            pagination={{ pageSize: 5 }}
            className="shadow-md rounded-lg"
            bordered
            rowKey="id"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    عدد الموظفين
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    {filteredEmployees.length}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        )}
      </Card>
      {isModalOpen && (
        <NewProject
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isEditOpen && selectedEmployee && (
        <EditEmployee
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          employee={selectedEmployee}
        />
      )}
      <Modal
        title="تأكيد الحذف"
        visible={isModalVisible}
        onOk={() => handleDelete(selectedEmployee.id)}
        onCancel={() => setIsModalVisible(false)}
        okText="حذف"
        cancelText="إلغاء"
        confirmLoading={deleteMutation.isPending}
      >
        <p>هل أنت متأكد أنك تريد حذف هذا الموظف؟</p>
      </Modal>
    </div>
  );
}
