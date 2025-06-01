"use client";
import { FiHome, FiImage, FiRotateCcw, FiMonitor } from "react-icons/fi";

type ViewType = 'home' | 'gallery' | 'current' | 'rotate';

interface NavbarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
}

export default function Navbar({ currentView, setCurrentView }: NavbarProps) {
    const navItems = [
        { view: 'gallery' as ViewType, label: "Gallery", icon: <FiImage /> },
        { view: 'home' as ViewType, label: "Home", icon: <FiHome /> },
        { view: 'current' as ViewType, label: "Manage", icon: <FiMonitor /> },
        { view: 'rotate' as ViewType, label: "Auto", icon: <FiRotateCcw /> },
    ];

    return (
        <nav className="w-full sticky top-0 z-[10001] rounded-lg bg-gray-200 dark:bg-gray-900 border-t md:border-t-0 md:border-b border-gray-300 dark:border-gray-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
            <div className="w-full flex justify-center">
                <div className="max-w-6xl flex w-full justify-center gap-8 py-2 px-2">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition
                ${currentView === item.view
                                    ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}