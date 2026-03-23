"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building, Users, CreditCard, PieChart, Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const { dict } = useLanguage();

  const navItems = [
    { name: dict.common.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: dict.common.properties, href: "/dashboard/properties", icon: Building },
    { name: dict.common.tenants, href: "/dashboard/tenants", icon: Users },
    { name: dict.common.payments, href: "/dashboard/payments", icon: CreditCard },
    { name: dict.common.expenses, href: "/dashboard/expenses", icon: PieChart },
    { name: dict.common.reports, href: "/dashboard/reports", icon: LayoutDashboard },
    { name: dict.common.settings, href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r h-full overflow-y-auto">
      <div className="flex items-center justify-center h-16 border-b">
        <span className="text-2xl font-bold text-blue-600 tracking-tight">RentFlow</span>
      </div>
      <div className="flex flex-col flex-1 py-6">
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
