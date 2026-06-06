'use client';

/**
 * Listing detail page.
 * Handles four states:
 *   1. Loading skeleton while data is being fetched
 *   2. Not found — listing ID does not exist in the database
 *   3. Deleted — listing exists but has been removed
 *   4. Paused — listing exists but is temporarily inactive (shown with a notice)
 *   5. Active — normal full listing display
 */

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/lib/language-context';
import { ListingCard } from '@/components/listing-card';
import { MapPin, Music, Clock, DollarSign, BookOpen, ChevronLeft, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { SaveButton } from '@/components/save-button';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();

  const [listing, setListing] = useState<any>(null);
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  // notFound = true means the API returned 404 (no such listing)
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    if (listing?.title) document.title = `${listing.title} · Music Connect`;
    return () => { document.title = 'Music Connect'; };
  }, [listing?.title]);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => {
        if (r.status === 404) {
          // Mark as not found so we can render the correct error state
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then(d => {
        if (d) {
          setListing(d);
          // Fetch similar listings by the same instrument (excluding this one)
          if (d.instrument) {
            fetch(`/api/listings?instrument=${encodeURIComponent(d.instrument)}&limit=4`)
              .then(r => r.json())
              .then(sd => setSimilarListings((sd.listings ?? []).filter((l: any) => String(l.id) !== String(d.id)).slice(0, 3)))
              .catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => {
        // On network error treat as not found
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  // Contact the listing owner — opens / creates a message thread then redirects
  const handleContact = async () => {
    if (!session?.user) { router.push('/login'); return; }
    setContacting(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: listing.user_id, listingId: listing.id }),
    });
    const data = await res.json();
    setContacting(false);
    if (data.threadId) {
      setContactSent(true);
      setTimeout(() => router.push(`/dashboard/messages/${data.threadId}`), 800);
    }
  };

  // Format the displayed rate string from raw listing data
  const formatRate = () => {
    if (!listing?.rate) return t.listing.contactForRates;
    const unit = listing.rate_unit === 'hour' ? t.listing.perHour
      : listing.rate_unit === '30min' ? t.listing.per30min
      : t.listing.package;
    return `HK$${listing.rate}${unit}`;
  };

  const formatFormat = (f: string) => {
    if (f === 'in_person') return t.listing.inPerson;
    if (f === 'online') return t.listing.online;
    return t.listing.both;
  };

  const formatLevel = (l: string) => {
    if (l === 'beginner') return t.listing.beginner;
    if (l === 'intermediate') return t.listing.intermediate;
    return t.listing.advanced;
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/12 rounded w-1/2" />
          <div className="h-4 bg-white/12 rounded w-1/3" />
          <div className="h-32 bg-white/12 rounded" />
          <div className="h-4 bg-white/12 rounded w-2/3" />
          <div className="h-4 bg-white/12 rounded w-1/2" />
        </div>
      </div>
    );
  }

  // ── Not found state ───────────────────────────────────────────────────────────
  if (notFound || !listing) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-xl font-semibold text-white mb-2">Listing not found.</p>
        <p className="text-muted mb-6">This listing does not exist or may have been removed.</p>
        <Link href="/search" className={cn(buttonVariants({ variant: 'default' }), 'btn-primary')}>
          {t.listing.backToSearch}
        </Link>
      </div>
    );
  }

  // ── Deleted state ─────────────────────────────────────────────────────────────
  if (listing.status === 'deleted') {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-xl font-semibold text-white mb-2">This listing is no longer available.</p>
        <p className="text-muted mb-6">The listing has been removed by its owner.</p>
        <Link href="/search" className={cn(buttonVariants({ variant: 'default' }), 'btn-primary')}>
          {t.listing.backToSearch}
        </Link>
      </div>
    );
  }

  const isOwner = session?.user && String((session.user as any).id) === String(listing.user_id);

  // Contact button label depends on whether this is a teacher or student listing
  const contactButtonLabel = contactSent
    ? 'Message sent'
    : contacting
    ? 'Sending...'
    : listing.type === 'offering_lessons'
    ? t.listing.contactBtn       // "Contact Teacher"
    : t.listing.contactStudentBtn; // "Contact Student"

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back navigation */}
        <Link href="/search" className="flex items-center gap-1 text-white/70 hover:text-white hover:underline text-sm mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" /> {t.listing.backToSearch}
        </Link>

        {/* Paused notice — shown above the listing content when status = paused */}
        {listing.status === 'paused' && (
          <div className="flex items-center gap-2 bg-amber-900/30 text-amber-200 ring-1 ring-inset ring-amber-500/20 text-sm p-3 rounded-xl mb-6" role="status">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>This listing is currently paused and not accepting new enquiries.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass rounded-xl border border-white/20 p-6">
              {/* Listing type badge and rate */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <Badge
                  className={listing.type === 'offering_lessons' ? 'bg-[#B84050] text-white' : ''}
                  variant={listing.type === 'offering_lessons' ? 'default' : 'secondary'}
                >
                  {listing.type === 'offering_lessons' ? t.listing.offering : t.listing.looking}
                </Badge>
                {listing.rate && (
                  <span className="text-white font-bold text-xl">{formatRate()}</span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">{listing.title}</h1>

              {/* Key metadata grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Music className="h-4 w-4 text-[#CC5060]" />
                  <div>
                    <div className="text-xs text-white/65">{t.listing.instrument}</div>
                    <div className="font-medium">{listing.instrument}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <MapPin className="h-4 w-4 text-[#CC5060]" />
                  <div>
                    <div className="text-xs text-white/65">{t.listing.location}</div>
                    <div className="font-medium">{listing.location_district || t.listing.online}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="h-4 w-4 text-[#CC5060]" />
                  <div>
                    <div className="text-xs text-white/65">{t.listing.format}</div>
                    <div className="font-medium">{formatFormat(listing.lesson_format)}</div>
                  </div>
                </div>
                {listing.student_level && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <BookOpen className="h-4 w-4 text-[#CC5060]" />
                    <div>
                      <div className="text-xs text-white/65">{t.listing.level}</div>
                      <div className="font-medium">{formatLevel(listing.student_level)}</div>
                    </div>
                  </div>
                )}
                {/* Only show rate cell if rate is missing (otherwise it's in the header) */}
                {!listing.rate && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <DollarSign className="h-4 w-4 text-[#CC5060]" />
                    <div>
                      <div className="text-xs text-white/65">{t.listing.rate}</div>
                      <div className="font-medium">{t.listing.contactForRates}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Full description */}
              <div>
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
                  {t.listing.description}
                </h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>

              {/* Teaching languages section */}
              {listing.teaching_languages && (
                <div className="mt-4 pt-4 border-t border-white/18">
                  <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
                    {t.listing.teachingLanguages}
                  </h2>
                  <p className="text-white/80">{listing.teaching_languages}</p>
                </div>
              )}

              {listing.view_count > 0 && (
                <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
                  Viewed {listing.view_count} {listing.view_count === 1 ? 'time' : 'times'}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar — poster info and action buttons */}
          <div className="space-y-4">
            <div className="glass rounded-xl border border-white/20 p-5">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                {t.listing.postedBy}
              </h3>

              {/* Poster avatar and name */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={listing.user_avatar_url ?? ''} />
                  <AvatarFallback className="bg-[#B84050] text-white">
                    {listing.user_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-white">{listing.user_name}</div>
                  {listing.user_location && (
                    <div className="text-xs text-white/70">{listing.user_location}</div>
                  )}
                </div>
              </div>

              {/* Short bio preview */}
              {listing.user_bio && (
                <p className="text-sm text-white/80 mb-4 line-clamp-3">{listing.user_bio}</p>
              )}

              <div className="space-y-2">
                {/* Contact button — hidden for the listing owner and for paused listings */}
                {!isOwner && listing.status === 'active' && (
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 btn-primary hidden lg:flex"
                      onClick={handleContact}
                      disabled={contacting || contactSent}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {contactButtonLabel}
                    </Button>
                    <SaveButton listingId={listing.id} />
                  </div>
                )}

                {/* View profile link — always visible */}
                <Link
                  href={`/musicians/${listing.user_username}`}
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
                >
                  <User className="h-4 w-4 mr-2" /> {t.listing.viewProfile}
                </Link>

                {/* Edit button — only for the listing owner */}
                {isOwner && (
                  <Link
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
                  >
                    Edit Listing
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similarListings.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4">
              More {listing.instrument} Listings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarListings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile contact button — only for non-owners on active listings */}
      {!isOwner && listing.status === 'active' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <Button
            className="w-full btn-primary h-11 rounded-lg font-semibold"
            onClick={handleContact}
            disabled={contacting || contactSent}
          >
            {contactButtonLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
