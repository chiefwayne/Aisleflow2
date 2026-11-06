// An admin link that matches no event: the same message as before, now served as a 404
export default function AdminLinkNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-3xl border border-aisle-border bg-white p-8 shadow-sm space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-aisle-charcoal">Protected Admin Dashboard</h2>
        <p className="text-xs text-aisle-muted leading-relaxed">
          This administration link is invalid or has expired. Please check your secure access email or contact support.
        </p>
      </div>
    </div>
  );
}
