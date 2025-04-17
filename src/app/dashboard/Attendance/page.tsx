"use client";
import { Table, Input, Button, Spin, Modal, Select, DatePicker } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FaTrashAlt, FaPen } from "react-icons/fa";
import { useState } from "react";
import { Printer } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import NewAttendance from "./NewAttendance";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EditAttendance from "./EditAttendance";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { printEmployeesAttendance } from "./printAttendanceReport";
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string;
  checkOut: string | null;
  notes: string | null;
  employee: {
    id: number;
    name: string;
    jobTitle: string;
    nationalId: string;
  };
}

export default function AttendancePage() {
  const [searchText, setSearchText] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>(
    []
  );
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [isDateSelected, setIsDateSelected] = useState(false);

  const queryClient = useQueryClient();

  const fetchAttendance = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      throw new Error("يرجى اختيار نطاق زمني أولاً");
    }
    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");
    const res = await axios.get(
      `/api/attendance?startDate=${startDate}&endDate=${endDate}`
    );
    return res.data;
  };

  const {
    data: attendanceData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["attendance", dateRange],
    queryFn: fetchAttendance,
    enabled: isDateSelected,
  });

  React.useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      setAttendanceRecords(attendanceData);
      setFilteredRecords(attendanceData);
    }
  }, [attendanceData]);

  const applyFilters = (
    search: string,
    status: string,
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ) => {
    let filtered = [...attendanceRecords];

    if (search) {
      Hannah: filtered = filtered.filter(
        (record) =>
          record.employee.name.toLowerCase().includes(search.toLowerCase()) ||
          record.employee.nationalId.includes(search)
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((record) => {
        const checkInTime = new Date(record.checkIn);
        const checkOutTime = record.checkOut ? new Date(record.checkOut) : null;

        switch (status) {
          case "present":
            return checkInTime && checkOutTime;
          case "late":
            return (
              checkInTime &&
              checkInTime.getHours() >= 8 &&
              checkInTime.getMinutes() > 0
            );
          case "absent":
            return !checkInTime;
          case "early_leave":
            return checkOutTime && checkOutTime.getHours() < 15;
          default:
            return true;
        }
      });
    }

    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].startOf("day");
      const endDate = dates[1].endOf("day");
      filtered = filtered.filter((record) => {
        const recordDate = dayjs(record.date);
        return recordDate.isAfter(startDate) && recordDate.isBefore(endDate);
      });
    }

    setFilteredRecords(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    applyFilters(value, filterStatus, dateRange);
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value);
    applyFilters(searchText, value, dateRange);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setIsDateSelected(true);
      refetch();
    } else {
      setIsDateSelected(false);
    }
    applyFilters(searchText, filterStatus, dates);
  };

  const deleteAttendance = async (id: number) => {
    const response = await axios.delete(`/api/attendance/${id}`);
    return response.data;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      toast.success("تم حذف سجل الحضور بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["attendance", dateRange] });
      setIsDeleteModalVisible(false);
    },
    onError: (error: any) => {
      toast.error(
        `فشل في حذف سجل الحضور: ${error.response?.data?.error || "حدث خطأ ما"}`
      );
    },
  });

  const showDeleteConfirm = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsDeleteModalVisible(true);
  };

  const handleDelete = () => {
    if (selectedRecord?.id) {
      deleteMutation.mutate(selectedRecord.id);
    }
  };

  const handlePrint = () => {
    printEmployeesAttendance(filteredRecords);
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "اسم الموظف",
      dataIndex: ["employee", "name"],
      key: "employeeName",
      sorter: (a: any, b: any) =>
        a.employee.name.localeCompare(b.employee.name),
    },
    { title: "الوظيفة", dataIndex: ["employee", "jobTitle"], key: "jobTitle" },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
      sorter: (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "وقت الحضور",
      dataIndex: "checkIn",
      key: "checkIn",
      render: (checkIn: string) =>
        new Date(checkIn).toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "وقت الانصراف",
      dataIndex: "checkOut",
      key: "checkOut",
      render: (checkOut: string | null) =>
        checkOut
          ? new Date(checkOut).toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--",
    },
    {
      title: "ع.س.إضافية",
      key: "extraHours",
      render: (record: AttendanceRecord) => {
        if (!record.checkOut) return "--";
        const checkInTime = new Date(record.checkIn).getTime();
        const checkOutTime = new Date(record.checkOut).getTime();
        const workedMilliseconds = checkOutTime - checkInTime;
        const workedHours = workedMilliseconds / (1000 * 60 * 60);
        const extraHours = Math.max(workedHours - 8, 0);
        return extraHours.toFixed(2);
      },
    },
    {
      title: "الحالة",
      key: "status",
      render: (record: AttendanceRecord) => {
        const checkInTime = new Date(record.checkIn);
        let status = "حاضر";
        let color = "green";
        if (!record.checkOut) {
          status = "لم يسجل خروج";
          color = "red";
        } else if (
          checkInTime.getHours() >= 8 &&
          checkInTime.getMinutes() < 45
        ) {
          status = "متأخر";
          color = "orange";
        } else if (record.checkOut) {
          const checkOutTime = new Date(record.checkOut);
          if (checkOutTime.getHours() < 15) {
            status = "خروج مبكر";
            color = "purple";
          }
        }
        return (
          <span
            style={{
              backgroundColor: color,
              color: "white",
              padding: "3px 8px",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (record: AttendanceRecord) => (
        <div className="flex space-x-2 justify-center">
          <Button
            type="text"
            icon={<FaPen className="text-blue-500" />}
            onClick={() => {
              setSelectedRecord(record);
              setIsEditOpen(true);
            }}
          />
          <Button
            type="text"
            icon={<FaTrashAlt className="text-red-500" />}
            onClick={() => showDeleteConfirm(record)}
          />
        </div>
      ),
    },
  ];

  if (!isDateSelected) {
    return (
      <div className="flex flex-col justify-center items-center p-6">
        <h2 className="text-xl mb-4">
          يرجى اختيار نطاق زمني لعرض سجلات الحضور
        </h2>
        <RangePicker
          className="w-[300px]"
          placeholder={["من تاريخ", "إلى تاريخ"]}
          onChange={handleDateRangeChange}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold text-center mb-6">
        إدارة الحضور والانصراف
      </h1>
      <Card className="p-4 shadow-lg rounded-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[220px] flex-1">
            <Input
              placeholder="بحث باسم الموظف أو الرقم القومي"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
          <div className="min-w-[150px]">
            <Select
              placeholder="الحالة"
              className="w-full"
              value={filterStatus}
              onChange={handleStatusChange}
            >
              <Option value="all">الكل</Option>
              <Option value="present">حاضر</Option>
              <Option value="late">متأخر</Option>
              <Option value="early_leave">خروج مبكر</Option>
            </Select>
          </div>
          <div className="min-w-[300px]">
            <RangePicker
              className="w-full"
              placeholder={["من تاريخ", "إلى تاريخ"]}
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsNewOpen(true)}
            >
              تسجيل حضور جديد
            </Button>
            <Button icon={<Printer size={16} />} onClick={handlePrint}>
              طباعة
            </Button>
          </div>
        </div>
      </Card>
      <Table
        dataSource={filteredRecords}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: "max-content" }}
        className="mt-4"
      />
      {isNewOpen && (
        <NewAttendance isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} />
      )}
      {isEditOpen && selectedRecord && (
        <EditAttendance
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          attendanceRecord={selectedRecord}
        />
      )}
      <Modal
        title="تأكيد الحذف"
        open={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="حذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
        cancelButtonProps={{ disabled: deleteMutation.isPending }}
      >
        <div className="space-y-4">
          <p className="text-base">هل أنت متأكد من حذف سجل الحضور التالي؟</p>
          {selectedRecord && (
            <div className="p-3 rounded-md grid grid-cols-2 gap-2">
              <p>
                <strong>اسم الموظف:</strong> {selectedRecord.employee.name}
              </p>
              <p>
                <strong>التاريخ:</strong>{" "}
                {new Date(selectedRecord.date).toLocaleDateString("ar-EG")}
              </p>
              <p>
                <strong>وقت الحضور:</strong>{" "}
                {new Date(selectedRecord.checkIn).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                <strong>وقت الانصراف:</strong>{" "}
                {selectedRecord.checkOut
                  ? new Date(selectedRecord.checkOut).toLocaleTimeString(
                      "ar-EG",
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  : "--"}
              </p>
            </div>
          )}
          <p className="text-red-500 text-sm">
            ملاحظة: هذا الإجراء لا يمكن التراجع عنه.
          </p>
        </div>
      </Modal>
    </div>
  );
}
