"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Menu } from "lucide-react";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const { dict } = useLanguage();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b shadow-sm z-10">
      <div className="flex items-center">
        <button className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
          <Menu size={24} />
        </button>
        <span className="ml-4 md:hidden text-xl font-bold text-blue-600">RentFlow</span>
      </div>
      <div className="flex items-center space-x-6">
        <LanguageSwitcher />
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
            <User size={18} />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-gray-800">{session?.user?.name || 'Administrator'}</span>
            <span className="text-xs text-gray-500">{session?.user?.email}</span>
          </div>
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
          title={dict.common.logout}
        >
          <LogOut size={20} />
          <span className="hidden sm:block ml-2">{dict.common.logout}</span>
        </button>
      </div>
    </header>
  );
}
