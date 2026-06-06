import type { Metadata } from 'next';
import { DM_Sans, Lora } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/header';

// Lora — elegant, balanced serif for headings; less dramatic than Playfair (SIL OFL)
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap', weight: ['400', '500', '600', '700'] });
// DM Sans — clean, refined modern sans-serif for body text (SIL OFL)
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Music Connect: Find Music Teachers in Hong Kong',
  description: 'Connect with professional music teachers for piano, guitar, violin, drums, voice, and more in Hong Kong.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${lora.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/8 py-10 mt-auto">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text)' }}>
                    Music Connect
                  </span>
                </div>
                <nav className="flex gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <a href="/search" className="hover:opacity-100 transition-opacity">Find Teachers</a>
                  <a href="/register" className="hover:opacity-100 transition-opacity">Join</a>
                </nav>
                <nav className="flex gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <a href="#" className="hover:opacity-100 transition-opacity">About</a>
                  <a href="#" className="hover:opacity-100 transition-opacity">Help</a>
                  <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
                  <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
                </nav>
              </div>
              <div className="border-t pt-4 text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>
                <p className="text-xs">© 2024 Music Connect. Connecting musicians and students across Hong Kong.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
