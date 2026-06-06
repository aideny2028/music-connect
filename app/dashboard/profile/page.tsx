'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/language-context';
import { InstrumentMultiAdd, InstrumentRow, rowsToString, stringToRows } from '@/components/instrument-multi-add';
import { CheckCircle2 } from 'lucide-react';

const DISTRICTS = [
  'Central','Wan Chai','Causeway Bay','Mong Kok','Tsim Sha Tsui',
  'Yau Ma Tei','Sham Shui Po','Kwun Tong','Sha Tin','Tuen Mun','Tai Po','Online',
];

const INPUT_CLASS = 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#B84050]/60 focus:ring-[#B84050]/30';
const SELECT_CLASS = 'w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#B84050]/60';
const TEXTAREA_CLASS = 'w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-[#B84050]/60 min-h-[90px] resize-none';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{title}</h2>
      <div className="space-y-5 pb-8 border-b border-white/10">{children}</div>
    </div>
  );
}

export default function EditProfilePage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [instrumentRows, setInstrumentRows] = useState<InstrumentRow[]>([]);
  const [profile, setProfile] = useState<any>({
    name: '', bio: '', location_district: '', experience_level: '', avatar_url: '',
  });
  const [tp, setTp] = useState<any>({
    hourly_rate: '', lesson_format: 'in_person', student_levels: '',
    qualifications: '', lesson_description: '', teaching_languages: '',
  });
  const currentUser = session?.user as any;

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile({
            name: data.user.name || '',
            bio: data.user.bio || '',
            location_district: data.user.location_district || '',
            experience_level: data.user.experience_level || '',
            avatar_url: data.user.avatar_url || '',
          });
          // Parse stored comma-separated instruments into structured rows
          setInstrumentRows(stringToRows(data.user.instruments || ''));
        }
        if (data.teacherProfile) {
          setTp({
            hourly_rate: data.teacherProfile.hourly_rate || '',
            lesson_format: data.teacherProfile.lesson_format || 'in_person',
            student_levels: data.teacherProfile.student_levels || '',
            qualifications: data.teacherProfile.qualifications || '',
            lesson_description: data.teacherProfile.lesson_description || '',
            teaching_languages: data.teacherProfile.teaching_languages || '',
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    // Convert structured rows back to stored format before saving
    const instrumentsString = rowsToString(instrumentRows);
    const body: any = { ...profile, instruments: instrumentsString };
    if (currentUser?.role === 'teacher') {
      body.teacherProfile = { ...tp, hourly_rate: tp.hourly_rate ? Number(tp.hourly_rate) : null };
    }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setSaveError('Save failed. Please try again.');
    }
  };

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProfile((p: any) => ({ ...p, [k]: e.target.value }));
  const setT = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setTp((p: any) => ({ ...p, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-2xl space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{t.profileEdit.title}</h1>
          <p className="text-white/65 text-sm mt-1">Keep your profile up to date to attract more students.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic info */}
          <SectionCard title="Basic Info">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.name}</Label>
              <Input value={profile.name} onChange={setP('name')} required className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.bio}</Label>
              <textarea
                value={profile.bio}
                onChange={setP('bio')}
                placeholder={t.profileEdit.bioPlaceholder}
                className={TEXTAREA_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">Avatar URL</Label>
              <Input
                value={profile.avatar_url}
                onChange={setP('avatar_url')}
                placeholder="https://example.com/photo.jpg"
                className={INPUT_CLASS}
              />
              {profile.avatar_url && (
                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={profile.avatar_url}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-full object-cover border"
                    style={{ borderColor: 'var(--border)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Preview</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.location}</Label>
                <select value={profile.location_district} onChange={setP('location_district')} className={SELECT_CLASS}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.experience}</Label>
                <select value={profile.experience_level} onChange={setP('experience_level')} className={SELECT_CLASS}>
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Instruments — structured multi-add */}
          <SectionCard title="My Instruments">
            <p className="text-xs text-white/65 -mt-2">Add each instrument you play with your experience level.</p>
            <InstrumentMultiAdd rows={instrumentRows} onChange={setInstrumentRows} />
          </SectionCard>

          {/* Teacher-only section */}
          {currentUser?.role === 'teacher' && (
            <SectionCard title={t.profileEdit.teacherSection}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.hourlyRate}</Label>
                  <Input type="number" value={tp.hourly_rate} onChange={setT('hourly_rate')} placeholder="400" min="0" className={INPUT_CLASS} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.lessonFormat}</Label>
                  <select value={tp.lesson_format} onChange={setT('lesson_format')} className={SELECT_CLASS}>
                    <option value="in_person">In-person</option>
                    <option value="online">Online</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.qualifications}</Label>
                <Input value={tp.qualifications} onChange={setT('qualifications')} placeholder="ABRSM Grade 8, BMus..." className={INPUT_CLASS} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.lessonDescription}</Label>
                <textarea value={tp.lesson_description} onChange={setT('lesson_description')} className={TEXTAREA_CLASS} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs uppercase tracking-wide">{t.profileEdit.teachingLanguages}</Label>
                <Input value={tp.teaching_languages} onChange={setT('teaching_languages')} placeholder="English, Cantonese" className={INPUT_CLASS} />
              </div>
            </SectionCard>
          )}

          {/* Save + Preview */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="btn-crimson px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : t.profileEdit.save}
            </button>
            {/* Preview how the public profile looks */}
            {currentUser?.username && (
              <a
                href={`/musicians/${currentUser.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white hover:underline flex items-center gap-1 transition-colors"
              >
                Preview public profile →
              </a>
            )}
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" /> {t.profileEdit.saved}
              </span>
            )}
          </div>
          {saveError && <p className="text-red-400 text-sm mt-1">{saveError}</p>}
        </form>
      </div>
    </div>
  );
}
