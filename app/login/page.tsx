'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/language-context';

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(t.auth.login.error);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Logo mark */}
        <div className="text-center mb-10">
          <p className="font-serif-heading text-xl font-bold text-white tracking-tight mb-1">
            Music Connect
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {t.auth.login.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {t.auth.login.password}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-10"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">
              Forgot your password?
            </Link>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-10 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {loading ? t.common.loading : t.auth.login.btn}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          {t.auth.login.noAccount}{' '}
          <Link href="/register" className="text-white hover:opacity-80 font-medium underline underline-offset-2 transition-opacity">
            {t.auth.login.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
