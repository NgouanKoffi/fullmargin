import React from "react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import FadeIn from "./FadeIn";
import logoHeader from "../../assets/fmmetrix/logo_header_v2.png";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                <FadeIn delay={0} className="flex items-center">
                    <div className="relative w-40 h-16">
                        <Image
                            src={logoHeader}
                            alt="Full Metrix Logo"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <ThemeToggle />
                </FadeIn>
            </div>
        </header>
    );
}
