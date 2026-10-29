import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UpgradeCompletePage({ searchParams }: PageProps) {
  const cancelled = (await searchParams).cancelled === '1';

  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-3xl border border-aisle-border bg-white p-8 shadow-sm space-y-4">
        <h1 className="font-serif text-2xl font-semibold text-aisle-charcoal">
          {cancelled ? 'Checkout cancelled' : 'Payment received'}
        </h1>
        <p className="text-sm text-aisle-muted leading-relaxed">
          {cancelled
            ? 'Nothing was charged. You can close this tab and go back to your dashboard.'
            : 'Thank you! Your new plan switches on within a minute. Close this tab and go back to your dashboard, which updates on its own.'}
        </p>
        <Link href="/" className="inline-block text-sm font-semibold text-aisle-terracotta hover:underline">
          AisleFlow home
        </Link>
      </div>
    </main>
  );
}
