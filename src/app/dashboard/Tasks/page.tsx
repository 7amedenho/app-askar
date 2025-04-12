"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button, Table, Input, Modal, Tabs, Tag, Space, Popconfirm } from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SyncOutlined,
  SearchOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import NewTaskItem from "./NewTaskItem";
import EditTaskItem from "./EditTaskItem";
import NewTaskDelivery from "./NewTaskDelivery";
import TaskItemDetail from "./TaskItemDetail";
import DeliveryReport from "./DeliveryReport";

const { TabPane } = Tabs;

export default function TasksPage() {
  const [searchText, setSearchText] = useState("");
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedTaskItem, setSelectedTaskItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("1");
  
  const queryClient = useQueryClient();
  
  // Fetch task items
  const { data: taskItems = [], isLoading: isTaskItemsLoading, refetch: refetchTaskItems } = useQuery({
    queryKey: ["taskItems"],
    queryFn: async () => {
      const response = await axios.get("/api/tasks");
      return response.data;
    }
  });
  
  // Fetch task deliveries
  const { data: deliveries = [], isLoading: isDeliveriesLoading, refetch: refetchDeliveries } = useQuery({
    queryKey: ["taskDeliveries"],
    queryFn: async () => {
      const response = await axios.get("/api/tasks/deliveries");
      return response.data;
    }
  });
  
  // Delete task item mutation
  const deleteTaskItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskItems"] });
      toast.success("تم حذف القطعة بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء حذف القطعة");
    }
  });
  
  // Delete delivery mutation
  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/tasks/deliveries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskDeliveries", "taskItems"] });
      toast.success("تم حذف التسليم بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء حذف التسليم");
    }
  });
  
  // Filter items based on search text
  const filteredItems = taskItems.filter((item: any) => 
    item.name.includes(searchText)
  );
  
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    const employeeName = delivery.employee?.name || "";
    const itemName = delivery.taskItem?.name || "";
    
    return employeeName.includes(searchText) || itemName.includes(searchText);
  });
  
  // Columns for task items table
  const itemColumns = [
    {
      title: "اسم القطعة",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الكمية المتوفرة",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number) => (
        <Tag color={quantity > 0 ? "green" : "red"}>
          {quantity}
        </Tag>
      )
    },
    {
      title: "تاريخ الإضافة",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG")
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedTaskItem(record);
              setIsNewDeliveryOpen(true);
            }}
          >
            تسليم
          </Button>
          <Button 
            type="default" 
            size="small" 
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedTaskItem(record);
              setIsDetailOpen(true);
            }}
          >
            التفاصيل
          </Button>
          <Button 
            type="default" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedTaskItem(record);
              setIsEditOpen(true);
            }}
          >
            تعديل
          </Button>
          <Popconfirm
            title="هل أنت متأكد من حذف هذه القطعة؟"
            onConfirm={() => deleteTaskItemMutation.mutate(record.id)}
            okText="نعم"
            cancelText="لا"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              loading={deleteTaskItemMutation.isPending}
            >
              حذف
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  // Columns for task deliveries table
  const deliveryColumns = [
    {
      title: "اسم الموظف",
      dataIndex: ["employee", "name"],
      key: "employeeName",
    },
    {
      title: "اسم القطعة",
      dataIndex: ["taskItem", "name"],
      key: "itemName",
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "تاريخ التسليم",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG")
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string) => notes || "-"
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm
            title="هل أنت متأكد من حذف هذا التسليم؟"
            onConfirm={() => deleteDeliveryMutation.mutate(record.id)}
            okText="نعم"
            cancelText="لا"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              loading={deleteDeliveryMutation.isPending}
            >
              حذف
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المهمات</h1>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => setIsReportOpen(true)}
          >
            تقرير التسليمات
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsNewItemOpen(true)}
          >
            إضافة قطعة جديدة
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              refetchTaskItems();
              refetchDeliveries();
            }}
            loading={isTaskItemsLoading || isDeliveriesLoading}
          >
            تحديث
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <Input
          placeholder="بحث..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>
      
      <Tabs defaultActiveKey="1" onChange={setActiveTab}>
        <TabPane tab="المخزون" key="1">
          <Table
            dataSource={filteredItems}
            columns={itemColumns}
            rowKey="id"
            loading={isTaskItemsLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
          />
        </TabPane>
        <TabPane tab="سجل التسليمات" key="2">
          <Table
            dataSource={filteredDeliveries}
            columns={deliveryColumns}
            rowKey="id"
            loading={isDeliveriesLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
          />
        </TabPane>
      </Tabs>
      
      {isNewItemOpen && (
        <NewTaskItem
          isOpen={isNewItemOpen}
          onClose={() => setIsNewItemOpen(false)}
        />
      )}
      
      {isEditOpen && selectedTaskItem && (
        <EditTaskItem
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          taskItem={selectedTaskItem}
        />
      )}
      
      {isNewDeliveryOpen && selectedTaskItem && (
        <NewTaskDelivery
          isOpen={isNewDeliveryOpen}
          onClose={() => setIsNewDeliveryOpen(false)}
          taskItem={selectedTaskItem}
        />
      )}
      
      {isDetailOpen && selectedTaskItem && (
        <TaskItemDetail
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          taskItem={selectedTaskItem}
        />
      )}
      
      {isReportOpen && (
        <DeliveryReport
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
} 