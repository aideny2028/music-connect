/**
 * API route for the authenticated user's own profile.
 * GET: Fetch the current user's profile and teacher info for the edit form.
 * PATCH: Update profile fields and teacher profile if applicable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, getTeacherProfile, updateUserProfile, upsertTeacherProfile } from '@/lib/queries';

export async function GET() {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (currentUser.user as any).id;
    const userRecord = getUserById(userId);
    if (!userRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const teacherProfile = userRecord.role === 'teacher' ? getTeacherProfile(userId) : null;
    // Exclude password_hash from the response for security
    const { password_hash: _omitted, ...safeUserData } = userRecord;
    return NextResponse.json({ user: safeUserData, teacherProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (currentUser.user as any).id;
    const body = await req.json();

    // Update the base user fields
    updateUserProfile(userId, body);

    // Update teacher profile if provided
    if (body.teacherProfile) {
      upsertTeacherProfile(userId, {
        ...body.teacherProfile,
        hourly_rate: body.teacherProfile.hourly_rate ? Number(body.teacherProfile.hourly_rate) : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
