'use client';

/**
 * Search/browse page for Music Connect.
 * Renders a filter panel (instrument, location, level, format, listing type, price range)
 * and a paginated grid of matching listings fetched from /api/listings.
 * The empty-state message is contextual — it mentions the active type filter if set.
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListingCard } from '@/components/listing-card';
import { useLanguage } from '@/lib/language-context';
import { ListingWithUser } from '@/lib/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Drums', 'Voice', 'Cello', 'Flute', 'Saxophone', 'Ukulele', 'Bass Guitar', 'Erhu', 'Other'];
const DISTRICTS = ['Central', 'Wan Chai', 'Causeway Bay', 'Mong Kok', 'Tsim Sha Tsui', 'Yau Ma Tei', 'Sham Shui Po', 'Kwun Tong', 'Sha Tin', 'Tuen Mun', 'Tai Po', 'Online'];

/**
 * FilterPanel renders all filter controls.
 * Includes the new Listing Type filter that maps to the `type` query parameter.
 */
function FilterPanel({
  filters, setFilters, onReset, t,
}: {
  filters: Record<string, string>;
  setFilters: (f: any) => void;
  onReset: () => void;
  t: any;
}) {
  const set = (key: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFilters({ ...filters, [key]: e.target.value });

  return (
    <div className="space-y-4">
      {/* Listing Type filter — maps to l.type in the database */}
      <div className="space-y-1.5">
        <Label>{t.search.filters.listingType}</Label>
        <select value={filters.type || ''} onChange={set('type')} className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/40" style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text)" }}>
          <option value="">All Types</option>
          <option value="offering_lessons">Offering Lessons</option>
          <option value="looking_for_teacher">Looking for Teacher</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>{t.search.filters.instrument}</Label>
        <select value={filters.instrument || ''} onChange={set('instrument')} className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/40" style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text)" }}>
          <option value="">{t.search.filters.allInstruments}</option>
          {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>{t.search.filters.location}</Label>
        <select value={filters.location || ''} onChange={set('location')} className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/40" style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text)" }}>
          <option value="">{t.search.filters.allLocations}</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>{t.search.filters.level}</Label>
        <select value={filters.level || ''} onChange={set('level')} className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/40" style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text)" }}>
          <option value="">{t.search.filters.allLevels}</option>
          <option value="beginner">{t.common.beginner}</option>
          <option value="intermediate">{t.common.intermediate}</option>
          <option value="advanced">{t.common.advanced}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>{t.search.filters.format}</Label>
        <select value={filters.format || ''} onChange={set('format')} className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/40" style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text)" }}>
          <option value="">{t.search.filters.allFormats}</option>
          <option value="in_person">{t.common.inPerson}</option>
          <option value="online">{t.common.online}</option>
          <option value="both">{t.common.both}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>{t.search.filters.priceMin}</Label>
          <Input type="number" value={filters.minPrice || ''} onChange={set('minPrice')} placeholder="0" min="0" />
        </div>
        <div className="space-y-1.5">
          <Label>{t.search.filters.priceMax}</Label>
          <Input type="number" value={filters.maxPrice || ''} onChange={set('maxPrice')} placeholder="1000" min="0" />
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onReset}>
        <X className="h-4 w-4 mr-2" /> {t.search.filters.reset}
      </Button>
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = use(searchParams);
  const { t } = useLanguage();
  const router = useRouter();

  const [query, setQuery] = useState(sp.q || '');
  const [sort, setSort] = useState(sp.sort || 'newest');
  const [filters, setFilters] = useState({
    type: sp.type || '',
    instrument: sp.instrument || '',
    location: sp.location || '',
    level: sp.level || '',
    format: sp.format || '',
    minPrice: sp.minPrice || '',
    maxPrice: sp.maxPrice || '',
  });

  const [listings, setListings] = useState<ListingWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Build URLSearchParams from current filter state for API calls and URL updates
  const buildParams = () => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (sort !== 'newest') p.set('sort', sort);
    if (filters.type) p.set('type', filters.type);
    if (filters.instrument) p.set('instrument', filters.instrument);
    if (filters.location) p.set('location', filters.location);
    if (filters.level) p.set('level', filters.level);
    if (filters.format) p.set('format', filters.format);
    if (filters.minPrice) p.set('minPrice', filters.minPrice);
    if (filters.maxPrice) p.set('maxPrice', filters.maxPrice);
    return p;
  };

  // Re-fetch listings whenever any filter or sort value changes
  useEffect(() => {
    setLoading(true);
    const p = buildParams();
    fetch(`/api/listings?${p.toString()}&limit=24`)
      .then(r => r.json())
      .then(d => {
        setListings(d.listings ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, sort, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = buildParams();
    router.push(`/search?${p.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    setFilters({ type: '', instrument: '', location: '', level: '', format: '', minPrice: '', maxPrice: '' });
    setQuery('');
  };

  // Build a contextual empty-state message depending on the active type filter
  const emptyStateMessage = filters.type
    ? `No ${filters.type === 'offering_lessons' ? 'offering lessons' : 'looking for teacher'} listings found.`
    : 'No listings match your filters. Try adjusting your search.';

  return (
    <div className="min-h-screen">
      {/* Search bar header */}
      <div className="border-b py-5 px-4" style={{ borderColor: "var(--border)" }}>
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.home.hero.searchPlaceholder}
              className="glass border border-white/20 text-white placeholder:text-white/40 h-11 focus:border-[#B84050]/50"
            />
            <Button type="submit" className="bg-[#B84050] hover:bg-[#CC5060] text-white font-semibold h-11 px-5 shrink-0">
              <Search className="h-4 w-4 mr-2" /> {t.home.hero.searchBtn}
            </Button>
          </form>
        </div>
      </div>

      {/* Quick filter chips — one-tap common filters */}
      <div className="relative border-b py-3 px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto max-w-6xl flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { label: 'Online Only',   key: 'format',   value: 'online'    },
            { label: 'In-Person',     key: 'format',   value: 'in_person' },
            { label: 'Beginner',      key: 'level',    value: 'beginner'  },
            { label: 'Under HK$500', key: 'maxPrice', value: '500'       },
          ].map(chip => {
            const active = (filters as any)[chip.key] === chip.value;
            return (
              <button
                key={chip.label}
                tabIndex={0}
                onClick={() => setFilters(f => ({ ...f, [chip.key]: active ? '' : chip.value }))}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  active
                    ? 'bg-[#B84050] border-[#B84050] text-white'
                    : 'border-white/20 text-white/60 hover:border-[#B84050]/50 hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        {/* fade hint that more chips exist */}
        <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, var(--bg))' }} />
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="p-5 sticky top-24 border rounded-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h3>
              <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} t={t} />
            </div>
          </aside>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm font-medium text-white">
                {loading ? 'Loading...' : `${total} ${total === 1 ? 'listing' : 'listings'} found`}
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter sheet */}
                <Sheet>
                  <SheetTrigger>
                    <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'lg:hidden')}>
                      <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                    </span>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} t={t} />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort selector */}
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="h-9 rounded-md border border-input glass px-3 text-sm"
                >
                  <option value="newest">{t.search.sort.newest}</option>
                  <option value="priceLow">{t.search.sort.priceLow}</option>
                  <option value="priceHigh">{t.search.sort.priceHigh}</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Loading skeleton grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-white/18" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            ) : (
              /* Empty state with contextual message */
              <div className="text-center py-16 text-white/65 glass rounded-xl border border-white/18">
                <Search className="h-10 w-10 mx-auto mb-3" />
                <p className="font-medium text-white">{emptyStateMessage}</p>
                <Button variant="link" className="mt-2 text-white/70 hover:text-white transition-colors" onClick={resetFilters}>
                  {t.search.filters.reset}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
