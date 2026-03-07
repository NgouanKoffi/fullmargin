"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    mounted: boolean;
};

const initialState: ThemeProviderState = {
    theme: "dark",
    setTheme: () => null,
    mounted: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "dark",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Recover theme from local storage
        try {
            const stored = localStorage.getItem("theme");
            if (stored === "light" || stored === "dark") {
                setTheme(stored);
            } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                setTheme("dark");
            }
        } catch (e) {
            console.error("Failed to recover theme", e);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        try {
            const root = window.document.documentElement;
            if (theme === "dark") {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
            localStorage.setItem("theme", theme);
        } catch (e) {
            // Ignore errors in environments without DOM
        }
    }, [theme, mounted]);

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme, mounted }}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
