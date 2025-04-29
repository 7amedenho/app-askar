"use client";
import { Table, Input, Button, Spin, Modal, Select, Tag } from "antd";
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

const { Option } = Select;

export default function EmployeesPage() {
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
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
      applyFilters(employeesData, searchText, statusFilter);
    }
  }, [employeesData]);

  // تطبيق الفلترة على البيانات
  const applyFilters = (data: any[], searchValue: string, status: string) => {
    let filtered = [...data];
    
    // تطبيق فلتر البحث
    if (searchValue) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // تطبيق فلتر الحالة
    if (status !== 'all') {
      filtered = filtered.filter(emp => 
        status === 'active' ? emp.isActive : !emp.isActive
      );
    }
    
    setFilteredEmployees(filtered);
  };

  // دالة البحث عن الموظف
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    applyFilters(employees, value, statusFilter);
  };

  // دالة تغيير فلتر الحالة
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(employees, searchText, value);
  };

  // دالة الحذف باستخدام useMutation
  const deleteEmployee = async (id: number) => {
    try {
      const response = await axios.delete(`/api/employees/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "حدث خطأ أثناء حذف الموظف");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success("تم حذف الموظف بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حذف الموظف");
    },
  });

  const showDeleteConfirm = (employee: any) => {
    setSelectedEmployee(employee);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    if (id) {
      deleteMutation.mutate(id);
      setIsModalVisible(false);
    } else {
      toast.error("لم يتم العثور على معرف الموظف");
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
      title: "الحالة", 
      dataIndex: "isActive", 
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'نشط' : 'غير نشط'}
        </Tag>
      ),
    },
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Input
            placeholder="بحث عن الموظف"
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            style={{ width: 200 }}
          />
          <Select 
            defaultValue="all" 
            onChange={handleStatusFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">الكل</Option>
            <Option value="active">نشط</Option>
            <Option value="inactive">غير نشط</Option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
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
                  <Table.Summary.Cell index={2}>
                    نشط: {filteredEmployees.filter(emp => emp.isActive).length}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    غير نشط: {filteredEmployees.filter(emp => !emp.isActive).length}
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
        open={isModalVisible}
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
