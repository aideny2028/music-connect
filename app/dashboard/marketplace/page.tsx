'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Music, Plus, Edit, Trash2, CheckCircle, PauseCircle, PlayCircle } from 'lucide-react';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor',
};

function conditionBadgeClass(condition: string) {
  switch (condition) {
    case 'new':      return 'bg-emerald-900/40 text-emerald-300 ring-1 ring-inset ring-emerald-500/20';
    case 'like_new': return 'bg-emerald-900/30 text-emerald-300 ring-1 ring-inset ring-emerald-500/20';
    case 'good':     return 'bg-sky-900/40 text-sky-300 ring-1 ring-inset ring-sky-500/20';
    case 'fair':     return 'bg-amber-900/40 text-amber-300 ring-1 ring-inset ring-amber-500/20';
    case 'poor':     return 'bg-red-900/40 text-red-300 ring-1 ring-inset ring-red-500/20';
    default:         return 'bg-white/10 text-white/80 ring-1 ring-inset ring-white/10';
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-900/40 text-emerald-300 ring-1 ring-inset ring-emerald-500/20';
    case 'sold':   return 'bg-white/10 text-white/60 ring-1 ring-inset ring-white/10';
    case 'paused': return 'bg-amber-900/40 text-amber-300 ring-1 ring-inset ring-amber-500/20';
    default:       return 'bg-white/10 text-white/80 ring-1 ring-inset ring-white/10';
  }
}

interface Item {
  id: number;
  title: string;
  price: number;
  condition: string;
  status: string;
  category: string;
  created_at: string;
}

export default function DashboardMarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;
    const user = session?.user as any;
    fetch(`/api/marketplace?sellerId=${user.id}&limit=100`)
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session, status, router]);

  const handlePatch = async (id: number, body: object) => {
    await fetch(`/api/marketplace/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...(body as any) } : i));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    await fetch(`/api/marketplace/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Show all non-deleted items (active, paused, sold)
  const visibleItems = items.filter(i => i.status !== 'deleted');

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Instruments</h1>
          <Link
            href="/dashboard/marketplace/new"
            className={cn(buttonVariants(), 'flex items-center gap-2')}
          >
            <Plus className="h-4 w-4" /> List an Instrument
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-xl border border-white/20 p-4 animate-pulse">
                <div className="h-5 bg-white/12 rounded w-1/2 mb-2" />
                <div className="h-4 bg-white/12 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-20 glass rounded-xl border border-white/20">
            <Music className="h-16 w-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/80 mb-2">No listings yet</h3>
            <p className="text-white/65 mb-6">List an instrument to start selling on the marketplace.</p>
            <Link
              href="/dashboard/marketplace/new"
              className={cn(buttonVariants(), 'btn-primary')}
            >
              <Plus className="h-4 w-4 mr-2" /> List Your First Instrument
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map(item => (
              <div key={item.id} className="glass rounded-xl border border-white/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link href={`/marketplace/${item.id}`} className="font-semibold text-white hover:opacity-80 truncate transition-opacity">
                      {item.title}
                    </Link>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', statusBadgeClass(item.status))}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', conditionBadgeClass(item.condition))}>
                      {CONDITION_LABELS[item.condition] ?? item.condition}
                    </span>
                  </div>
                  <div className="text-white font-bold text-lg">HK${item.price.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Link
                    href={`/dashboard/marketplace/${item.id}/edit`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex items-center gap-1')}
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {item.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePatch(item.id, { status: 'paused' })}
                      className="flex items-center gap-1"
                    >
                      <PauseCircle className="h-3.5 w-3.5" /> Pause
                    </Button>
                  )}
                  {item.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePatch(item.id, { status: 'active' })}
                      className="flex items-center gap-1"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> Resume
                    </Button>
                  )}
                  {item.status === 'active' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                      onClick={() => handlePatch(item.id, { status: 'sold' })}
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Mark Sold
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
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
