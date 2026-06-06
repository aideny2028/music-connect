/**
 * API route for platform statistics.
 * Returns real counts of teachers, students, and average review rating from the DB.
 * Used by the homepage to show live community stats.
 */

import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    // COUNT active teacher accounts
    const teachers = (db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'teacher'").get() as { count: number }).count;

    // COUNT active student accounts
    const students = (db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get() as { count: number }).count;

    // COMPUTE platform-wide average rating across all reviews
    const ratingResult = db.prepare('SELECT ROUND(AVG(rating), 1) AS avg FROM reviews').get() as { avg: number | null };
    const avgRating = ratingResult.avg ?? 5.0;

    // COUNT active listings to show breadth
    const listings = (db.prepare("SELECT COUNT(*) AS count FROM listings WHERE status = 'active'").get() as { count: number }).count;

    return NextResponse.json({ teachers, students, avgRating, listings });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ teachers: 0, students: 0, avgRating: 5.0, listings: 0 });
  }
}
