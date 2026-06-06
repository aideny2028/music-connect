'use client';

/**
 * components/listing-form.tsx — Create and edit listing form.
 *
 * Shared form component used by both /dashboard/listings/new and
 * /dashboard/listings/[id]/edit. Performs client-side validation before
 * submitting to the POST or PATCH listing API. Shows inline field-level
 * errors, a character counter on description, and success/error feedback.
 */

/**
 * ListingForm component — used for both creating and editing listings.
 * Features:
 *   - Inline per-field validation errors shown in red below each input
 *   - Loading state on the submit button during API calls
 *   - Success message displayed after a successful save
 *   - No alert() calls — all feedback is inline in the UI
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useLanguage } from '@/lib/language-context';

const INSTRUMENTS = ['Piano', 'Guitar', 'Violin', 'Drums', 'Voice', 'Cello', 'Flute', 'Saxophone', 'Ukulele', 'Bass Guitar', 'Erhu', 'Other'];
const DISTRICTS = ['Central', 'Wan Chai', 'Causeway Bay', 'Mong Kok', 'Tsim Sha Tsui', 'Yau Ma Tei', 'Sham Shui Po', 'Kwun Tong', 'Sha Tin', 'Tuen Mun', 'Tai Po'];

const SELECT_STYLE = { background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--text)' };
const SELECT_CLS = 'w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#B84050]/50';
const SELECT_ERR = 'w-full h-9 rounded-md border border-red-400 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-400/50';
const TEXTAREA_CLS = 'w-full border rounded-md p-2.5 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-[#B84050]/50';
const TEXTAREA_ERR = 'w-full border rounded-md p-2.5 text-sm min-h-[120px] resize-none border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400/50';

interface Props {
  mode: 'create' | 'edit';
  listingId?: number;
  initialData?: Partial<ListingFormData>;
}

interface ListingFormData {
  type: string;
  title: string;
  description: string;
  instrument: string;
  location_district: string;
  lesson_format: string;
  rate: string;
  rate_unit: string;
  student_level: string;
  teaching_languages: string;
}

/** Per-field validation errors. A missing key means no error for that field. */
interface FormErrors {
  title?: string;
  description?: string;
  instrument?: string;
  lesson_format?: string;
}

/**
 * FormField — wrapper that renders a label, the given children (an input/select),
 * and an inline error message below when `error` is truthy.
 */
function FormField({
  label,
  error,
  children,
  fieldId,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  fieldId?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      {children}
      {/* Inline error message shown in red below the field */}
      {error && (
        <p className="text-red-400 text-xs mt-0.5" role="alert">{error}</p>
      )}
    </div>
  );
}

