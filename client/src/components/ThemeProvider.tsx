import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { preferencesAPI } from "@/lib/api";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  primaryColor: string;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = "#1e40af";

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY_COLOR);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    preferencesAPI.get()
      .then((prefs) => {
        if (prefs.theme) setThemeState(prefs.theme as Theme);
        if (prefs.primaryColor) setPrimaryColorState(prefs.primaryColor);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const hsl = hexToHSL(primaryColor);
    root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  }, [primaryColor]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const token = localStorage.getItem("auth_token");
    if (token) {
      preferencesAPI.update({ theme: newTheme }).catch(() => {});
    }
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    setPrimaryColorState(color);
    const token = localStorage.getItem("auth_token");
    if (token) {
      preferencesAPI.update({ primaryColor: color }).catch(() => {});
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, setTheme, setPrimaryColor, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
