'use client';

import { use, useEffect, useState } from 'react';
import { ListingForm } from '@/components/listing-form';

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(d => {
        setInitialData({
          type: d.type,
          title: d.title,
          description: d.description,
          instrument: d.instrument,
          location_district: d.location_district || '',
          lesson_format: d.lesson_format,
          rate: d.rate ? String(d.rate) : '',
          rate_unit: d.rate_unit || 'hour',
          student_level: d.student_level || '',
          teaching_languages: d.teaching_languages || '',
        });
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="container mx-auto max-w-2xl px-4 py-12 text-center text-white/65">Loading...</div>;

  return <ListingForm mode="edit" listingId={Number(id)} initialData={initialData} />;
}
