"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Table, Empty, Statistic, Card, Row, Col } from "antd";
import { InfoCircleOutlined, CalendarOutlined } from "@ant-design/icons";

interface TaskItemDetailProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: {
    id: number;
    name: string;
    quantity: number;
    createdAt: string;
  };
}

export default function TaskItemDetail({ isOpen, onClose, taskItem }: TaskItemDetailProps) {
  // Fetch task item details with its delivery history
  const { data: itemDetails, isLoading } = useQuery({
    queryKey: ["taskItem", taskItem.id],
    queryFn: async () => {
      const response = await axios.get(`/api/tasks/${taskItem.id}`);
      return response.data;
    },
    enabled: isOpen // Only fetch when the dialog is open
  });
  
  // Columns for delivery history table
  const deliveryColumns = [
    {
      title: "اسم الموظف",
      dataIndex: ["employee", "name"],
      key: "employeeName",
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
    }
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[85vw] p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            تفاصيل القطعة: {taskItem.name}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : itemDetails ? (
          <div className="mt-4">
            <Row gutter={16} className="mb-6">
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="الكمية المتوفرة"
                    value={itemDetails.quantity}
                    valueStyle={{ color: itemDetails.quantity > 0 ? "#3f8600" : "#cf1322" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="إجمالي التسليمات"
                    value={itemDetails.deliveries?.length || 0}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="تاريخ الإضافة"
                    value={new Date(itemDetails.createdAt).toLocaleDateString("ar-EG")}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3">سجل التسليمات</h3>
              
              <div className="overflow-x-auto">
                {itemDetails.deliveries && itemDetails.deliveries.length > 0 ? (
                  <Table
                    dataSource={itemDetails.deliveries}
                    columns={deliveryColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 350 }}
                    size="small"
                  />
                ) : (
                  <Empty description="لا يوجد سجل تسليمات لهذه القطعة" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-6">
            <InfoCircleOutlined className="text-red-500 mr-2" />
            <span>لا يمكن تحميل البيانات</span>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 