export function ListingForm({ mode, listingId, initialData }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<ListingFormData>({
    type: 'offering_lessons',
    title: '',
    description: '',
    instrument: 'Piano',
    location_district: '',
    lesson_format: 'in_person',
    rate: '',
    rate_unit: 'hour',
    student_level: '',
    teaching_languages: '',
    ...initialData,
  });

  const set = (k: keyof ListingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    // Clear the error for this field as the user types
    if (k in fieldErrors) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[k as keyof FormErrors]; return next; });
    }
  };

  /**
   * Validate required fields client-side.
   * Returns an errors object — empty means valid.
   */
  function validate(): FormErrors {
    const errors: FormErrors = {};
    if (!form.title.trim()) errors.title = 'Title is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';
    if (!form.instrument) errors.instrument = 'Please select an instrument.';
    if (!form.lesson_format) errors.lesson_format = 'Please select a lesson format.';
    return errors;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSaved(false);

    // Run client-side validation before hitting the API
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);

    const body = {
      ...form,
      rate: form.rate ? Number(form.rate) : null,
      location_district: form.location_district || null,
      student_level: form.student_level || null,
      teaching_languages: form.teaching_languages || null,
    };

    // POST for new listings; PATCH to update an existing listing
    const res = mode === 'create'
      ? await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    setSaving(false);

    if (res.ok) {
      setSaved(true);
      if (mode === 'create') {
        const data = await res.json();
        // Redirect to the new listing's detail page after creation
        router.push(`/listings/${data.id}`);
      } else {
        // For edits, show the success message briefly then clear it
        setTimeout(() => setSaved(false), 3000);
      }
    } else {
      // Show server-returned error message inline (never uses alert())
      const data = await res.json().catch(() => ({}));
      setServerError(data.error || t.common.error);
    }
  };

  return (
    <div className="bg-transparent min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">
          {mode === 'create' ? t.listingForm.createTitle : t.listingForm.editTitle}
        </h1>

        <form onSubmit={handleSubmit} noValidate>

<div className="space-y-5">
              {/* Listing type — no validation needed, always has a default */}
              <div className="space-y-1.5">
                <Label>{t.listingForm.type}</Label>
                <select value={form.type} onChange={set('type')} className={SELECT_CLS} style={SELECT_STYLE}>
                  <option value="offering_lessons">{t.listingForm.typeOffering}</option>
                  <option value="looking_for_teacher">{t.listingForm.typeLooking}</option>
                </select>
              </div>

              <FormField label={t.listingForm.title} error={fieldErrors.title} fieldId="listing-title">
                <Input
                  id="listing-title"
                  value={form.title}
                  onChange={set('title')}
                  placeholder={t.listingForm.titlePlaceholder}
                  className={fieldErrors.title ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </FormField>

              <FormField label={t.listingForm.description} error={fieldErrors.description} fieldId="listing-desc">
                <textarea
                  id="listing-desc"
                  value={form.description}
                  onChange={set('description')}
                  placeholder={t.listingForm.descriptionPlaceholder}
                  className={fieldErrors.description ? TEXTAREA_ERR : TEXTAREA_CLS}
                  style={SELECT_STYLE}
                  maxLength={1000}
                />
                {/* Character counter — helps teachers write concise, useful descriptions */}
                <p className={`text-xs mt-0.5 text-right ${form.description.length > 900 ? 'text-red-400' : 'text-white/35'}`}>
                  {form.description.length}/1000
                </p>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label={t.listingForm.instrument} error={fieldErrors.instrument} fieldId="listing-instrument">
                  <select id="listing-instrument" value={form.instrument} onChange={set('instrument')} className={fieldErrors.instrument ? SELECT_ERR : SELECT_CLS} style={SELECT_STYLE}>
                    {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </FormField>

                <div className="space-y-1.5">
                  <Label>{t.listingForm.location}</Label>
                  <select value={form.location_district} onChange={set('location_district')} className={SELECT_CLS} style={SELECT_STYLE}>
                    <option value="">{t.listingForm.locationOnline}</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label={t.listingForm.format} error={fieldErrors.lesson_format} fieldId="listing-format">
                  <select id="listing-format" value={form.lesson_format} onChange={set('lesson_format')} className={fieldErrors.lesson_format ? SELECT_ERR : SELECT_CLS} style={SELECT_STYLE}>
                    <option value="in_person">{t.common.inPerson}</option>
                    <option value="online">{t.common.online}</option>
                    <option value="both">{t.common.both}</option>
                  </select>
                </FormField>

                <div className="space-y-1.5">
                  <Label>{t.listingForm.level}</Label>
                  <select value={form.student_level} onChange={set('student_level')} className={SELECT_CLS} style={SELECT_STYLE}>
                    <option value="">Any level</option>
                    <option value="beginner">{t.common.beginner}</option>
                    <option value="intermediate">{t.common.intermediate}</option>
                    <option value="advanced">{t.common.advanced}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t.listingForm.rate}</Label>
                  <Input type="number" value={form.rate} onChange={set('rate')} placeholder={t.listingForm.ratePlaceholder} min="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.listingForm.rateUnit}</Label>
                  <select value={form.rate_unit} onChange={set('rate_unit')} className={SELECT_CLS} style={SELECT_STYLE}>
                    <option value="hour">{t.listingForm.rateHour}</option>
                    <option value="30min">{t.listingForm.rate30min}</option>
                    <option value="package">{t.listingForm.ratePackage}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t.listingForm.languages}</Label>
                <Input value={form.teaching_languages} onChange={set('teaching_languages')} placeholder={t.listingForm.languagesPlaceholder} />
              </div>

              {/* Server-side error banner — shown when the API returns an error */}
              {serverError && (
                <div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2.5 text-sm text-red-300" role="alert">
                  {serverError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? t.common.loading : mode === 'create' ? t.listingForm.publish : t.listingForm.save}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  {t.listingForm.cancel}
                </Button>
                {/* Inline success message — shown after a successful save */}
                {saved && (
                  <span className="text-green-400 text-sm font-medium">
                    {mode === 'create' ? 'Listing created successfully' : t.listingForm.success}
                  </span>
                )}
              </div>
  </div>

        </form>
      </div>
    </div>
  );
}
