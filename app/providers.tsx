"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        {children}
      </LocaleProvider>
    </SessionProvider>
  );
} 