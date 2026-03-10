"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

export function ThemeToggle() {
    const { setTheme, theme, mounted } = useTheme();

    // If not mounted, show a static placeholder that looks EXACTLY like the button
    // This prevents layout shifts and flickering during hydration
    if (!mounted) {
        return (
            <div className="relative h-10 w-20 rounded-full bg-[#5856D6] p-1 shadow-inner opacity-100 flex items-center">
                <div className="flex w-full h-full items-center justify-between px-2 relative z-10">
                    <Sun className="h-4 w-4 text-white/50" />
                    <Moon className="h-4 w-4 text-brand" />
                </div>
                {/* Default to dark mode position for placeholder to match server render usually */}
                <div className="absolute top-1 left-1 h-8 w-8 rounded-full bg-white shadow-sm translate-x-10" />
            </div>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative h-10 w-20 rounded-full bg-[#5856D6] p-1 shadow-inner hover:opacity-90 transition-opacity flex items-center"
            aria-label="Toggle Theme"
        >
            <div className="flex w-full h-full items-center justify-between px-2 relative z-10">
                <Sun
                    className={`h-4 w-4 transition-colors duration-200 ${theme === "light" ? "text-[#5856D6]" : "text-white/60"
                        }`}
                />
                <Moon
                    className={`h-4 w-4 transition-colors duration-200 ${theme === "dark" ? "text-[#5856D6]" : "text-white/60"
                        }`}
                />
            </div>

            <div
                className={`absolute top-1 left-1 h-8 w-8 rounded-full bg-white shadow-sm transition-transform duration-300 ease-spring ${theme === "dark" ? "translate-x-10" : "translate-x-0"
                    }`}
            />
        </button>
    );
}
