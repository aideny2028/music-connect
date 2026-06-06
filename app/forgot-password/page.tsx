'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate async — no real email in demo mode
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="font-serif-heading text-xl font-bold text-white tracking-tight mb-1">
            Music Connect
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Reset your password
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <p className="text-white text-sm mb-6">
              If an account exists with that email, a password reset link has been sent.
            </p>
            <Link href="/login" className="text-sm text-white hover:opacity-80 underline underline-offset-2 transition-opacity">
              Back to login →
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-10"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-10 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
              Remember your password?{' '}
              <Link href="/login" className="text-white hover:opacity-80 font-medium underline underline-offset-2 transition-opacity">
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
