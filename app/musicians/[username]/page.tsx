'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/language-context';
import { MapPin, Music, MessageSquare, ChevronLeft } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = () => {
    fetch(`/api/users/${username}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, [username]);

  useEffect(() => {
    if (data?.user?.name) document.title = `${data.user.name}'s Profile · Music Connect`;
    return () => { document.title = 'Music Connect'; };
  }, [data?.user?.name]);

  const handleContact = async () => {
    if (!session?.user) { router.push('/login'); return; }
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: data.user.id }),
    });
    const d = await res.json();
    if (d.threadId) router.push(`/dashboard/messages/${d.threadId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-white/12 rounded" />
          <div className="h-4 bg-white/12 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-white/70">User not found.</p>
        <Link href="/search" className="text-sm mt-2 inline-block text-white/70 hover:text-white transition-colors">← Back to Search</Link>
      </div>
    );
  }

  const { user, teacherProfile, listings } = data;
  const isOwnProfile = (session?.user as any)?.username === username;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/search" className="flex items-center gap-1 text-white/70 hover:text-white hover:underline text-sm mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" /> {t.common.back}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="space-y-4">
            <div className="glass rounded-xl border border-white/20 p-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarImage src={user.avatar_url ?? ''} />
                <AvatarFallback className="bg-[#B84050] text-white text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <p className="text-sm text-white/70 mb-2">@{user.username}</p>
              <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'} className={user.role === 'teacher' ? 'bg-[#B84050]' : ''}>
                {user.role === 'teacher' ? 'Teacher' : 'Student'}
              </Badge>

              {user.location_district && (
                <div className="flex items-center justify-center gap-1 text-sm text-white/70 mt-3">
                  <MapPin className="h-3.5 w-3.5" /> {user.location_district}
                </div>
              )}

              {user.instruments && (
                <div className="flex items-center justify-center gap-1 text-sm text-white/70 mt-1">
                  <Music className="h-3.5 w-3.5" /> {user.instruments}
                </div>
              )}

              <p className="text-xs text-white/65 mt-2">{t.profile.memberSince} {new Date(user.created_at).getFullYear()}</p>

              {!isOwnProfile && (
                <Button className="w-full mt-4 btn-primary" onClick={handleContact}>
                  <MessageSquare className="h-4 w-4 mr-2" /> {t.profile.contactBtn}
                </Button>
              )}
              {isOwnProfile && (
                <Link href="/dashboard/profile" className={cn(buttonVariants({ variant: 'outline' }), 'w-full mt-4 justify-center')}>
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="glass rounded-xl border border-white/20 p-5">
                <h3 className="section-label mb-2">About</h3>
                <p className="text-sm text-white/80 leading-relaxed">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Main content — active listings only, no reviews */}
          <div className="lg:col-span-2">
            <h2 className="section-label mb-4">{t.profile.listings} ({listings.length})</h2>
            {listings.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {listings.map((l: any) => (
                  <Link key={l.id} href={`/listings/${l.id}`} className="flex items-center justify-between py-3 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white group-hover:opacity-80 transition-opacity truncate">{l.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {l.instrument} · {l.location_district || 'Online'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0 ml-4" style={{ color: l.rate ? 'var(--text)' : 'var(--text-faint)' }}>
                      {l.rate ? `HK$${l.rate}/hr` : 'Contact for rates'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-white/50 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm">{t.profile.noListings}</p>
                {!isOwnProfile && (
                  <button onClick={handleContact} className="text-sm text-white/70 hover:text-white hover:underline mt-2 transition-colors">
                    Message this teacher →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
