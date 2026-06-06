/**
 * app/api/reviews/route.ts — Review submission API.
 *
 * POST /api/reviews — Inserts a 1–5 star review from the authenticated user
 *                     for a teacher profile. Enforces the one-review-per-pair
 *                     constraint via the UNIQUE(reviewer_id, reviewee_id) index.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createReview } from '@/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { revieweeId, listingId, rating, comment } = await req.json();
    const reviewerId = (currentUser.user as any).id;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars' }, { status: 400 });
    }

    const outcome = createReview(reviewerId, revieweeId, Number(rating), comment, listingId || null);
    if (outcome === 'self_review') return NextResponse.json({ error: 'You cannot review yourself' }, { status: 400 });
    if (outcome === 'duplicate') return NextResponse.json({ error: 'You have already reviewed this teacher' }, { status: 409 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
