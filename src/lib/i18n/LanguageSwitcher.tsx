"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
      <button
        onClick={() => setLocale("fr")}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          locale === "fr"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          locale === "en"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}
