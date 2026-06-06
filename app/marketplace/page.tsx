'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Search, SlidersHorizontal, MapPin, Music, X, Tag } from 'lucide-react';

const CATEGORIES = ['guitar', 'piano', 'drums', 'violin', 'bass', 'woodwind', 'brass', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  guitar: 'Guitar', piano: 'Piano', drums: 'Drums', violin: 'Violin',
  bass: 'Bass', woodwind: 'Woodwind', brass: 'Brass', other: 'Other',
};
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor',
};
const DISTRICTS = [
  'Central', 'Wan Chai', 'Causeway Bay', 'Mong Kok', 'Tsim Sha Tsui',
  'Yau Ma Tei', 'Sham Shui Po', 'Kwun Tong', 'Sha Tin', 'Tuen Mun', 'Tai Po', 'Online',
];

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

interface InstrumentItem {
  id: number;
  title: string;
  price: number;
  is_negotiable: number;
  condition: string;
  category: string;
  location_district: string | null;
  images: string | null;
  seller_name: string;
  seller_username: string;
  seller_avatar: string | null;
  created_at: string;
}

function InstrumentCard({ item }: { item: InstrumentItem }) {
  return (
    <Link href={`/marketplace/${item.id}`} className="block group">
      <div className="glass rounded-xl border border-white/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative h-44 bg-white/14 flex items-center justify-center">
          {item.images ? (
            <img src={item.images} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <Music className="h-12 w-12 text-white/65" />
          )}
          <span className={cn('absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full', conditionBadgeClass(item.condition))}>
            {CONDITION_LABELS[item.condition] ?? item.condition}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:opacity-80 transition-opacity">
            {item.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xl">HK${item.price.toLocaleString()}</span>
            {item.is_negotiable === 1 && (
              <span className="text-xs bg-emerald-900/40 text-emerald-300 ring-1 ring-inset ring-emerald-500/20 px-1.5 py-0.5 rounded font-medium">Negotiable</span>
            )}
          </div>
          {item.location_district && (
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <MapPin className="h-3 w-3" />
              <span>{item.location_district}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/18">
            <Avatar className="h-5 w-5">
              <AvatarImage src={item.seller_avatar ?? ''} />
              <AvatarFallback className="bg-[#B84050] text-white text-[10px]">
                {item.seller_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-white/70 truncate">{item.seller_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-xl border border-white/20 overflow-hidden animate-pulse">
      <div className="h-44 bg-white/12" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/12 rounded w-3/4" />
        <div className="h-6 bg-white/12 rounded w-1/2" />
        <div className="h-3 bg-white/12 rounded w-1/3" />
      </div>
    </div>
  );
}

interface Filters {
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  sort: string;
}

function FilterPanel({
  filters, setFilters, onReset,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onReset: () => void;
}) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFilters({ ...filters, [key]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Filters</h3>
        <button onClick={onReset} className="text-xs text-white/70 hover:text-white hover:underline transition-colors">Reset all</button>
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <select value={filters.category} onChange={set('category')} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Condition</Label>
        <select value={filters.condition} onChange={set('condition')} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">All Conditions</option>
          {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Price Range (HK$)</Label>
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" value={filters.minPrice} onChange={set('minPrice')} className="h-9 text-sm" />
          <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={set('maxPrice')} className="h-9 text-sm" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <select value={filters.location} onChange={set('location')} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">All Locations</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
  );
}

const DEFAULT_FILTERS: Filters = { category: '', condition: '', minPrice: '', maxPrice: '', location: '', sort: 'newest' };

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<InstrumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get('category') ?? '',
    condition: searchParams.get('condition') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    location: searchParams.get('location') ?? '',
    sort: searchParams.get('sort') ?? 'newest',
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.category) params.set('category', filters.category);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.location) params.set('location', filters.location);
    params.set('sort', filters.sort);

    try {
      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
  };

  return (
    <>
      <title>Marketplace | Music Connect</title>
      <div className="min-h-screen bg-transparent">
        {/* Header */}
        <div className="py-10 px-4 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-1 text-white">Instrument Marketplace</h1>
            <p className="text-sm mb-6 text-white/70">Buy and sell musical instruments in Hong Kong</p>
            <div className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                <input
                  placeholder="Search instruments..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchItems()}
                  className="w-full h-10 pl-9 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/60"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
                />
              </div>
              <button onClick={fetchItems} className="btn-primary h-10 px-5 rounded-lg text-sm font-semibold">
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="glass rounded-xl border border-white/20 p-4 sticky top-24">
                <FilterPanel filters={filters} setFilters={setFilters} onReset={handleReset} />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">
                    {loading ? 'Loading...' : `${total} listing${total !== 1 ? 's' : ''} found`}
                  </span>
                  <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                    <SheetTrigger className="lg:hidden">
                      <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex items-center gap-1.5')}>
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                      </span>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <FilterPanel filters={filters} setFilters={(f) => { setFilters(f); }} onReset={handleReset} />
                        <Button className="w-full mt-4 btn-primary" onClick={() => setMobileFilterOpen(false)}>
                          Apply Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-white/80 whitespace-nowrap">Sort by</Label>
                  <select
                    value={filters.sort}
                    onChange={e => setFilters({ ...filters, sort: e.target.value })}
                    className="h-8 rounded-md border border-input glass px-2 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                  </select>
                  <Link
                    href="/dashboard/marketplace/new"
                    className={cn(buttonVariants({ size: 'sm' }), 'border-0')}
                  >
                    + List Instrument
                  </Link>
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-20">
                  <Music className="h-16 w-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white/80 mb-2">No instruments found</h3>
                  <p className="text-white/65 mb-6">Try adjusting your filters or search terms.</p>
                  <button onClick={handleReset} className={cn(buttonVariants({ variant: 'outline' }))}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(item => <InstrumentCard key={item.id} item={item} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-4">
        <div className="skeleton h-40 rounded-xl mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
