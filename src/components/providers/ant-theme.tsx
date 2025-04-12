"use client";

import { ConfigProvider, theme } from "antd";
import { useTheme } from "next-themes";
import arEG from "antd/locale/ar_EG";
import { useEffect, useState } from "react";

export function AntTheme({ children }: { children: React.ReactNode }) {
  const { theme: mode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // تأكد من أن الكود يعمل فقط على العميل بعد الـ Hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // تقديم Theme افتراضي على السيرفر
    return (
      <ConfigProvider
        direction="rtl"
        locale={arEG}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            fontFamily: "Alexandria, Cairo, sans-serif",
          },
        }}
      >
        {children}
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      direction="rtl"
      locale={arEG}
      theme={{
        algorithm:
          mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: "Alexandria, Cairo, sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}