"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useTheme } from "next-themes";
import { useMemo } from "react";

export function MUITheme({ children }: { children: React.ReactNode }) {
  const { theme: mode } = useTheme();

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode === "dark" ? "dark" : "light",
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
