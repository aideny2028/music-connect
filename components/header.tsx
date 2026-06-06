'use client';

// Main navigation bar. Different layout for logged-in vs logged-out users.

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu, Music, MessageSquare, User, LayoutDashboard,
  LogOut, FileText, Plus, Sun, Moon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    const fetchUnreadCount = () => {
      fetch('/api/messages/unread-count')
        .then(r => r.json())
        .then(d => setUnreadMessageCount(d.count ?? 0))
        .catch(() => {});
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const currentUser = session?.user as any;
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium transition-all duration-200 py-1 px-1',
        isActive(href)
          ? 'text-white border-b-2 border-[#B84050]'
          : 'text-white/80 hover:text-white'
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-white/18 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-[#B84050] flex items-center justify-center shadow-[0_0_12px_rgba(184,64,80,0.5)] group-hover:shadow-[0_0_20px_rgba(184,64,80,0.7)] transition-all duration-300">
            <Music className="h-4 w-4 text-white" />
          </div>
          <span className="font-serif-heading font-bold text-white text-lg hidden sm:block">
            Music Connect
          </span>
          <span className="font-serif-heading font-bold text-white text-lg sm:hidden">MC</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-5 flex-1 ml-4">
          <NavLink href="/search" label={t.nav.search} />
        </nav>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'zh-hk' : 'en')}
            className="text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/20 rounded-md px-2.5 py-1 transition-all duration-200 glass"
          >
            {locale === 'en' ? '繁中' : 'EN'}
          </button>

          {/* dark/light toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-md border border-white/20 hover:border-white/30 glass transition-all duration-200 text-white/70 hover:text-white"
          >
            {theme === 'dark'
              ? <Sun className="h-3.5 w-3.5" />
              : <Moon className="h-3.5 w-3.5" />}
          </button>

          {session?.user ? (
            <>
              {/* create listing button */}
              <Link
                href="/dashboard/listings/new"
                className="btn-primary flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" /> {t.nav.createListing}
              </Link>

              {/* messages icon with unread count */}
              <Link href="/dashboard/messages" className="relative p-1.5 rounded-lg hover:bg-white/14 transition-colors">
                <MessageSquare className="h-5 w-5 text-white/80 hover:text-white transition-colors" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[9px] bg-[#B84050] text-white rounded-full font-bold shadow-[0_0_8px_rgba(184,64,80,0.6)]">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    <span className="sr-only">{unreadMessageCount} unread messages</span>
                  </span>
                )}
              </Link>

              {/* avatar dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-[#B84050]/40 transition-all duration-200">
                    <AvatarImage src={currentUser?.image ?? ''} />
                    <AvatarFallback className="bg-[#B84050] text-white text-sm font-semibold">
                      {currentUser?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 glass border border-white/20">
                  <div className="px-3 py-2.5 border-b border-white/20">
                    <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
                    <p className="text-xs text-white/65 capitalize">{currentUser?.role}</p>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white mt-1">
                    <LayoutDashboard className="h-4 w-4" /> {t.nav.dashboard}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/musicians/${currentUser?.username}`)} className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                    <User className="h-4 w-4" /> {t.nav.profile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/listings')} className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                    <FileText className="h-4 w-4" /> {t.nav.myListings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="text-red-400 flex items-center gap-2 cursor-pointer hover:text-red-300"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4" /> {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors px-2 py-1">
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm font-semibold px-3 py-1.5 rounded-lg"
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setLocale(locale === 'en' ? 'zh-hk' : 'en')}
            className="text-xs font-medium text-white/70 border border-white/20 rounded px-2 py-1"
          >
            {locale === 'en' ? '繁中' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded border border-white/20 text-white/70 hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          {session?.user && (
            <Link href="/dashboard/messages" className="relative p-1">
              <MessageSquare className="h-5 w-5 text-white/80" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[9px] bg-[#B84050] text-white rounded-full font-bold">
                  {unreadMessageCount}
                </span>
              )}
            </Link>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger>
              <span className="p-2 rounded-lg hover:bg-white/14 transition-colors inline-flex">
                <Menu className="h-5 w-5 text-white/70" />
              </span>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 glass-dark border-l">
              <div className="flex flex-col gap-1 mt-6">
                {/* theme toggle in the mobile menu */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors mb-1"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === 'dark' ? t.nav.switchToLight : t.nav.switchToDark}
                </button>
                <div className="h-px bg-white/10 mb-1" />
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2 mb-1">Browse</p>
                {[
                  { href: '/search', label: t.nav.search },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                    className={cn('px-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(href) ? 'bg-[#B84050]/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}>
                    {label}
                  </Link>
                ))}

                {session?.user ? (
                  <>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2 mt-4 mb-1">My Account</p>
                    {[
                      { href: '/dashboard', label: t.nav.dashboard },
                      { href: '/dashboard/listings', label: t.nav.myListings },
                      { href: `/musicians/${(session.user as any).username}`, label: t.nav.profile },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                        className="px-2 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                        {label}
                      </Link>
                    ))}
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                      <Link href="/dashboard/listings/new" onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[#B84050] shadow-[0_0_16px_rgba(184,64,80,0.4)]">
                        <Plus className="h-3.5 w-3.5" /> {t.nav.createListing}
                      </Link>
                      <button className="w-full px-2 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 text-left transition-colors"
                        onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}>
                        {t.nav.logout}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                    <Link href="/login" onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-2.5 rounded-lg text-sm font-medium text-white/70 border border-white/20 hover:bg-white/10">
                      {t.nav.login}
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-[#B84050] shadow-[0_0_16px_rgba(184,64,80,0.4)]">
                      {t.nav.register}
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
