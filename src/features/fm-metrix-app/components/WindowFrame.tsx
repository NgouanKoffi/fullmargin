import React from "react";

export default function WindowFrame({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/20 dark:shadow-black/50 ${className}`}
        >
            {/* Window Header */}
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800/80 backdrop-blur-sm flex items-center px-4 space-x-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
            </div>
            {/* Content */}
            <div className="relative w-full h-full bg-zinc-50 dark:bg-zinc-950">
                {children}
            </div>

            {/* Glare/Reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        </div>
    );
}
