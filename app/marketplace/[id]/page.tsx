'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowLeft, MapPin, Music, Tag, Edit, CheckCircle } from 'lucide-react';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor',
};
const CATEGORY_LABELS: Record<string, string> = {
  guitar: 'Guitar', piano: 'Piano', drums: 'Drums', violin: 'Violin',
  bass: 'Bass', woodwind: 'Woodwind', brass: 'Brass', other: 'Other',
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

interface Item {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  condition: string;
  price: number;
  is_negotiable: number;
  location_district: string | null;
  images: string | null;
  status: string;
  seller_name: string;
  seller_username: string;
  seller_avatar: string | null;
  seller_bio: string | null;
  created_at: string;
}

export default function MarketplaceItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);

  useEffect(() => {
    fetch(`/api/marketplace/${id}`)
      .then(r => r.json())
      .then(d => { setItem(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleContactSeller = async () => {
    if (!session?.user) { router.push('/login'); return; }
    setContacting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: item?.seller_id }),
      });
      const data = await res.json();
      if (data.threadId) {
        router.push(`/dashboard/messages?thread=${data.threadId}`);
      } else {
        router.push('/dashboard/messages');
      }
    } catch {
      setContacting(false);
    }
  };

  const handleMarkSold = async () => {
    if (!confirm('Mark this listing as sold?')) return;
    setMarkingSold(true);
    try {
      await fetch(`/api/marketplace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold' }),
      });
      router.push('/dashboard/marketplace');
    } catch {
      setMarkingSold(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="skeleton h-5 w-32 rounded mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-80 rounded-xl" />
            <div className="skeleton h-48 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-40 rounded-xl" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4">
        <Music className="h-16 w-16 text-white/50" />
        <p className="text-white/70">Listing not found.</p>
        <Link href="/marketplace" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user && String(user.id) === String(item.seller_id);

  return (
    <>
      <title>{item.title} | Music Connect Marketplace</title>
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Image */}
              <div className="w-full h-72 sm:h-96 bg-white/14 rounded-xl flex items-center justify-center overflow-hidden">
                {item.images ? (
                  <img src={item.images} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white/65">
                    <Music className="h-20 w-20" />
                    <span className="text-sm">No image provided</span>
                  </div>
                )}
              </div>

              {/* Details card */}
              <div className="glass rounded-xl border border-white/20 p-6 space-y-5">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h1 className="text-xl font-semibold leading-snug">{item.title}</h1>
                    {item.status === 'sold' && (
                      <span className="shrink-0 bg-white/12 text-white/80 text-xs font-semibold px-2 py-1 rounded">SOLD</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-white">HK${item.price.toLocaleString()}</span>
                    {item.is_negotiable === 1 && (
                      <span className="bg-emerald-900/40 text-emerald-300 ring-1 ring-inset ring-emerald-500/20 text-sm font-medium px-2 py-0.5 rounded">Negotiable</span>
                    )}
                    <span className={cn('text-sm font-medium px-2 py-0.5 rounded', conditionBadgeClass(item.condition))}>
                      {CONDITION_LABELS[item.condition] ?? item.condition}
                    </span>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-white/70 mb-1">Category</div>
                    <div className="text-sm font-semibold text-white">{CATEGORY_LABELS[item.category] ?? item.category}</div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-white/70 mb-1">Brand</div>
                    <div className="text-sm font-semibold text-white">{item.brand || 'Not listed'}</div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-white/70 mb-1">Condition</div>
                    <div className="text-sm font-semibold text-white">{CONDITION_LABELS[item.condition] ?? item.condition}</div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-white/70 mb-1">Location</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1">
                      {item.location_district ? (
                        <>
                          <MapPin className="h-3.5 w-3.5 text-white/65" />
                          {item.location_district}
                        </>
                      ) : 'Not specified'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="font-semibold text-white mb-2">Description</h2>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Seller card */}
              <div className="glass rounded-xl border border-white/20 p-5">
                <h2 className="font-semibold text-white mb-4">Seller</h2>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.seller_avatar ?? ''} />
                    <AvatarFallback className="bg-[#B84050] text-white">
                      {item.seller_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white">{item.seller_name}</div>
                    {item.seller_bio && (
                      <div className="text-xs text-white/70 mt-0.5 line-clamp-2">{item.seller_bio}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {!isOwner && item.status !== 'sold' && (
                    <Button
                      onClick={handleContactSeller}
                      disabled={contacting}
                      className="w-full btn-primary"
                    >
                      {contacting ? 'Opening chat...' : 'Contact Seller'}
                    </Button>
                  )}
                  <Link
                    href={`/musicians/${item.seller_username}`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Owner actions */}
              {isOwner && (
                <div className="glass rounded-xl border border-white/20 p-5 space-y-2">
                  <h2 className="font-semibold text-white mb-3">Manage Listing</h2>
                  <Link
                    href={`/dashboard/marketplace/${id}/edit`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center flex items-center gap-2')}
                  >
                    <Edit className="h-4 w-4" /> Edit Listing
                  </Link>
                  {item.status === 'active' && (
                    <Button
                      onClick={handleMarkSold}
                      disabled={markingSold}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {markingSold ? 'Updating...' : 'Mark as Sold'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
