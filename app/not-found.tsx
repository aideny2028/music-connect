import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-[120px] font-bold leading-none select-none pointer-events-none" style={{ color: 'var(--border-strong)', fontFamily: 'var(--font-lora)' }}>
          404
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-6 relative" style={{ color: 'var(--text-faint)' }}>
          Not found
        </p>
        <h1 className="font-serif-heading text-4xl font-bold text-white mb-3 relative">
          Page not found
        </h1>
        <p className="text-sm mb-8 relative" style={{ color: 'var(--text-muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center relative">
          <Link href="/" className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold">
            Go home
          </Link>
          <Link href="/search" className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}
