"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button, Input, Modal, Select, Tabs, notification, Badge, Tooltip, Spin } from "antd";
import {
    PlusCircleIcon,
    Search,
    AlignJustify,
    Edit,
    Trash,
    File,
    Users,
    Package,
    FileText,
    Truck,
    Building,
    Bell,
    AlertTriangle,
    Wrench,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import NewClientCompany from "./NewClientCompany";
import EditClientCompany from "./EditClientCompany";
import NewMaterialInvoice from "./NewMaterialInvoice";
import InvoiceDetails from "./InvoiceDetails";
import InventoryManagement from "./InventoryManagement";
import Reports from "./Reports";

const { TabPane } = Tabs;
const { Option } = Select;

interface ClientCompany {
    id: number;
    name: string;
    code: string;
    phoneNumber: string | null;
    address: string | null;
    email: string | null;
    contactName: string | null;
    invoices: MaterialInvoice[];
    createdAt: string;
    updatedAt: string;
}

interface MaterialInvoice {
    id: number;
    clientCompanyId: number;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string | null;
    status: string;
    totalAmount: number;
    paidAmount: number;
    notes: string | null;
    items: MaterialInvoiceItem[];
    createdAt: string;
    updatedAt: string;
}

interface MaterialInvoiceItem {
    id: number;
    invoiceId: number;
    itemType: string;
    itemId: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes: string | null;
    createdAt: string;
}

export default function Page() {
    const queryClient = useQueryClient();

    // State
    const [isNewCompanyOpen, setIsNewCompanyOpen] = useState<boolean>(false);
    const [isEditCompanyOpen, setIsEditCompanyOpen] = useState<boolean>(false);
    const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState<boolean>(false);
    const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("1");
    const [selectedCompany, setSelectedCompany] = useState<ClientCompany | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<MaterialInvoice | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [selectedCompanyForDelete, setSelectedCompanyForDelete] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Fetch client companies
    const fetchClientCompanies = async (): Promise<ClientCompany[]> => {
        const response = await axios.get("/api/client-companies");
        return response.data;
    };

    // Fetch invoices
    const fetchInvoices = async (): Promise<MaterialInvoice[]> => {
        const response = await axios.get("/api/material-invoices");
        return response.data;
    };

    // Fetch inventory consumables
    const fetchInventoryConsumables = async () => {
        const response = await axios.get("/api/inventory-consumables");
        return response.data;
    };

    // Fetch inventory equipment
    const fetchInventoryEquipment = async () => {
        const response = await axios.get("/api/inventory-equipment");
        return response.data;
    };

    // Delete client company
    const deleteClientCompany = async (id: number) => {
        await axios.delete(`/api/client-companies/${id}`);
    };

    // Queries
    const {
        data: companies = [],
        isLoading: companiesLoading,
        error: companiesError,
    } = useQuery<ClientCompany[], Error>({
        queryKey: ["clientCompanies"],
        queryFn: fetchClientCompanies,
    });

    const {
        data: invoices = [],
        isLoading: invoicesLoading,
        error: invoicesError,
    } = useQuery<MaterialInvoice[], Error>({
        queryKey: ["materialInvoices"],
        queryFn: fetchInvoices,
    });

    const {
        data: inventoryConsumables = [],
        isLoading: inventoryConsumablesLoading,
        error: inventoryConsumablesError,
    } = useQuery({
        queryKey: ["inventoryConsumables"],
        queryFn: fetchInventoryConsumables,
    });

    const {
        data: inventoryEquipment = [],
        isLoading: inventoryEquipmentLoading,
        error: inventoryEquipmentError,
    } = useQuery({
        queryKey: ["inventoryEquipment"],
        queryFn: fetchInventoryEquipment,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteClientCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clientCompanies"] });
            toast.success("تم حذف الشركة بنجاح!");
            setDeleteModalVisible(false);
        },
        onError: () => {
            toast.error("حدث خطأ في حذف الشركة");
        },
    });

    // Filter companies based on search input
    const filteredCompanies = companies.filter((company) => {
        return (
            company.name.toLowerCase().includes(searchInput.toLowerCase()) ||
            company.code.toLowerCase().includes(searchInput.toLowerCase())
        );
    });

    // Filter invoices based on search input and status filter
    const filteredInvoices = invoices.filter((invoice) => {
        const company = companies.find(c => c.id === invoice.clientCompanyId);
        const matchesSearch = 
            invoice.invoiceNumber.toLowerCase().includes(searchInput.toLowerCase()) ||
            (company?.name?.toLowerCase() || "").includes(searchInput.toLowerCase());
        
        const matchesStatus = statusFilter ? invoice.status === statusFilter : true;
        
        return matchesSearch && matchesStatus;
    });

    // Calculate invoice stats
    const pendingInvoices = invoices.filter(invoice => invoice.status === "pending").length;
    const completedInvoices = invoices.filter(invoice => invoice.status === "completed").length;
    const canceledInvoices = invoices.filter(invoice => invoice.status === "canceled").length;

    // Calculate low stock for notifications
    const lowStockConsumables = inventoryConsumables.filter((item: { stock: number; baseQuantity: any; }) => {
        return item.stock / (item.baseQuantity || 1) <= 0.2; // 20% or less of base quantity
    }).length;

    // Handle delete confirmation
    const handleDeleteCompany = (id: number) => {
        setSelectedCompanyForDelete(id);
        setDeleteModalVisible(true);
    };

    const confirmDelete = () => {
        if (selectedCompanyForDelete) {
            deleteMutation.mutate(selectedCompanyForDelete);
        }
    };

    // Edit company handler
    const handleEditCompany = (company: ClientCompany) => {
        setSelectedCompany(company);
        setIsEditCompanyOpen(true);
    };

    // View invoice details
    const handleViewInvoice = (invoice: MaterialInvoice) => {
        setSelectedInvoice(invoice);
        setIsInvoiceDetailOpen(true);
    };

    // Create new invoice for company
    const handleCreateInvoice = (company: ClientCompany) => {
        setSelectedCompany(company);
        setIsNewInvoiceOpen(true);
    };

    // Handle tab change
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setSearchInput(""); // Clear search when changing tabs
        setStatusFilter(null); // Reset status filter when changing tabs
    };

    // Loading state
    if (companiesLoading || invoicesLoading || inventoryConsumablesLoading || inventoryEquipmentLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-1/4 mx-auto" />
                <div className="flex items-center gap-4 border-b pb-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array(6)
                        .fill(0)
                        .map((_, index) => (
                            <Card key={index} className="w-full">
                                <CardHeader className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-1/3" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Array(3)
                                            .fill(0)
                                            .map((_, i) => (
                                                <Skeleton key={i} className="h-5 w-full" />
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        );
    }

    // Error state
    if (companiesError || invoicesError || inventoryConsumablesError || inventoryEquipmentError) {
        return (
            <div className="text-center p-6 text-red-500">
                حدث خطأ: {companiesError?.message || invoicesError?.message || inventoryConsumablesError?.message || inventoryEquipmentError?.message}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-center">إدارة التوريدات والمخزون</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building size={16} className="text-blue-500" />
                            <span>عدد الشركات</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText size={16} className="text-yellow-500" />
                            <span>الفواتير المعلقة</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingInvoices}</div>
                    </CardContent>
                </Card>

                <Card className="border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText size={16} className="text-green-500" />
                            <span>الفواتير المكتملة</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedInvoices}</div>
                    </CardContent>
                </Card>

                <Card className="border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText size={16} className="text-red-500" />
                            <span>الفواتير الملغاة</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{canceledInvoices}</div>
                    </CardContent>
                </Card>

                <Card className="border-orange-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-500" />
                            <span>مستهلكات منخفضة</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockConsumables}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs
                defaultActiveKey="1"
                onChange={handleTabChange}
                type="card"
                className="mt-8"
            >
                <TabPane
                    tab={
                        <span className="flex items-center gap-2">
                            <Building size={16} />
                            <span>الشركات</span>
                        </span>
                    }
                    key="1"
                >
                    <div className="flex items-center gap-4 border-b pb-4 mb-6">
                        <Input
                            className="w-full"
                            placeholder="بحث بالاسم أو الكود"
                            prefix={<Search />}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button
                            type="primary"
                            className="flex items-center gap-2"
                            onClick={() => setIsNewCompanyOpen(true)}
                        >
                            <PlusCircleIcon size={18} />
                            <span>إضافة شركة</span>
                        </Button>
                    </div>

                    {filteredCompanies.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            لا توجد شركات مسجلة بعد
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCompanies.map((company) => (
                                <Card key={company.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2 flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold">{company.name}</CardTitle>
                                            <p className="text-sm text-gray-500">كود: {company.code}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    className="p-0 h-8 w-8 rounded-full"
                                                    icon={<AlignJustify size={16} />}
                                                />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem
                                                    className="cursor-pointer flex items-center gap-2"
                                                    onClick={() => handleEditCompany(company)}
                                                >
                                                    <Edit size={14} />
                                                    <span>تعديل</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer flex items-center gap-2 text-red-500"
                                                    onClick={() => handleDeleteCompany(company.id)}
                                                >
                                                    <Trash size={14} />
                                                    <span>حذف</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {company.phoneNumber && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">رقم الهاتف:</span>
                                                <span>{company.phoneNumber}</span>
                                            </div>
                                        )}
                                        {company.contactName && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">جهة الاتصال:</span>
                                                <span>{company.contactName}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">عدد الفواتير:</span>
                                            <span>{company.invoices.length}</span>
                                        </div>
                                        <Button
                                            type="primary"
                                            className="w-full flex items-center justify-center gap-2"
                                            onClick={() => handleCreateInvoice(company)}
                                        >
                                            <FileText size={16} />
                                            <span>إنشاء فاتورة جديدة</span>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabPane>

                <TabPane
                    tab={
                        <span className="flex items-center gap-2">
                            <FileText size={16} />
                            <span>فواتير التوريدات</span>
                            {pendingInvoices > 0 && (
                                <Badge count={pendingInvoices} color="gold" />
                            )}
                        </span>
                    }
                    key="2"
                >
                    <div className="flex items-center gap-4 border-b pb-4 mb-6">
                        <Input
                            className="w-full"
                            placeholder="بحث برقم الفاتورة أو اسم الشركة"
                            prefix={<Search />}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Select
                            placeholder="تصفية حسب الحالة"
                            className="min-w-[200px]"
                            allowClear
                            value={statusFilter}
                            onChange={setStatusFilter}
                        >
                            <Option value="pending">معلقة</Option>
                            <Option value="completed">مكتملة</Option>
                            <Option value="canceled">ملغاة</Option>
                        </Select>
                    </div>

                    {filteredInvoices.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            {invoices.length === 0 ? 
                                "لا توجد فواتير مسجلة بعد" : 
                                "لا توجد فواتير تطابق معايير البحث"}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredInvoices.map((invoice) => {
                                const company = companies.find(c => c.id === invoice.clientCompanyId);
                                return (
                                    <Card
                                        key={invoice.id}
                                        className={`hover:shadow-md transition-shadow ${invoice.status === "pending"
                                            ? "border-yellow-300"
                                            : invoice.status === "completed"
                                                ? "border-green-300"
                                                : "border-red-300"
                                            }`}
                                    >
                                        <CardHeader className="pb-2 flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-bold">
                                                    فاتورة #{invoice.invoiceNumber}
                                                </CardTitle>
                                                <p className="text-sm text-gray-500">
                                                    {company?.name || "شركة غير معروفة"}
                                                </p>
                                            </div>
                                            <Badge
                                                status={
                                                    invoice.status === "pending"
                                                        ? "warning"
                                                        : invoice.status === "completed"
                                                            ? "success"
                                                            : "error"
                                                }
                                                text={
                                                    invoice.status === "pending"
                                                        ? "معلقة"
                                                        : invoice.status === "completed"
                                                            ? "مكتملة"
                                                            : "ملغاة"
                                                }
                                            />
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">التاريخ:</span>
                                                <span>{new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                            {invoice.dueDate && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">تاريخ الاستحقاق:</span>
                                                    <span>{new Date(invoice.dueDate).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">عدد الأصناف:</span>
                                                <span>{invoice.items.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between font-bold">
                                                <span>المبلغ الإجمالي:</span>
                                                <span>{invoice.totalAmount.toLocaleString()} جنيه</span>
                                            </div>
                                            <Button
                                                type="default"
                                                className="w-full flex items-center justify-center gap-2"
                                                onClick={() => handleViewInvoice(invoice)}
                                            >
                                                <File size={16} />
                                                <span>عرض التفاصيل</span>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabPane>

                <TabPane
                    tab={
                        <span className="flex items-center gap-2">
                            <Package size={16} />
                            <span>إدارة المخزون</span>
                            {lowStockConsumables > 0 && (
                                <Badge count={<AlertTriangle size={12} className="text-yellow-500" />} dot />
                            )}
                        </span>
                    }
                    key="3"
                >
                    <InventoryManagement />
                </TabPane>

                <TabPane
                    tab={
                        <span className="flex items-center gap-2">
                            <FileText size={16} />
                            <span>التقارير</span>
                        </span>
                    }
                    key="4"
                >
                    <Reports />
                </TabPane>
            </Tabs>

            {/* Modals */}
            {isNewCompanyOpen && (
                <NewClientCompany
                    open={isNewCompanyOpen}
                    onCancel={() => setIsNewCompanyOpen(false)}
                />
            )}

            {isEditCompanyOpen && selectedCompany && (
                <EditClientCompany
                    open={isEditCompanyOpen}
                    onCancel={() => setIsEditCompanyOpen(false)}
                    company={selectedCompany}
                />
            )}

            {isNewInvoiceOpen && selectedCompany && (
                <NewMaterialInvoice
                    open={isNewInvoiceOpen}
                    onCancel={() => setIsNewInvoiceOpen(false)}
                    company={selectedCompany}
                />
            )}

            {isInvoiceDetailOpen && selectedInvoice && (
                <InvoiceDetails
                    open={isInvoiceDetailOpen}
                    onCancel={() => setIsInvoiceDetailOpen(false)}
                    invoice={selectedInvoice}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                title="تأكيد الحذف"
                open={deleteModalVisible}
                onOk={confirmDelete}
                onCancel={() => setDeleteModalVisible(false)}
                okText="حذف"
                cancelText="إلغاء"
                okButtonProps={{ danger: true }}
            >
                <p>هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع فواتيرها أيضاً.</p>
            </Modal>
        </div>
    );
} 