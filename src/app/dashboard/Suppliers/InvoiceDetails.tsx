"use client";
import { useState } from "react";
import { Button, Spin, Table, Tag, Descriptions, Modal } from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface InvoiceDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
}

export default function InvoiceDetails({
    isOpen,
    onClose,
    invoice,
}: InvoiceDetailsProps) {
    // Fetch invoice with items
    const fetchInvoiceDetails = async () => {
        const response = await axios.get(`/api/invoices/${invoice.id}`);
        return response.data;
    };

    const { data: invoiceDetails, isLoading } = useQuery({
        queryKey: ["invoice", invoice.id],
        queryFn: fetchInvoiceDetails,
        enabled: isOpen,
    });

    const itemColumns = [
        { title: "اسم الصنف", dataIndex: "itemName", key: "itemName" },
        { title: "الكمية", dataIndex: "quantity", key: "quantity" },
        {
            title: "الوحدة",
            key: "unit",
            render: (_: any, record: any) => record.consumable?.unit || "-"
        },
        { title: "الماركة", dataIndex: "brand", key: "brand", render: (text: string) => text || "-" },
        {
            title: "سعر الوحدة",
            dataIndex: "unitPrice",
            key: "unitPrice",
            render: (value: number) => `${Number(value).toLocaleString()} ج.م`
        },
        {
            title: "الإجمالي",
            key: "total",
            render: (_: any, record: any) => `${(Number(record.quantity) * Number(record.unitPrice)).toLocaleString()} ج.م`
        }
    ];

    // Get payment status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "green";
            case "partially_paid":
                return "orange";
            case "pending":
                return "red";
            default:
                return "default";
        }
    };

    // Translates status to Arabic
    const translateStatus = (status: string) => {
        switch (status) {
            case "paid":
                return "مدفوعة";
            case "partially_paid":
                return "مدفوعة جزئياً";
            case "pending":
                return "غير مدفوعة";
            default:
                return status;
        }
    };

    return (
        <Modal 
            open={isOpen} 
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>إغلاق</Button>
            ]}
            title={<div className="text-xl font-bold text-center">تفاصيل الفاتورة #{invoice.id}</div>}
            width={1000}
        >
            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Spin size="large" />
                </div>
            ) : invoiceDetails ? (
                <div className="py-4 space-y-4">
                    <Descriptions
                        bordered
                        column={{ xs: 1, sm: 2, md: 3 }}
                        className="p-4 rounded-md"
                    >
                        <Descriptions.Item label="المورد" span={3}>
                            {invoiceDetails.supplier.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="رقم الفاتورة">
                            #{invoiceDetails.id}
                        </Descriptions.Item>
                        <Descriptions.Item label="تاريخ الفاتورة">
                            {new Date(invoiceDetails.invoiceDate).toLocaleDateString("ar-EG")}
                        </Descriptions.Item>
                        <Descriptions.Item label="نوع الفاتورة">
                            <Tag color={invoiceDetails.invoiceType === "معدات" ? "blue" : "green"}>
                                {invoiceDetails.invoiceType}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="الحالة">
                            <Tag color={getStatusColor(invoiceDetails.status)}>
                                {translateStatus(invoiceDetails.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="الإجمالي">
                            {Number(invoiceDetails.totalAmount).toLocaleString()} ج.م
                        </Descriptions.Item>
                        <Descriptions.Item label="المدفوع">
                            {Number(invoiceDetails.paidAmount).toLocaleString()} ج.م
                        </Descriptions.Item>
                        <Descriptions.Item label="المتبقي" span={3}>
                            {(Number(invoiceDetails.totalAmount) - Number(invoiceDetails.paidAmount)).toLocaleString()} ج.م
                        </Descriptions.Item>
                    </Descriptions>

                    <h3 className="text-lg font-semibold mb-2">عناصر الفاتورة</h3>
                    <Table
                        columns={itemColumns}
                        dataSource={invoiceDetails.items}
                        pagination={false}
                        rowKey="id"
                        bordered
                        summary={(pageData) => {
                            let total = 0;
                            pageData.forEach((item) => {
                                total += Number(item.quantity) * Number(item.unitPrice);
                            });

                            return (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={5}>
                                        الإجمالي
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        {total.toLocaleString()} ج.م
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />
                </div>
            ) : (
                <div className="py-8 text-center text-red-500">
                    لا يمكن تحميل تفاصيل الفاتورة
                </div>
            )}
        </Modal>
    );
} 