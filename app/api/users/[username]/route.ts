/**
 * app/api/users/[username]/route.ts — Public user profile API.
 *
 * GET /api/users/[username] — Returns the public profile for a user by username,
 *                             including their teacher profile (if applicable),
 *                             active listings, received reviews, and average rating.
 *                             Returns 404 if the username does not exist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, getTeacherProfile, getActiveListingsByUser, getReviewsForUser } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const userProfile = getUserByUsername(username);

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch teacher-specific profile data if applicable
    const teacherProfile = userProfile.role === 'teacher' ? getTeacherProfile(userProfile.id) : null;
    // Get only active listings for the public-facing profile
    const activeListings = getActiveListingsByUser(userProfile.id);
    // Get all reviews with computed average rating
    const { reviewList, averageRating } = getReviewsForUser(userProfile.id);

    return NextResponse.json({ user: userProfile, teacherProfile, listings: activeListings, reviews: reviewList, avgRating: averageRating });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
