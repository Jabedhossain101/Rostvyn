export default function ShopLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18 space-y-3">
          <div className="h-3 w-40 bg-stone-border" />
          <div className="h-10 w-72 bg-stone-border" />
          <div className="h-4 w-96 max-w-full bg-stone-border" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="h-8 w-full bg-linen" />
          <div className="h-36 w-full bg-linen" />
          <div className="h-24 w-full bg-linen" />
        </div>
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-stone-border bg-surface overflow-hidden"
            >
              <div className="aspect-[4/5] bg-linen" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 bg-linen" />
                <div className="h-6 w-3/4 bg-linen" />
                <div className="h-8 w-full bg-linen mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
