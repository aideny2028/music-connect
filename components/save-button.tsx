'use client';

/**
 * components/save-button.tsx — Bookmark/save button for listings.
 *
 * Shows a heart icon that toggles the saved state of a listing for the
 * current user. Only renders when the user is logged in. Calls the
 * /api/saved-listings endpoint to persist changes.
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';

interface Props {
  listingId: number;
}

export function SaveButton({ listingId }: Props) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    // Fetch whether this listing is already saved
    fetch('/api/saved-listings')
      .then(r => r.json())
      .then(d => setSaved((d.savedIds ?? []).includes(listingId)))
      .catch(() => {});
  }, [listingId, session]);

  if (!session?.user) return null;

  const toggle = async () => {
    setLoading(true);
    const method = saved ? 'DELETE' : 'POST';
    await fetch('/api/saved-listings', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    });
    setSaved(!saved);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from saved' : 'Save this listing'}
      className="p-2 rounded-lg transition-colors disabled:opacity-50"
      style={{ color: saved ? 'var(--accent)' : 'var(--text-faint)' }}
    >
      <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
    </button>
  );
}
