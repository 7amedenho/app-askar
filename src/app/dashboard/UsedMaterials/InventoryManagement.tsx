"use client";
import { useState } from "react";
import { Tabs, Button, Input, Table, Tag, Space, Modal, Badge, Tooltip, Progress } from "antd";
import { Search, PlusCircleIcon, Edit, Trash, AlertTriangle, Package, Wrench } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import NewInventoryConsumable from "./NewInventoryConsumable";
import EditInventoryConsumable from "./EditInventoryConsumable";
import NewInventoryEquipment from "./NewInventoryEquipment";
import EditInventoryEquipment from "./EditInventoryEquipment";

const { TabPane } = Tabs;

interface InventoryConsumable {
    id: number;
    name: string;
    unit: string;
    brand: string | null;
    stock: number;
    baseQuantity: number;
    code: string;
    createdAt: string;
    updatedAt: string;
}

interface InventoryEquipment {
    id: number;
    name: string;
    code: string;
    brand: string | null;
    model: string | null;
    quantity: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function InventoryManagement() {
    const queryClient = useQueryClient();

    // State for consumables
    const [isNewConsumableOpen, setIsNewConsumableOpen] = useState<boolean>(false);
    const [isEditConsumableOpen, setIsEditConsumableOpen] = useState<boolean>(false);
    const [selectedConsumable, setSelectedConsumable] = useState<InventoryConsumable | null>(null);
    const [deleteConsumableModalVisible, setDeleteConsumableModalVisible] = useState<boolean>(false);
    const [selectedConsumableForDelete, setSelectedConsumableForDelete] = useState<number | null>(null);

    // State for equipment
    const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState<boolean>(false);
    const [isEditEquipmentOpen, setIsEditEquipmentOpen] = useState<boolean>(false);
    const [selectedEquipment, setSelectedEquipment] = useState<InventoryEquipment | null>(null);
    const [deleteEquipmentModalVisible, setDeleteEquipmentModalVisible] = useState<boolean>(false);
    const [selectedEquipmentForDelete, setSelectedEquipmentForDelete] = useState<number | null>(null);

    // Shared state
    const [searchInput, setSearchInput] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("1");

    // Fetch inventory consumables
    const {
        data: consumables = [],
        isLoading: consumablesLoading,
        error: consumablesError
    } = useQuery<InventoryConsumable[], Error>({
        queryKey: ["inventoryConsumables"],
        queryFn: async () => {
            const response = await axios.get("/api/inventory-consumables");
            return response.data;
        }
    });

    // Fetch inventory equipment
    const {
        data: equipment = [],
        isLoading: equipmentLoading,
        error: equipmentError
    } = useQuery<InventoryEquipment[], Error>({
        queryKey: ["inventoryEquipment"],
        queryFn: async () => {
            const response = await axios.get("/api/inventory-equipment");
            return response.data;
        }
    });

    // Delete consumable mutation
    const deleteConsumableMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`/api/inventory-consumables/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventoryConsumables"] });
            toast.success("تم حذف المستهلك بنجاح");
            setDeleteConsumableModalVisible(false);
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error || "حدث خطأ أثناء حذف المستهلك"
            );
        }
    });

    // Delete equipment mutation
    const deleteEquipmentMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`/api/inventory-equipment/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventoryEquipment"] });
            toast.success("تم حذف المعدة بنجاح");
            setDeleteEquipmentModalVisible(false);
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error || "حدث خطأ أثناء حذف المعدة"
            );
        }
    });

    // Filter consumables based on search
    const filteredConsumables = consumables.filter(consumable =>
        consumable.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        consumable.code.toLowerCase().includes(searchInput.toLowerCase())
    );

    // Filter equipment based on search
    const filteredEquipment = equipment.filter(item =>
        item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        item.code.toLowerCase().includes(searchInput.toLowerCase())
    );

    // Handle delete of consumable
    const handleDeleteConsumable = (id: number) => {
        setSelectedConsumableForDelete(id);
        setDeleteConsumableModalVisible(true);
    };

    const confirmDeleteConsumable = () => {
        if (selectedConsumableForDelete) {
            deleteConsumableMutation.mutate(selectedConsumableForDelete);
        }
    };

    // Handle edit of consumable
    const handleEditConsumable = (consumable: InventoryConsumable) => {
        setSelectedConsumable(consumable);
        setIsEditConsumableOpen(true);
    };

    // Handle delete of equipment
    const handleDeleteEquipment = (id: number) => {
        setSelectedEquipmentForDelete(id);
        setDeleteEquipmentModalVisible(true);
    };

    const confirmDeleteEquipment = () => {
        if (selectedEquipmentForDelete) {
            deleteEquipmentMutation.mutate(selectedEquipmentForDelete);
        }
    };

    // Handle edit of equipment
    const handleEditEquipment = (equipment: InventoryEquipment) => {
        setSelectedEquipment(equipment);
        setIsEditEquipmentOpen(true);
    };

    // Calculate stock status for consumables
    const getStockPercentage = (stock: number, baseQuantity: number) => {
        return Math.min(100, ((stock / (baseQuantity || 1)) * 100));
    };

    const getStockStatusColor = (stock: number, baseQuantity: number) => {
        const percentage = getStockPercentage(stock, baseQuantity);
        if (percentage <= 20) return "exception";
        if (percentage <= 40) return "warning";
        return "success";
    };

    const getStockStatusText = (stock: number, baseQuantity: number) => {
        const percentage = getStockPercentage(stock, baseQuantity);
        if (percentage <= 20) return "منخفض جدًا";
        if (percentage <= 40) return "منخفض";
        return "جيد";
    };

    // Columns for consumables table
    const consumablesColumns = [
        {
            title: 'الكود',
            dataIndex: 'code',
            key: 'code',
            width: 120,
        },
        {
            title: 'اسم المستهلك',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <div className="flex items-center gap-2">
                    <Package size={16} />
                    <span>{text}</span>
                </div>
            )
        },
        {
            title: 'الوحدة',
            dataIndex: 'unit',
            key: 'unit',
            width: 100,
        },
        {
            title: 'الماركة',
            dataIndex: 'brand',
            key: 'brand',
            width: 120,
            render: (text: string | null) => text || '-',
        },
        {
            title: 'المخزون',
            dataIndex: 'stock',
            key: 'stock',
            width: 200,
            render: (stock: number, record: InventoryConsumable) => (
                <div>
                    <div className="flex justify-between mb-1">
                        <span>{stock} {record.unit}</span>
                        <Tooltip title={getStockStatusText(stock, record.baseQuantity)}>
                            <Tag color={
                                getStockStatusColor(stock, record.baseQuantity) === "exception" ? "red" :
                                    getStockStatusColor(stock, record.baseQuantity) === "warning" ? "gold" : "green"
                            }>
                                {getStockStatusText(stock, record.baseQuantity)}
                            </Tag>
                        </Tooltip>
                    </div>
                    <Progress
                        percent={getStockPercentage(stock, record.baseQuantity)}
                        status={
                            getStockStatusColor(stock, record.baseQuantity) === "warning" ? "active" :
                                getStockStatusColor(stock, record.baseQuantity) === "exception" ? "exception" :
                                    "normal"
                        }
                        showInfo={false}
                        size="small"
                    />
                </div>
            ),
        },
        {
            title: 'الإجراءات',
            key: 'action',
            width: 120,
            render: (_: any, record: InventoryConsumable) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<Edit size={16} />}
                        onClick={() => handleEditConsumable(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<Trash size={16} />}
                        onClick={() => handleDeleteConsumable(record.id)}
                    />
                </Space>
            ),
        },
    ];

    // Columns for equipment table
    const equipmentColumns = [
        {
            title: 'الكود',
            dataIndex: 'code',
            key: 'code',
            width: 120,
        },
        {
            title: 'اسم المعدة',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <div className="flex items-center gap-2">
                    <Wrench size={16} />
                    <span>{text}</span>
                </div>
            )
        },
        {
            title: 'الماركة/الموديل',
            key: 'brandModel',
            width: 150,
            render: (_: any, record: InventoryEquipment) => (
                <div>
                    <div>{record.brand || '-'}</div>
                    {record.model && <div className="text-gray-500 text-xs">{record.model}</div>}
                </div>
            ),
        },
        {
            title: 'الكمية',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
        },
        {
            title: 'الحالة',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => {
                let color = 'green';
                let text = 'متاح';

                if (status === 'under_maintenance') {
                    color = 'gold';
                    text = 'قيد الصيانة';
                } else if (status === 'broken') {
                    color = 'red';
                    text = 'معطل';
                }

                return (
                    <Tag color={color}>{text}</Tag>
                );
            },
        },
        {
            title: 'الإجراءات',
            key: 'action',
            width: 120,
            render: (_: any, record: InventoryEquipment) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<Edit size={16} />}
                        onClick={() => handleEditEquipment(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<Trash size={16} />}
                        onClick={() => handleDeleteEquipment(record.id)}
                    />
                </Space>
            ),
        },
    ];

    // Loading state
    if (consumablesLoading || equipmentLoading) {
        return (
            <div className="mt-6 space-y-6">
                <Skeleton className="h-10 w-full" />
                <div className="flex items-center gap-4 pb-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (consumablesError || equipmentError) {
        return (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
                حدث خطأ: {consumablesError?.message || equipmentError?.message}
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">إدارة المخزون</h2>

            <Tabs
                defaultActiveKey="1"
                onChange={(key) => setActiveTab(key)}
                type="card"
            >
                <TabPane
                    tab={
                        <span className="flex items-center gap-2">
                            <Package size={16} />
                            <span>المستهلكات</span>
                            {filteredConsumables.some(c => getStockPercentage(c.stock, c.baseQuantity) <= 20) && (
                                <Badge count={<AlertTriangle size={12} className="text-yellow-500" />} dot />
                            )}
                        </span>
                    }
                    key="1"
                >
                    <div className="flex items-center gap-4 border-b pb-4 mb-4">
                        <Input
                            className="w-full"
                            placeholder="بحث بالاسم أو الكود"
                            prefix={<Search size={16} />}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button
                            type="primary"
                            className="flex items-center gap-2"
                            onClick={() => setIsNewConsumableOpen(true)}
                        >
                            <PlusCircleIcon size={18} />
                            <span>إضافة مستهلك</span>
                        </Button>
                    </div>

                    <Table
                        columns={consumablesColumns}
                        dataSource={filteredConsumables}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "لا توجد مستهلكات" }}
                    />
                </TabPane>

                <TabPane
                    tab={
                        <span className="flex items-center gap-2">
                            <Wrench size={16} />
                            <span>المعدات</span>
                        </span>
                    }
                    key="2"
                >
                    <div className="flex items-center gap-4 border-b pb-4 mb-4">
                        <Input
                            className="w-full"
                            placeholder="بحث بالاسم أو الكود"
                            prefix={<Search size={16} />}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button
                            type="primary"
                            className="flex items-center gap-2"
                            onClick={() => setIsNewEquipmentOpen(true)}
                        >
                            <PlusCircleIcon size={18} />
                            <span>إضافة معدة</span>
                        </Button>
                    </div>

                    <Table
                        columns={equipmentColumns}
                        dataSource={filteredEquipment}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "لا توجد معدات" }}
                    />
                </TabPane>
            </Tabs>

            {/* Modals */}
            {isNewConsumableOpen && (
                <NewInventoryConsumable
                    open={isNewConsumableOpen}
                    onCancel={() => setIsNewConsumableOpen(false)}
                />
            )}

            {isEditConsumableOpen && selectedConsumable && (
                <EditInventoryConsumable
                    open={isEditConsumableOpen}
                    onCancel={() => setIsEditConsumableOpen(false)}
                    consumable={selectedConsumable}
                />
            )}

            {isNewEquipmentOpen && (
                <NewInventoryEquipment
                    open={isNewEquipmentOpen}
                    onCancel={() => setIsNewEquipmentOpen(false)}
                />
            )}

            {isEditEquipmentOpen && selectedEquipment && (
                <EditInventoryEquipment
                    open={isEditEquipmentOpen}
                    onCancel={() => setIsEditEquipmentOpen(false)}
                    equipment={selectedEquipment}
                />
            )}

            {/* Confirmation Modals */}
            <Modal
                title="تأكيد الحذف"
                open={deleteConsumableModalVisible}
                onOk={confirmDeleteConsumable}
                onCancel={() => setDeleteConsumableModalVisible(false)}
                okText="حذف"
                cancelText="إلغاء"
                okButtonProps={{ danger: true }}
            >
                <p>هل أنت متأكد من حذف هذا المستهلك؟</p>
            </Modal>

            <Modal
                title="تأكيد الحذف"
                open={deleteEquipmentModalVisible}
                onOk={confirmDeleteEquipment}
                onCancel={() => setDeleteEquipmentModalVisible(false)}
                okText="حذف"
                cancelText="إلغاء"
                okButtonProps={{ danger: true }}
            >
                <p>هل أنت متأكد من حذف هذه المعدة؟</p>
            </Modal>
        </div>
    );
} 