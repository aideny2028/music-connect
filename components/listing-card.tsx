'use client';

/**
 * components/listing-card.tsx — Listing summary card for grids.
 *
 * Displays instrument, type, title, teacher name, location, format,
 * and relative post time. Used in the homepage featured grid, search
 * results, and profile pages. Clicking navigates to the listing detail page.
 */

import Link from 'next/link';
import { ListingWithUser } from '@/lib/types';
import { useLanguage } from '@/lib/language-context';
import { useTimeAgo } from '@/lib/utils';

interface Props {
  listing: ListingWithUser;
}

export function ListingCard({ listing }: Props) {
  const { t } = useLanguage();
  const timePosted = useTimeAgo(listing.created_at);

  const rate = !listing.rate
    ? t.listing.contactForRates
    : `HK$${listing.rate}${listing.rate_unit === 'hour' ? '/hr' : listing.rate_unit === '30min' ? '/30m' : ''}`;

  const format = listing.lesson_format === 'in_person' ? 'In-person'
    : listing.lesson_format === 'online' ? 'Online' : 'Both';

  const location = listing.location_district || 'Online';
  const isOffering = listing.type === 'offering_lessons';

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group flex flex-col h-full rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:border-[#B84050]/40 hover:-translate-y-0.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Instrument + type */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
            {listing.instrument} · {isOffering ? 'Offering' : 'Seeking'}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{rate}</span>
        </div>
        {/* Title — main content */}
        <h3 className="text-base font-semibold text-white line-clamp-2 leading-snug mb-1">{listing.title}</h3>
        {/* Teacher name — second most important element */}
        <p className="text-sm font-medium mb-auto" style={{ color: 'var(--text)' }}>{listing.user_name}</p>
        {/* Footer */}
        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{location} · {format}</span>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{timePosted}</span>
        </div>
      </div>
    </Link>
  );
}
