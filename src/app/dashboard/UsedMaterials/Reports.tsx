"use client";
import { useState } from "react";
import { Card, Select, Button, DatePicker, Spin, Empty, Radio, Table, Input } from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search, Printer, FileText, Package, Wrench } from "lucide-react";
import dayjs from "dayjs";
import type { RadioChangeEvent } from "antd";
import { printInvoicesReport, printInvoiceDetailsReport, printConsumablesReport, printEquipmentReport } from "./printReports";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ClientCompany {
  id: number;
  name: string;
  code: string;
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
  items: MaterialInvoiceItem[];
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
}

interface InventoryConsumable {
  id: number;
  name: string;
  code: string;
  unit: string;
  brand: string | null;
  stock: number;
  baseQuantity: number;
}

interface InventoryEquipment {
  id: number;
  name: string;
  code: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  status: string;
}

const Reports = () => {
  const [reportType, setReportType] = useState<string>("invoices");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [consumableId, setConsumableId] = useState<number | null>(null);
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["clientCompanies"],
    queryFn: async () => {
      const response = await axios.get("/api/client-companies");
      return response.data;
    },
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["materialInvoices", companyId],
    queryFn: async () => {
      const response = await axios.get(
        companyId ? `/api/client-companies/${companyId}` : "/api/material-invoices"
      );
      return companyId ? response.data.invoices : response.data;
    },
    enabled: reportType === "invoices" || reportType === "invoice_details",
  });

  // Fetch consumables
  const { data: consumables = [], isLoading: consumablesLoading } = useQuery({
    queryKey: ["inventoryConsumables"],
    queryFn: async () => {
      const response = await axios.get("/api/inventory-consumables");
      return response.data;
    },
    enabled: reportType === "consumables" || reportType === "consumable_usage",
  });

  // Fetch equipment
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ["inventoryEquipment"],
    queryFn: async () => {
      const response = await axios.get("/api/inventory-equipment");
      return response.data;
    },
    enabled: reportType === "equipment" || reportType === "equipment_usage",
  });

  // Handle report type change
  const handleReportTypeChange = (e: RadioChangeEvent) => {
    setReportType(e.target.value);
    setCompanyId(null);
    setInvoiceId(null);
    setConsumableId(null);
    setEquipmentId(null);
    setDateRange(null);
    setSearchQuery("");
  };

  // Filter data based on search and filters
  const filteredInvoices = invoices.filter((invoice: MaterialInvoice) => {
    const matchesSearch = searchQuery
      ? invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesDateRange = dateRange
      ? dayjs(invoice.invoiceDate).isAfter(dateRange[0]) &&
        dayjs(invoice.invoiceDate).isBefore(dateRange[1])
      : true;

    return matchesSearch && matchesDateRange;
  });

  const filteredConsumables = consumables.filter((item: InventoryConsumable) => {
    return searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
  });

  const filteredEquipment = equipment.filter((item: InventoryEquipment) => {
    return searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
  });

  // Get specific invoice details
  const selectedInvoice = invoiceId
    ? invoices.find((invoice: MaterialInvoice) => invoice.id === invoiceId)
    : null;

  // Get specific consumable details
  const selectedConsumable = consumableId
    ? consumables.find((item: InventoryConsumable) => item.id === consumableId)
    : null;

  // Get specific equipment details
  const selectedEquipment = equipmentId
    ? equipment.find((item: InventoryEquipment) => item.id === equipmentId)
    : null;

  // Define table columns for different report types
  const invoicesColumns = [
    {
      title: "رقم الفاتورة",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
    },
    {
      title: "الشركة",
      dataIndex: "companyName",
      key: "companyName",
      render: (_: any, record: MaterialInvoice) => {
        const company = companies.find((c: ClientCompany) => c.id === record.clientCompanyId);
        return company ? company.name : "غير معروف";
      },
    },
    {
      title: "التاريخ",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        switch (status) {
          case "pending":
            return "معلقة";
          case "completed":
            return "مكتملة";
          case "canceled":
            return "ملغاة";
          default:
            return status;
        }
      },
    },
    {
      title: "القيمة الإجمالية",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => `${amount.toLocaleString()} جنيه`,
    },
  ];

  const invoiceItemsColumns = [
    {
      title: "الصنف",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "النوع",
      dataIndex: "itemType",
      key: "itemType",
      render: (type: string) => (type === "inventory_consumable" ? "مستهلك" : "معدة"),
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "سعر الوحدة",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (price: number) => `${price.toLocaleString()} جنيه`,
    },
    {
      title: "الإجمالي",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price: number) => `${price.toLocaleString()} جنيه`,
    },
  ];

  const consumablesColumns = [
    {
      title: "الكود",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الوحدة",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "الماركة",
      dataIndex: "brand",
      key: "brand",
      render: (brand: string | null) => brand || "-",
    },
    {
      title: "المخزون",
      dataIndex: "stock",
      key: "stock",
    },
    {
      title: "نسبة المخزون",
      key: "stockPercentage",
      render: (record: InventoryConsumable) => {
        const percentage = Math.round((record.stock / (record.baseQuantity || 1)) * 100);
        let color = "green";
        if (percentage <= 20) {
          color = "red";
        } else if (percentage <= 50) {
          color = "orange";
        }
        return (
          <span style={{ color }}>
            {percentage}% ({record.stock}/{record.baseQuantity})
          </span>
        );
      },
    },
  ];

  const equipmentColumns = [
    {
      title: "الكود",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الماركة",
      dataIndex: "brand",
      key: "brand",
      render: (brand: string | null) => brand || "-",
    },
    {
      title: "الموديل",
      dataIndex: "model",
      key: "model",
      render: (model: string | null) => model || "-",
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        switch (status) {
          case "available":
            return "متاح";
          case "in_use":
            return "قيد الاستخدام";
          case "maintenance":
            return "صيانة";
          case "damaged":
            return "تالف";
          default:
            return status;
        }
      },
    },
  ];

  // Print specific report
  const printReport = () => {
    switch (reportType) {
      case "invoices":
        const title = companyId 
          ? `تقرير فواتير شركة ${companies.find((c: ClientCompany) => c.id === companyId)?.name || ''}`
          : "تقرير فواتير التوريدات";
        printInvoicesReport(title, filteredInvoices, invoicesColumns);
        break;
      case "invoice_details":
        if (!selectedInvoice) return;
        const companyName = companies.find((c: ClientCompany) => c.id === selectedInvoice.clientCompanyId)?.name || "غير معروف";
        printInvoiceDetailsReport(selectedInvoice, selectedInvoice.items, companyName, invoiceItemsColumns);
        break;
      case "consumables":
        printConsumablesReport(filteredConsumables, consumablesColumns);
        break;
      case "equipment":
        printEquipmentReport(filteredEquipment, equipmentColumns);
        break;
      default:
        return;
    }
  };

  // Loading state
  if (
    (reportType === "invoices" && invoicesLoading) ||
    (reportType === "consumables" && consumablesLoading) ||
    (reportType === "equipment" && equipmentLoading)
  ) {
    return (
      <div className="flex justify-center items-center p-10">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">تقارير التوريدات والمخزون</h1>

      {/* Report Type Selection */}
      <Card title="نوع التقرير" className="mb-6">
        <Radio.Group onChange={handleReportTypeChange} value={reportType}>
          <Radio.Button value="invoices">
            <FileText size={16} className="inline-block ml-1" />
            فواتير الشركات
          </Radio.Button>
          <Radio.Button value="invoice_details">
            <FileText size={16} className="inline-block ml-1" />
            تفاصيل فاتورة
          </Radio.Button>
          <Radio.Button value="consumables">
            <Package size={16} className="inline-block ml-1" />
            المستهلكات
          </Radio.Button>
          <Radio.Button value="equipment">
            <Wrench size={16} className="inline-block ml-1" />
            المعدات
          </Radio.Button>
        </Radio.Group>
      </Card>

      {/* Filters */}
      <Card title="تصفية النتائج" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportType === "invoices" && (
            <div>
              <label className="block mb-2">الشركة</label>
              <Select
                placeholder="اختر الشركة"
                className="w-full"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => setCompanyId(value)}
                value={companyId}
              >
                {companies.map((company: ClientCompany) => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {reportType === "invoice_details" && (
            <div>
              <label className="block mb-2">رقم الفاتورة</label>
              <Select
                placeholder="اختر الفاتورة"
                className="w-full"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => setInvoiceId(value)}
                value={invoiceId}
              >
                {invoices.map((invoice: MaterialInvoice) => (
                  <Option key={invoice.id} value={invoice.id}>
                    {`${invoice.invoiceNumber} - ${
                      companies.find((c: ClientCompany) => c.id === invoice.clientCompanyId)?.name || "غير معروف"
                    }`}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {reportType === "consumables" && (
            <div>
              <label className="block mb-2">بحث</label>
              <Input
                placeholder="بحث بالاسم أو الكود"
                prefix={<Search size={16} />}
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
              />
            </div>
          )}

          {reportType === "equipment" && (
            <div>
              <label className="block mb-2">بحث</label>
              <Input
                placeholder="بحث بالاسم أو الكود"
                prefix={<Search size={16} />}
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
              />
            </div>
          )}

          {(reportType === "invoices") && (
            <div>
              <label className="block mb-2">نطاق التاريخ</label>
              <RangePicker
                className="w-full"
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
            </div>
          )}

          <div className="flex items-end">
            <Button
              type="primary"
              icon={<Printer size={16} />}
              onClick={printReport}
              disabled={
                (reportType === "invoice_details" && !invoiceId) 
              }
            >
              طباعة التقرير
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Preview */}
      <Card title="معاينة التقرير" className="mb-6">
        {reportType === "invoices" && (
          <>
            {filteredInvoices.length > 0 ? (
              <Table
                dataSource={filteredInvoices}
                columns={invoicesColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty description="لا توجد فواتير مطابقة" />
            )}
          </>
        )}

        {reportType === "invoice_details" && (
          <>
            {selectedInvoice ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                  <div>
                    <span className="font-bold">رقم الفاتورة:</span> {selectedInvoice.invoiceNumber}
                  </div>
                  <div>
                    <span className="font-bold">التاريخ:</span>{" "}
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString("ar-EG")}
                  </div>
                  <div>
                    <span className="font-bold">الشركة:</span>{" "}
                    {companies.find((c: ClientCompany) => c.id === selectedInvoice.clientCompanyId)?.name || "غير معروف"}
                  </div>
                </div>

                <Table
                  dataSource={selectedInvoice.items}
                  columns={invoiceItemsColumns}
                  rowKey="id"
                  pagination={false}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                          الإجمالي
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} className="font-bold">
                          {selectedInvoice.totalAmount.toLocaleString()} جنيه
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </div>
            ) : (
              <Empty description="الرجاء اختيار فاتورة" />
            )}
          </>
        )}

        {reportType === "consumables" && (
          <>
            {filteredConsumables.length > 0 ? (
              <Table
                dataSource={filteredConsumables}
                columns={consumablesColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty description="لا توجد مستهلكات مطابقة" />
            )}
          </>
        )}

        {reportType === "equipment" && (
          <>
            {filteredEquipment.length > 0 ? (
              <Table
                dataSource={filteredEquipment}
                columns={equipmentColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty description="لا توجد معدات مطابقة" />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default Reports; 