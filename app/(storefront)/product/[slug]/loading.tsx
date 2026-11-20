export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16 animate-pulse">
      <div className="h-3 w-64 bg-linen mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        <div className="lg:col-span-6 aspect-[4/5] bg-linen border border-stone-border" />
        <div className="lg:col-span-6 space-y-5">
          <div className="h-3 w-36 bg-linen" />
          <div className="h-12 w-4/5 bg-linen" />
          <div className="h-8 w-28 bg-linen" />
          <div className="h-24 w-full bg-linen" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="h-12 bg-linen" />
            <div className="h-12 bg-linen" />
          </div>
          <div className="h-14 w-full bg-linen" />
        </div>
      </div>
    </div>
  );
}
