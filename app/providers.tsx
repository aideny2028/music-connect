'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/lib/language-context';
import { ThemeProvider } from '@/lib/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
