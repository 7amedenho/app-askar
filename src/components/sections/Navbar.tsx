"use client"; // ✅ تأكيد أن Navbar يعمل فقط على المتصفح

import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { LuRefreshCcw } from "react-icons/lu";
import { ModeToggle } from "@/components/providers/toggleTheme";
import { SidebarTrigger } from "../ui/sidebar";
import { useRouter } from "next/navigation";
import { Dropdown, Menu, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // جلب بيانات المستخدم من localStorage
  useEffect(() => {
    const getUserData = () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setUserData(user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    getUserData();

    // مستمع لتحديثات localStorage
    window.addEventListener("storage", getUserData);

    return () => {
      window.removeEventListener("storage", getUserData);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    router.push("/login");
  };

  const handleProfileSettings = () => {
    router.push("/dashboard/Settings");
  };

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "الإعدادات الشخصية",
      onClick: handleProfileSettings,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "تسجيل الخروج",
      onClick: handleLogout,
    },
  ];

  if (!mounted) return null; // ✅ لا تعرض أي شيء حتى يتم تحميل الصفحة

  return (
    <nav className="shadow-md py-2 sm:px-6 px-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 dark:text-white">
      <div className="flex flex-col gap-1 py-1">
        <h3 className="text-sm font-bold">مرحبا بك, {userData?.name || "مستخدم"}</h3>
        <p className="text-gray-600 text-sm dark:text-gray-400">{userData?.role || ""}</p>
      </div>
      <div className="flex items-center space-x-2">
        <SidebarTrigger />
        <ModeToggle />
        <Button
          type="default"
          className="flex items-center gap-2 text-black dark:text-white border-gray-300 dark:border-gray-600"
        >
          <span className="max-sm:hidden">Refresh</span>
          <LuRefreshCcw />
        </Button>
        <Dropdown
          overlay={<Menu items={menuItems} />}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button type="text" className="flex items-center p-0">
            <Avatar icon={<UserOutlined />} />
          </Button>
        </Dropdown>
      </div>
    </nav>
  );
}
