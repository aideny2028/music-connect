'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/listing-card';
import { Heart } from 'lucide-react';

export default function SavedListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch saved listing IDs then fetch their full data
    fetch('/api/saved-listings')
      .then(r => r.json())
      .then(async d => {
        const savedIds: number[] = d.savedIds ?? [];
        if (savedIds.length === 0) { setLoading(false); return; }
        const listingData = await Promise.all(
          savedIds.map(id => fetch(`/api/listings/${id}`).then(r => r.json()))
        );
        setListings(listingData.filter(l => !l.error && l.status === 'active'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-white mb-8">Saved Listings</h1>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-10 w-10 mx-auto mb-4 opacity-20 text-white" />
            <p className="text-white text-sm mb-2">No saved listings yet.</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Browse listings and tap the heart icon to save them here.
            </p>
            <Link href="/search" className="text-sm text-white/70 hover:text-white hover:underline transition-colors">
              Browse listings →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
