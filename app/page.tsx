'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ListingCard } from '@/components/listing-card';
import { GridSkeleton } from '@/components/skeleton-card';
import { useLanguage } from '@/lib/language-context';
import { ListingWithUser } from '@/lib/types';
import { Search, Music } from 'lucide-react';

const INSTRUMENT_ICONS: Record<string, string> = {
  Piano: '🎹', Guitar: '🎸', Violin: '🎻', Drums: '🥁', Voice: '🎤', Flute: '🪈',
  Bass: '🎸', Saxophone: '🎷', Cello: '🎻', Ukulele: '🪕', Other: '🎵',
};

export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [featuredListings, setFeaturedListings] = useState<ListingWithUser[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [platformStats, setPlatformStats] = useState({ teachers: 0, students: 0, avgRating: 5.0, listings: 0 });

  useEffect(() => {
    fetch('/api/listings?limit=6')
      .then(r => r.json())
      .then(d => { setFeaturedListings(d.listings ?? []); setLoadingListings(false); }).catch(() => setLoadingListings(false));

    // Fetch real platform statistics from the database
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setPlatformStats(d))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div>
      {/* ── Hero — search is the entire point ──────────────────────────── */}
      <section className="px-4 pt-28 pb-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-serif-heading text-5xl sm:text-7xl font-bold text-white leading-[1.08] mb-4 tracking-tight">
            Learn music from<br />
            <span className="italic text-[#B84050]">Hong Kong&apos;s finest.</span>
          </h1>
          <p className="text-sm sm:text-base mb-10 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            {t.home.hero.subtitle}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.home.hero.searchPlaceholder}
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/60 transition-all h-12" style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
              />
            </div>
            <button type="submit" className="bg-[#B84050] hover:bg-[#CC5060] text-white px-6 rounded-xl h-12 text-sm font-semibold shrink-0 transition-colors duration-200">
              {t.home.hero.searchBtn}
            </button>
          </form>
          {/* Trust line — real numbers, no vanity cards */}
          {platformStats.teachers > 0 && (
            <p className="mt-5 text-xs tracking-wide section-label">
              {platformStats.teachers} teachers · {platformStats.students} students · {platformStats.avgRating.toFixed(1)} avg rating
            </p>
          )}
        </div>
      </section>

      {/* ── Featured listings ──────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-label">{t.home.featured.title}</h2>
            <Link href="/search" className="text-xs text-white/60 hover:text-white transition-colors">
              {t.home.featured.viewAll} →
            </Link>
          </div>
          {loadingListings ? (
            <GridSkeleton count={6} />
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredListings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="text-center py-16 border border-white/10 rounded-2xl">
              <Music className="h-8 w-8 mx-auto mb-3 text-white/15" />
              <p className="text-white/40 text-sm">No listings yet. <Link href="/dashboard/listings/new" className="underline underline-offset-2 hover:opacity-80">Create one.</Link></p>
            </div>
          )}
        </div>
      </section>

      {/* ── Browse by instrument ───────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="section-label mb-6">Browse by Instrument</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Object.entries(INSTRUMENT_ICONS).map(([inst, emoji]) => (
              <Link key={inst} href={`/search?instrument=${encodeURIComponent(inst)}`}
                className="group flex flex-col items-center gap-2 py-5 px-2 rounded-xl border border-white/10 hover:border-[var(--accent)]/30 hover:bg-[var(--accent-dim)] transition-all duration-200">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200 leading-none">{emoji}</span>
                <span className="text-xs text-center leading-tight instrument-label">{inst}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — no container, just a line ────────────────────────────── */}
      <section className="px-4 pb-24 text-center">
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{t.home.cta.subtitle}</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-[#B84050] hover:bg-[#CC5060] text-white px-7 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200">
          {t.home.cta.btn}
        </Link>
      </section>
    </div>
  );
}
