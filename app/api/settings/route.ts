/**
 * API route for user settings.
 * POST with action='language': Update language preference.
 * POST with action='password': Change password after verifying current password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getUserById, updateUserProfile, updateUserPassword } from '@/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUserId = (currentUser.user as any).id;
    const { action, language_pref, currentPassword, newPassword } = await req.json();

    if (action === 'language') {
      if (!['en', 'zh-hk'].includes(language_pref)) {
        return NextResponse.json({ error: 'Invalid language selection' }, { status: 400 });
      }
      // UPDATE the user's stored language preference
      updateUserProfile(currentUserId, { language_pref });
      return NextResponse.json({ success: true });
    }

    if (action === 'password') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      // Fetch user to verify current password before allowing change
      const userRecord = getUserById(currentUserId);
      const passwordMatches = await bcrypt.compare(currentPassword, userRecord.password_hash);
      if (!passwordMatches) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      updateUserPassword(currentUserId, newPasswordHash);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
