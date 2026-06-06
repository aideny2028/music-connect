'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/language-context';
import type { Locale } from '@/lib/i18n';

export default function SettingsPage() {
  const { t, locale, setLocale } = useLanguage();
  const [langSaved, setLangSaved] = useState(false);
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handleLangSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'language', language_pref: locale }),
    });
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');

    if (pw.new !== pw.confirm) {
      setPwError(t.settings.passwordMismatch);
      return;
    }
    if (pw.new.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }

    setPwSaving(true);
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'password', currentPassword: pw.current, newPassword: pw.new }),
    });
    setPwSaving(false);

    if (res.ok) {
      setPwMsg(t.settings.passwordChanged);
      setPw({ current: '', new: '', confirm: '' });
    } else {
      const data = await res.json();
      setPwError(data.error || t.common.error);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold text-white">{t.settings.title}</h1>

        {/* Language — flat section */}
        <div className="pb-8 border-b border-white/10">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{t.settings.language}</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              {(['en', 'zh-hk'] as Locale[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    locale === l
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-transparent border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {l === 'en' ? t.settings.languageEn : t.settings.languageZh}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleLangSave} className="btn-crimson px-4 py-2 rounded-xl text-sm font-semibold">
                {t.settings.save}
              </button>
              {langSaved && <span className="text-white/80 text-sm">{t.settings.saved}</span>}
            </div>
          </div>
        </div>

        {/* Password — flat section */}
        <div className="pb-8">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{t.settings.changePassword}</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>{t.settings.currentPassword}</Label>
              <Input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} required placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.settings.newPassword}</Label>
              <Input type="password" value={pw.new} onChange={e => setPw(p => ({ ...p, new: e.target.value }))} required placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.settings.confirmPassword}</Label>
              <Input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required placeholder="••••••••" />
            </div>
            {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
            {pwMsg && <p className="text-white/80 text-sm">{pwMsg}</p>}
            <button type="submit" className="btn-crimson px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" disabled={pwSaving}>
              {pwSaving ? t.common.loading : t.settings.save}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
