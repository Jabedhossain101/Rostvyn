export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-36 bg-stone-border" />
        <div className="h-9 w-64 bg-stone-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 border border-stone-border bg-surface p-6 space-y-3"
          >
            <div className="h-3 w-24 bg-linen" />
            <div className="h-8 w-32 bg-linen" />
          </div>
        ))}
      </div>
      <div className="h-80 border border-stone-border bg-surface" />
    </div>
  );
}
