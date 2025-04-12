"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystem = async () => {
      try {
        // 1. التحقق من وجود مستخدمين في النظام
        const response = await fetch("/api/auth/check-users");
        const data = await response.json();
        
        if (!data.hasUsers) {
          // إذا لم يكن هناك مستخدمين، توجيه المستخدم إلى صفحة الإعداد
          router.push("/setup");
        } else {
          // 2. إذا كان هناك مستخدمين، التحقق مما إذا كان المستخدم مسجل دخوله
          const userData = localStorage.getItem("userData");
          
          if (userData) {
            // إذا كان المستخدم مسجل دخوله، قم بالتوجيه إلى لوحة التحكم
            router.push("/dashboard");
          } else {
            // إذا لم يكن المستخدم مسجل دخوله، قم بالتوجيه إلى صفحة تسجيل الدخول
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Error checking system:", error);
        // في حالة الخطأ، توجيه المستخدم إلى صفحة تسجيل الدخول
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSystem();
  }, [router]);

  // صفحة تحميل بسيطة أثناء التحقق والتوجيه
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">جاري التحميل...</h2>
      </div>
    </div>
  );
}
