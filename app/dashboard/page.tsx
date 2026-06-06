'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { TeacherScheduleWidget } from '@/components/teacher-schedule';
import { FileText, MessageSquare, Plus, User, ChevronRight, AlertCircle } from 'lucide-react';

function ProfileCompletionBar({ profile, role }: { profile: any; role: string }) {
  const fields = [
    { key: 'bio', label: 'bio' },
    { key: 'location_district', label: 'location' },
    { key: 'instruments', label: 'instruments' },
    { key: 'avatar_url', label: 'profile photo' },
  ];
  const filled = fields.filter(f => profile?.[f.key]);
  const pct = Math.round((filled.length / fields.length) * 100);
  const missing = fields.filter(f => !profile?.[f.key]).map(f => f.label);

  if (pct === 100) return null;

  return (
    <div className="glass rounded-xl p-4 mb-6 border border-[#B84050]/25">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#CC5060] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white/90">
            Your profile is {pct}% complete
          </p>
          <p className="text-xs text-white/55 mt-0.5">
            Add your {missing.join(', ')} to improve visibility.
          </p>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B84050] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link
          href="/dashboard/profile"
          className="btn-primary text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
        >
          Complete
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ listings: 0, unread: 0 });
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [fetchError, setFetchError] = useState(false);
  const user = session?.user as any;

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch('/api/messages/unread-count').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
      fetch(`/api/users/${user.username}`).then(r => r.json()),
    ]).then(([unreadData, profileData, publicData]) => {
      setProfile(profileData.user);
      setStats({
        listings: (publicData.listings ?? []).length,
        unread: unreadData.count ?? 0,
      });
      setRecentListings((publicData.listings ?? []).slice(0, 3));
    }).catch(() => setFetchError(true));
  }, [user?.id, user?.username]);

  const statCards = [
    { icon: FileText, label: t.dashboard.stats.listings, value: stats.listings, href: '/dashboard/listings', color: 'text-[#CC5060]', bg: 'bg-[#B84050]/10' },
    { icon: MessageSquare, label: t.dashboard.stats.unread, value: stats.unread, href: '/dashboard/messages', color: 'text-red-400', bg: 'bg-red-900/20' },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {t.dashboard.welcome}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/70 text-sm mt-1">Here's what's happening with your account.</p>
        </div>

        {profile && user?.role === 'teacher' && <ProfileCompletionBar profile={profile} role={user?.role} />}

        {user?.role === 'teacher' && recentListings.length === 0 && profile && (
          <div className="rounded-xl p-5 mb-6 border-l-4 border-l-[var(--accent)]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold text-white mb-1">Welcome to Music Connect</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Create your first listing so students can find you.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard/listings/new" className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold">
                Create a Listing
              </Link>
              <Link href="/dashboard/profile" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        {fetchError && (
          <div className="text-sm text-white/60 mb-4 flex items-center gap-2">
            <span>Couldn't load your stats.</span>
            <button
              onClick={() => { setFetchError(false); /* re-trigger */ window.location.reload(); }}
              className="text-white/70 hover:text-white hover:underline transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats — flat row, no card borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 pb-8" style={{ borderBottom: "1px solid var(--border)" }}>
          {statCards.map(({ icon: Icon, label, value, href, color }) => (
            <Link key={label} href={href} className="group flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Icon className={`h-5 w-5 ${color} shrink-0`} />
              <div>
                <div className="text-2xl font-bold text-white leading-none">{value}</div>
                <div className="text-xs text-white/55 mt-0.5 group-hover:text-white/80 transition-colors">{label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link href="/dashboard/listings/new" className={cn(buttonVariants(), 'h-10 justify-center')}>
            <Plus className="h-4 w-4 mr-2" /> {t.dashboard.createListing}
          </Link>
          <Link href={`/musicians/${user?.username}`} className={cn(buttonVariants({ variant: 'outline' }), 'h-10 justify-center')}>
            <User className="h-4 w-4 mr-2" /> {t.dashboard.viewProfile}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent listings — section with divider, not a card */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label">{t.dashboard.recentListings}</h2>
              <Link href="/dashboard/listings" className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div>
              {recentListings.length > 0 ? (
                <div className="space-y-2">
                  {recentListings.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 p-3 bg-transparent rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-white truncate">{l.title}</p>
                        <p className="text-xs text-white/70">{l.instrument} · {l.location_district || 'Online'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={l.status === 'active' ? 'bg-emerald-900/40 text-emerald-300 ring-1 ring-inset ring-emerald-500/20 border-0 text-xs' : l.status === 'paused' ? 'bg-amber-900/40 text-amber-300 ring-1 ring-inset ring-amber-500/20 border-0 text-xs' : 'bg-white/10 text-white/60 ring-1 ring-inset ring-white/10 border-0 text-xs'} variant="outline">
                          {l.status}
                        </Badge>
                        <Link href={`/dashboard/listings/${l.id}/edit`} className="text-white/70 hover:text-white text-xs hover:underline transition-colors">Edit</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/65">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.dashboard.noListings}</p>
                  <Link href="/dashboard/listings/new" className={cn(buttonVariants({ variant: 'link' }), 'mt-1 text-white/70 hover:text-white text-sm transition-colors')}>
                    {t.dashboard.createListing}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Teacher schedule widget */}
          {user?.role === 'teacher' && user?.id && (
            <TeacherScheduleWidget userId={String(user.id)} />
          )}

          {/* Student: find a teacher prompt */}
          {user?.role === 'student' && (
            <div className="glass rounded-xl p-5 border" style={{ borderColor: 'var(--border)' }}>
              <h2 className="section-label mb-3">Find Your Next Teacher</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Browse teachers by instrument, location, and price.</p>
              <Link href="/search" className="btn-primary inline-block px-4 py-2 rounded-lg text-sm font-semibold text-center">
                Browse Teachers
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
