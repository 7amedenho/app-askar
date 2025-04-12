"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Alexandria } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/sections/Navbar";
import { AntTheme } from "@/components/providers/ant-theme";
import { MUITheme } from "@/components/providers/mui-theme";
import ToastProvider from "@/components/providers/ToastProvider";
import Providers from "@/components/providers/providers";
import { AppSidebar } from "@/components/sections/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const alexandria = Alexandria({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-alexandria",
  fallback: ["Cairo", "sans-serif"],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من وجود بيانات المستخدم في localStorage
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem("userData");
        if (!userData) {
          router.push("/login");
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // إظهار شاشة تحميل أثناء التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // لن يتم عرض هذا لأنه سيتم توجيه المستخدم إلى صفحة تسجيل الدخول
  }

  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`flex min-h-screen ${alexandria.className}`}
        suppressHydrationWarning
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AntTheme>
              <MUITheme>
                <SidebarProvider>
                  <div className="flex flex-1">
                    <div className="md:flex">
                      <AppSidebar />
                    </div>
                    <div className="flex-1 flex flex-col w-full">
                      <Navbar />
                      <main className="flex-1">
                        <ToastProvider />
                        {children}
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </MUITheme>
            </AntTheme>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
