'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { useLanguage } from '@/lib/language-context';
import { Plus, Pencil, Pause, Play, Trash2, Music } from 'lucide-react';

export default function MyListingsPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const user = session?.user as any;

  const load = () => {
    if (!user?.username) return;
    fetch(`/api/users/${user.username}`)
      .then(r => r.json())
      .then(d => {
        setListings(d.listings ?? []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setLoadError(true); });
  };

  useEffect(() => { load(); }, [user?.username]);

  const handleStatus = async (id: number, status: string) => {
    await fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.listingsPage.confirmDelete)) return;
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    load();
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-900/40 text-emerald-300 ring-1 ring-inset ring-emerald-500/20 border-0';
    if (s === 'paused') return 'bg-amber-900/40 text-amber-300 ring-1 ring-inset ring-amber-500/20 border-0';
    return 'bg-white/10 text-white/60 ring-1 ring-inset ring-white/10 border-0';
  };

  if (loading) return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-3">
        <div className="skeleton h-8 w-48 rounded mb-6" />
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t.listingsPage.title}</h1>
          <Link href="/dashboard/listings/new" className={cn(buttonVariants(), 'btn-primary')}>
            <Plus className="h-4 w-4 mr-2" /> {t.listingsPage.createNew}
          </Link>
        </div>

        {loadError && (
          <div className="text-center py-8 text-white/50">
            <p className="text-sm">Couldn't load listings.</p>
            <button onClick={() => { setLoadError(false); load(); }} className="text-sm text-white/70 hover:text-white hover:underline mt-1 transition-colors">Try again</button>
          </div>
        )}

        {listings.length === 0 ? (
          <div className="text-center py-16 glass rounded-xl border border-white/20">
            <Music className="h-12 w-12 mx-auto mb-3 text-white/50" />
            <p className="text-white/70 mb-4">{t.listingsPage.noListings}</p>
            <Link href="/dashboard/listings/new" className={cn(buttonVariants(), 'btn-primary')}>
              <Plus className="h-4 w-4 mr-2" /> {t.listingsPage.createNew}
            </Link>
          </div>
        ) : (
          <div className="divide-y-0">
            {listings.map(l => (
              <div key={l.id} className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0">
                
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-sm truncate">{l.title}</h3>
                      <Badge className={statusColor(l.status)} variant="outline">
                        {t.listingsPage.status[l.status as keyof typeof t.listingsPage.status] || l.status}
                      </Badge>
                      {l.view_count > 0 && (
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {l.view_count} views
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70">{l.instrument} · {l.location_district || 'Online'} · {l.rate ? `HK$${l.rate}/hr` : 'Contact for rates'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/dashboard/listings/${l.id}/edit`} title={t.listingsPage.actions.edit} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {l.status === 'active' ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[#B84050]" onClick={() => handleStatus(l.id, 'paused')} title={t.listingsPage.actions.pause}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : l.status === 'paused' ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400" onClick={() => handleStatus(l.id, 'active')} title={t.listingsPage.actions.resume}>
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(l.id)} title={t.listingsPage.actions.delete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
