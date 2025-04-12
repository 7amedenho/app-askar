// src/components/menu-items.ts
import {
  DollarSign,
  Users,
  Truck,
  Package,
  PaintRoller,
  HandCoins,
  HardHat,
  Settings,
  Clock,
  Wrench,
  Inbox,
  Shirt,
  Home,
  UserCog,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const items: MenuGroup[] = [
  {
    title: "لوحة التحكم",
    items: [{ title: "الصفحة الرئيسية", url: "/dashboard", icon: Home }],
  },
  {
    title: "الإدارة والموارد البشرية",
    items: [
      { title: "إدارة الموظفين", url: "/dashboard/Employees", icon: Users },
      { title: "الحضور والانصراف", url: "/dashboard/Attendance", icon: Clock },
    ],
  },
  {
    title: "الشؤون المالية",
    items: [
      { title: "المصروفات", url: "/dashboard/Expenses", icon: HandCoins },
      { title: "الرواتب والسلف", url: "/dashboard/Payroll", icon: DollarSign },
      { title: "العهد المالية", url: "/dashboard/Custody", icon: Package },
    ],
  },
  {
    title: "إدارة المشاريع",
    items: [
      { title: "إدارة المشاريع", url: "/dashboard/Projects", icon: HardHat },
    ],
  },
  {
    title: "المخزون والمشتريات",
    items: [
      { title: "إدارة الموردين", url: "/dashboard/Suppliers", icon: Truck },
      {
        title: "إدارة المستهلكات",
        url: "/dashboard/Consumables",
        icon: Package,
      },
      { title: "إدارة المهمات", url: "/dashboard/Tasks", icon: Shirt },
    ],
  },
  {
    title: "الأصول والمعدات",
    items: [
      { title: "إدارة المعدات", url: "/dashboard/Equipment", icon: PaintRoller },
      { title: "الصيانة والتكهين", url: "/dashboard/Maintenance", icon: Wrench },
    ],
  },
  {
    title: "إعدادات النظام",
    items: [
      { title: "الإعدادات", url: "/dashboard/Settings", icon: Settings },
      { title: "إدارة المستخدمين", url: "/dashboard/users", icon: UserCog },
    ],
  },
];
