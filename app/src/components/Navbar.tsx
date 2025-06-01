"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiImage, FiRotateCcw, FiMonitor } from "react-icons/fi";

export default function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { href: "/gallery", label: "Gallery", icon: <FiImage /> },
        { href: "/", label: "Home", icon: <FiHome /> },
        { href: "/current", label: "Manage", icon: <FiMonitor /> },
        { href: "/rotate", label: "Auto", icon: <FiRotateCcw /> },
    ];

    return (
        <nav className="w-full sticky top-0 z-[10001] rounded-lg bg-gray-200 dark:bg-gray-900 border-t md:border-t-0 md:border-b border-gray-300 dark:border-gray-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
            <div className="w-full flex justify-center">
                <div className="max-w-6xl flex w-full justify-center gap-8 py-2 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition
                                ${pathname === item.href
                                    ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}