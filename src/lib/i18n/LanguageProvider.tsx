"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import Cookies from "js-cookie";

type LanguageContextType = {
  locale: "en" | "fr";
  setLocale: (locale: "en" | "fr") => void;
  dict: any;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
  initialDict,
}: {
  children: ReactNode;
  initialLocale: "en" | "fr";
  initialDict: any;
}) {
  const [locale, setLocaleState] = useState<"en" | "fr">(initialLocale);

  const setLocale = (newLocale: "en" | "fr") => {
    Cookies.set("NEXT_LOCALE", newLocale, { expires: 365, path: "/" });
    setLocaleState(newLocale);
    window.location.reload(); // Reload to fetch the new dictionary from the server
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict: initialDict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
