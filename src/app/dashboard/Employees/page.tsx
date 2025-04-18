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
import { printEmployeesReport } from "./printEmployeesReport";
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
    printEmployeesReport(filteredEmployees);
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
