import { ThemeProvider } from "@/components/providers/theme-provider";
import { Alexandria } from "next/font/google";
import "./globals.css";
import { AntTheme } from "@/components/providers/ant-theme";
import { MUITheme } from "@/components/providers/mui-theme";
import ToastProvider from "@/components/providers/ToastProvider";
import Providers from "../components/providers/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

// تعريف الخط
const alexandria = Alexandria({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-alexandria",
  fallback: ["Cairo", "sans-serif"],
});

const inter = Inter({ subsets: ["latin"] });

// تعريف نوع Props لـ RootLayout
interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "نظام إدارة البناء",
  description: "نظام متكامل لإدارة مشاريع البناء والعمال والمصروفات",
};

// تعريف الـ RootLayout كـ Function Component مع TypeScript
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`flex min-h-screen ${alexandria.className} ${inter.className}`}
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AntTheme>
              <MUITheme>
                <div className="flex flex-1">
                  <div className="flex-1 flex flex-col">
                    <main className="flex-1">
                      <ToastProvider />
                      {children}
                    </main>
                  </div>
                </div>
              </MUITheme>
            </AntTheme>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
