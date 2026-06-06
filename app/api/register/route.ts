/**
 * API route for new user registration.
 * POST: Create a new user account after validating uniqueness and hashing the password.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isEmailTaken, isUsernameTaken, createUser, upsertTeacherProfile } from '@/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, username, role } = await req.json();

    // Validate all required registration fields
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    if (!['teacher', 'student'].includes(role)) return NextResponse.json({ error: 'Role must be teacher or student' }, { status: 400 });

    // Check for duplicate email or username before inserting
    if (isEmailTaken(email)) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    if (isUsernameTaken(username)) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
    }

    // Hash the password with bcrypt before storing
    const passwordHash = await bcrypt.hash(password, 12);
    const newUserId = createUser({ name: name.trim(), email: email.trim().toLowerCase(), password_hash: passwordHash, username: username.trim().toLowerCase(), role });

    // Create an empty teacher profile row so the dashboard edit form works immediately
    if (role === 'teacher') {
      upsertTeacherProfile(newUserId, { lesson_format: 'in_person' });
    }

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
