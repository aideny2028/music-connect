'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/language-context';

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', username: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t.auth.register.error);
      setLoading(false);
      return;
    }
    await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <p className="font-serif-heading text-xl font-bold text-white tracking-tight mb-1">Music Connect</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.register.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.register.name}</Label>
            <Input id="name" value={form.name} onChange={set('name')} required placeholder="Jane Smith" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.register.username}</Label>
            <Input id="username" value={form.username} onChange={set('username')} required placeholder="janesmith" pattern="[a-zA-Z0-9_]+" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.register.email}</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.register.password}</Label>
            <Input id="password" type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="••••••••" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.register.role}</Label>
            <select
              id="role"
              value={form.role}
              onChange={set('role')}
              className="w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/40"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
            >
              <option value="student">{t.auth.register.roleStudent}</option>
              <option value="teacher">{t.auth.register.roleTeacher}</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full h-10 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? t.common.loading : t.auth.register.btn}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          {t.auth.register.hasAccount}{' '}
          <Link href="/login" className="text-white hover:opacity-80 font-medium underline underline-offset-2 transition-opacity">
            {t.auth.register.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
