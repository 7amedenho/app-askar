"use client";
import { useState, useMemo } from "react";
import { Modal, Select, DatePicker, Tabs } from "antd";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApexOptions } from "apexcharts"; // استيراد نوع ApexOptions

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

interface ExpenseChartProps {
    isOpen: boolean;
    onClose: () => void;
    expenses: any[];
}

export default function ExpenseChart({ isOpen, onClose, expenses }: ExpenseChartProps) {
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [chartType, setChartType] = useState<string>("area");

    // تصفية المصروفات حسب التاريخ
    const filteredExpenses = useMemo(() => {
        if (!dateRange[0] || !dateRange[1]) return expenses;

        return expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= dateRange[0]! && expenseDate <= dateRange[1]!;
        });
    }, [expenses, dateRange]);

    // تجميع المصروفات حسب الشهر
    const expensesByMonth = useMemo(() => {
        const months: Record<string, number> = {};

        filteredExpenses.forEach((expense) => {
            const date = new Date(expense.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!months[monthYear]) {
                months[monthYear] = 0;
            }

            months[monthYear] += Number(expense.amount);
        });

        const sortedMonths = Object.entries(months).sort((a, b) => {
            const [monthA, yearA] = a[0].split("/").map(Number);
            const [monthB, yearB] = b[0].split("/").map(Number);

            if (yearA !== yearB) return yearA - yearB;
            return monthA - monthB;
        });

        return sortedMonths;
    }, [filteredExpenses]);

    // تجميع المصروفات حسب النوع
    const expensesByType = useMemo(() => {
        const types: Record<string, number> = {};

        filteredExpenses.forEach((expense) => {
            if (!types[expense.expenseType]) {
                types[expense.expenseType] = 0;
            }

            types[expense.expenseType] += Number(expense.amount);
        });

        return Object.entries(types);
    }, [filteredExpenses]);

    // تجميع المصروفات حسب العهدة
    const expensesByCustody = useMemo(() => {
        const custodies: Record<string, number> = {};

        filteredExpenses.forEach((expense) => {
            const custodyName = expense.custody.name;

            if (!custodies[custodyName]) {
                custodies[custodyName] = 0;
            }

            custodies[custodyName] += Number(expense.amount);
        });

        return Object.entries(custodies);
    }, [filteredExpenses]);

    // تجميع المصروفات حسب المشروع
    const expensesByProject = useMemo(() => {
        const projects: Record<string, number> = {};

        filteredExpenses.forEach((expense) => {
            const projectName = expense.project?.name || "بدون مشروع";

            if (!projects[projectName]) {
                projects[projectName] = 0;
            }

            projects[projectName] += Number(expense.amount);
        });

        return Object.entries(projects);
    }, [filteredExpenses]);

    // إعدادات الرسم البياني للمصروفات حسب الشهر
    const monthlyChartOptions: ApexOptions = {
        chart: {
            id: "monthly-expenses",
            toolbar: {
                show: true,
            },
            fontFamily: "Arial, sans-serif",
        },
        xaxis: {
            categories: expensesByMonth.map(([month]) => month),
        },
        yaxis: {
            title: {
                text: "المبلغ (جنيه)",
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => val.toLocaleString(),
        },
        title: {
            text: "المصروفات الشهرية",
            align: "center" as const,
        },
        colors: ["#1890ff"],
        stroke: {
            curve: "smooth" as const,
            width: 3,
        },
        fill: {
            type: "gradient",
            gradient: {
                shade: "dark",
                type: "vertical",
                shadeIntensity: 0.3,
                opacityFrom: 0.7,
                opacityTo: 0.2,
            },
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val.toLocaleString()} جنيه`,
            },
        },
    };

    const monthlyChartSeries = [
        {
            name: "إجمالي المصروفات",
            data: expensesByMonth.map(([_, amount]) => amount),
        },
    ];

    // إعدادات الرسم البياني للمصروفات حسب النوع
    const typeChartOptions: ApexOptions = {
        chart: {
            id: "type-expenses",
            toolbar: {
                show: true,
            },
        },
        labels: expensesByType.map(([type]) => type),
        legend: {
            position: "bottom" as const,
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(1)}%`,
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val.toLocaleString()} جنيه`,
            },
        },
        title: {
            text: "توزيع المصروفات حسب النوع",
            align: "center" as const,
        },
        colors: ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"],
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 300,
                    },
                    legend: {
                        position: "bottom" as const,
                    },
                },
            },
        ],
    };

    const typeChartSeries = expensesByType.map(([_, amount]) => amount);

    // إعدادات الرسم البياني للمصروفات حسب العهدة
    const custodyChartOptions: ApexOptions = {
        chart: {
            id: "custody-expenses",
            toolbar: {
                show: true,
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                dataLabels: {
                    position: "top" as const,
                },
            },
        },
        xaxis: {
            categories: expensesByCustody.map(([custody]) => custody),
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => val.toLocaleString(),
            offsetX: 30,
        },
        title: {
            text: "المصروفات حسب العهدة",
            align: "center" as const,
        },
        colors: ["#1890ff"],
        tooltip: {
            y: {
                formatter: (val: number) => `${val.toLocaleString()} جنيه`,
            },
        },
    };

    const custodyChartSeries = [
        {
            name: "إجمالي المصروفات",
            data: expensesByCustody.map(([_, amount]) => amount),
        },
    ];

    // إعدادات الرسم البياني للمصروفات حسب المشروع
    const projectChartOptions: ApexOptions = {
        chart: {
            id: "project-expenses",
            toolbar: {
                show: true,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "55%",
                borderRadius: 10,
            },
        },
        xaxis: {
            categories: expensesByProject.map(([project]) => project),
        },
        dataLabels: {
            enabled: false,
        },
        title: {
            text: "المصروفات حسب المشروع",
            align: "center" as const,
        },
        colors: ["#52c41a"],
        tooltip: {
            y: {
                formatter: (val: number) => `${val.toLocaleString()} جنيه`,
            },
        },
    };

    const projectChartSeries = [
        {
            name: "إجمالي المصروفات",
            data: expensesByProject.map(([_, amount]) => amount),
        },
    ];

    return (
        <Modal
            title="الرسوم البيانية للمصروفات"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={1000}
            style={{ top: 20 }}
        >
            <div className="space-y-6 py-4">
                {/* أدوات التصفية */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium mb-1">الفترة الزمنية</label>
                        <RangePicker
                            className="w-full"
                            onChange={(dates) => {
                                if (dates) {
                                    setDateRange([dates[0]?.toDate() || null, dates[1]?.toDate() || null]);
                                } else {
                                    setDateRange([null, null]);
                                }
                            }}
                        />
                    </div>

                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium mb-1">نوع الرسم البياني</label>
                        <Select className="w-full" value={chartType} onChange={setChartType}>
                            <Option value="area">مساحي</Option>
                            <Option value="bar">أعمدة</Option>
                            <Option value="line">خطي</Option>
                        </Select>
                    </div>
                </div>

                {/* الرسوم البيانية */}
                <Tabs defaultActiveKey="monthly">
                    <TabPane tab="المصروفات الشهرية" key="monthly">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-[400px]">
                                    {typeof window !== "undefined" && (
                                        <Chart
                                            options={monthlyChartOptions}
                                            series={monthlyChartSeries}
                                            type={chartType === "bar" ? "bar" : chartType === "line" ? "line" : "area"}
                                            height={350}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabPane>

                    <TabPane tab="المصروفات حسب النوع" key="type">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-[400px]">
                                    {typeof window !== "undefined" && (
                                        <Chart options={typeChartOptions} series={typeChartSeries} type="pie" height={350} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabPane>

                    <TabPane tab="المصروفات حسب العهدة" key="custody">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-[400px]">
                                    {typeof window !== "undefined" && (
                                        <Chart
                                            options={custodyChartOptions}
                                            series={custodyChartSeries}
                                            type="bar"
                                            height={350}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabPane>

                    <TabPane tab="المصروفات حسب المشروع" key="project">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-[400px]">
                                    {typeof window !== "undefined" && (
                                        <Chart
                                            options={projectChartOptions}
                                            series={projectChartSeries}
                                            type="bar"
                                            height={350}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabPane>
                </Tabs>

                {/* ملخص المصروفات */}
                <Card>
                    <CardHeader>
                        <CardTitle>ملخص المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">إجمالي المصروفات</div>
                                <div className="text-2xl font-bold">
                                    {filteredExpenses
                                        .reduce((sum, expense) => sum + Number(expense.amount), 0)
                                        .toLocaleString()}{" "}
                                    جنيه
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">عدد المصروفات</div>
                                <div className="text-2xl font-bold">{filteredExpenses.length}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">متوسط المصروفات</div>
                                <div className="text-2xl font-bold">
                                    {filteredExpenses.length > 0
                                        ? (
                                            filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0) /
                                            filteredExpenses.length
                                        ).toLocaleString()
                                        : 0}{" "}
                                    جنيه
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Modal>
    );
}