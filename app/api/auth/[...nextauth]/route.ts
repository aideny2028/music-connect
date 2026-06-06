/**
 * app/api/auth/[...nextauth]/route.ts — NextAuth.js credentials provider.
 *
 * Configures NextAuth with an email/password credentials provider backed
 * by bcryptjs password hashing. The JWT callback attaches the user id,
 * username, and role to the token so they are available in server components
 * via getServerSession() without an extra database lookup.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
