'use client';

export default function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-[44px] rounded-full bg-aisle-charcoal px-5 text-sm font-semibold text-white hover:bg-aisle-terracotta"
    >
      {label}
    </button>
  );
}
