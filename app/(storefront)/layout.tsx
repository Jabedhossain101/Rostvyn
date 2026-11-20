import { getActiveCategories, getPublicSettings } from "@/lib/storefront";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, categories] = await Promise.all([
    getPublicSettings(),
    getActiveCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-alabaster text-espresso">
      <StorefrontHeader settings={settings} categories={categories} />
      <CartDrawer settings={settings} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter settings={settings} categories={categories} />
    </div>
  );
}
