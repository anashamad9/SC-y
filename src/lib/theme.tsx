import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_LOGOS: Record<Theme, string> = {
  dark: "/dark.png",
  light: "/light.png",
};

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("ccx-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  updateThemeIcons(theme);
}

function updateThemeIcons(theme: Theme) {
  const href = THEME_LOGOS[theme];
  const rels = ["icon", "shortcut icon", "apple-touch-icon"];

  for (const rel of rels) {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`));
    if (links.length === 0) {
      const link = document.createElement("link");
      link.rel = rel;
      links.push(link);
      document.head.appendChild(link);
    }
    for (const link of links) {
      link.href = href;
      link.type = "image/png";
      link.removeAttribute("media");
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("ccx-theme", nextTheme);
      applyTheme(nextTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
