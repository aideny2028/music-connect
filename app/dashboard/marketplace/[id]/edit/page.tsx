'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  { value: 'guitar', label: 'Guitar' },
  { value: 'piano', label: 'Piano' },
  { value: 'drums', label: 'Drums' },
  { value: 'violin', label: 'Violin' },
  { value: 'bass', label: 'Bass' },
  { value: 'woodwind', label: 'Woodwind' },
  { value: 'brass', label: 'Brass' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: 'new', label: 'New', desc: 'Brand new, never used' },
  { value: 'like_new', label: 'Like New', desc: 'Used once or twice, no signs of wear' },
  { value: 'good', label: 'Good', desc: 'Some light wear, fully functional' },
  { value: 'fair', label: 'Fair', desc: 'Noticeable wear but plays well' },
  { value: 'poor', label: 'Poor', desc: 'Heavy wear or needs repair' },
];

const DISTRICTS = [
  'Central', 'Wan Chai', 'Causeway Bay', 'Mong Kok', 'Tsim Sha Tsui',
  'Yau Ma Tei', 'Sham Shui Po', 'Kwun Tong', 'Sha Tin', 'Tuen Mun', 'Tai Po', 'Online',
];

interface FormState {
  title: string;
  category: string;
  brand: string;
  condition: string;
  price: string;
  is_negotiable: boolean;
  location_district: string;
  description: string;
}

export default function EditInstrumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [form, setForm] = useState<FormState>({
    title: '',
    category: '',
    brand: '',
    condition: '',
    price: '',
    is_negotiable: false,
    location_district: '',
    description: '',
  });
  const [loadingItem, setLoadingItem] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;
    fetch(`/api/marketplace/${id}`)
      .then(r => r.json())
      .then(item => {
        setForm({
          title: item.title ?? '',
          category: item.category ?? '',
          brand: item.brand ?? '',
          condition: item.condition ?? '',
          price: item.price != null ? String(item.price) : '',
          is_negotiable: item.is_negotiable === 1,
          location_district: item.location_district ?? '',
          description: item.description ?? '',
        });
        setLoadingItem(false);
      })
      .catch(() => setLoadingItem(false));
  }, [id, status, router]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.condition || !form.price) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          is_negotiable: form.is_negotiable ? 1 : 0,
          brand: form.brand || null,
          location_district: form.location_district || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update listing.'); setSubmitting(false); return; }
      router.push(`/marketplace/${id}`);
    } catch {
      setError('Failed to update. Please try again.');
      setSubmitting(false);
    }
  };

  if (loadingItem) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white/65 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href={`/marketplace/${id}`} className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Listing
        </Link>
        <div className="glass rounded-xl border border-white/20 p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Edit Listing</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input id="title" value={form.title} onChange={set('title')} placeholder="e.g. Yamaha U1 Upright Piano" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <select id="category" value={form.category} onChange={set('category')} required className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none" style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand">Brand <span className="text-white/65 text-xs">(optional)</span></Label>
                <Input id="brand" value={form.brand} onChange={set('brand')} placeholder="e.g. Yamaha" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition">Condition <span className="text-red-500">*</span></Label>
              <select id="condition" value={form.condition} onChange={set('condition')} required className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none" style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
                <option value="">Select condition</option>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}: {c.desc}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (HK$) <span className="text-red-500">*</span></Label>
                <Input id="price" type="number" min="0" value={form.price} onChange={set('price')} placeholder="e.g. 5000" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location District</Label>
                <select id="location" value={form.location_district} onChange={set('location_district')} className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none" style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="negotiable"
                type="checkbox"
                checked={form.is_negotiable}
                onChange={e => setForm(f => ({ ...f, is_negotiable: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 accent-[#B84050]"
              />
              <Label htmlFor="negotiable" className="cursor-pointer">Price is negotiable</Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <textarea
                id="description"
                value={form.description}
                onChange={set('description')}
                placeholder="Describe the instrument, condition, what's included, reason for selling..."
                rows={5}
                required
                className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#B84050]/20"
                style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--text)' }}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href={`/marketplace/${id}`} className={cn(buttonVariants({ variant: 'outline' }))}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
