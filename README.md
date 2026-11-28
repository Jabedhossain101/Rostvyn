# Rostvyn — Specialty Coffee & Artisan Roastery Platform

**Rostvyn** is a production-grade, international Direct-to-Consumer (D2C) specialty coffee e-commerce storefront and 9-module operational back-office engineered for the **EU, US, and Australia** markets. Designed with an editorial luxury aesthetic (warm alabaster surfaces, deep espresso typography, terracotta accents, and `Cormorant Garamond` + `Plus Jakarta Sans` pairing), Rostvyn combines a zero-friction guest checkout experience with ACID transactional inventory integrity and role-based operations governance.

---

## Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router, Server Components, Route Handlers, Edge Middleware)
- **Language & Styling:** TypeScript (strict), React 19, Tailwind CSS v4
- **Database & ORM:** NeonDB (Serverless PostgreSQL — pooled runtime + direct migration URLs) with Prisma ORM v6
- **State & Validation:** Zustand (persisted client cart store), Zod (end-to-end request/form validation)
- **Authentication & Security:** `bcryptjs` password hashing + `jose` HS256 JWT signed HTTP-only cookies (`rostvyn_admin_session`) with server-side RBAC (`SUPER_ADMIN` / `STAFF`)
- **Icons:** Lucide React

---

## Key Features Breakdown

### 1. Public Luxury Storefront (14 Routes & 11-Section Homepage)
- **11-Section Dynamic Homepage (`/`):** Announcement bar & sticky header, editorial hero banner (`heroData`), 4-column roastery trust strip, dynamic Shop by Category grid, Featured Roasts / Best Sellers, interactive 3-tier **Roast Profile Explorer** (`Light`, `Medium`, `Dark`), curated **Tasting Bundles & Gift Sets**, Roastery Origin & Craft Story split (`storyData`), **Brew Like a Barista** preview strip, verified customer reviews showcase, and First-Order Club newsletter signup band + editorial footer.
- **Discovery & Catalog:**
  - `/shop` — Live keyword search, multi-facet filters (category, roast level, grind/format, price range, in-stock toggle), sorting, Quick-View modal, and pagination.
  - `/shop/[categorySlug]` — Dynamic collection landing pages with category banners and tasting overviews.
  - `/bundles` — Curated high-AOV tasting flights and gift sets with automatic savings badges.
  - `/product/[slug]` — High-res image gallery, tasting note tags, interactive weight/grind variant selector updating price & live stock in real time, Out-of-Stock blocking, stock-capped quantity selector, barista brew recommendations, verified reviews + "Write a Review" moderation form, and paired cross-sell items.
- **Brand, Education & Support:**
  - `/brew-guide` — Extraction manual covering Whole Bean, V60 Pour-Over, Espresso, AeroPress, and French Press with ratio tables and deep-links to matching `/shop` filters.
  - `/our-story` — Small-batch roasting cadence, direct-trade farm-gate sourcing, Q-Grader cupping standards, and sustainability.
  - `/faq` — Categorized accessible accordion pulling live shipping fees and thresholds from `StoreSettings`.
  - `/contact` — Roastery contact details and validated Support / Wholesale inquiry form.
  - `/policies/[slug]` — Dynamic legal pages (`shipping`, `returns`, `privacy`, `terms`) powered by `StoreSettings.policyTexts`.
- **SEO & Resilience:** Dynamic `generateMetadata()`, database-driven `sitemap.xml`, `robots.txt`, branded `404` & error boundaries, and route loading skeletons.

### 2. Commerce, Promo Engine & ACID Guest Checkout
- **Persistent Slide-Over Cart Drawer & `/cart`:** Dynamic free-shipping progress bar (`StoreSettings.freeShippingThreshold`), stock-capped quantity steppers, live subtotal, Promo Code preview (`POST /api/promos/validate`), and NeonDB-backed **Pair With Your Roast** cross-sells.
- **Zero-Trust ACID Guest Checkout (`/checkout` & `POST /api/orders`):**
  - 100% guest-first (no login wall), supporting **Metro** vs. **National/Regional** delivery zones and **Cash on Delivery (COD)** or **Manual Bank Transfer (IBAN / Wire / PayID)** with required **Transaction Reference (TrxID)** and **Sender Account**.
  - All prices, promo discounts, delivery fees, and totals are calculated strictly server-side inside `prisma.$transaction`.
  - Atomic row-level conditional stock deduction (`stockCount >= quantity`) prevents overselling race conditions (`409 Conflict` rollback), writes immutable `InventoryLog` entries, increments `PromoCode.usedCount` atomically, and freezes `OrderItem` snapshots.
- **Order Receipt (`/order-confirmation/[ref]`):** Copyable `RV-YYMMDD-XXXX` reference, itemized invoice snapshot, and bank transfer verification status.
- **Privacy-Safe Order Tracking (`/track` & `GET /api/orders/track`):** Dual-factor lookup requiring an exact match on **both** `Order Reference` and `Customer Phone Number`, rendering a 5-step visual fulfillment timeline (`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` or `CANCELLED`) and payment verification badge.

### 3. Operational Admin Portal (9 Modules + RBAC)
Protected by Edge Middleware + server-side `requireAdmin()` verification (`401` unauthenticated, `403` when `STAFF` attempts financial/payment/staff mutations):
1. **Executive Dashboard (`/admin`):** 4 KPI cards (Revenue excluding cancelled, Total/Pending Orders, Active Catalog, Low Stock Alerts `≤ 5`), pending manual TrxID Action Alert Banner, Recent Orders table, and Payment Audit Queue.
2. **Products (`/admin/products`, `/new`, `/[id]/edit`):** Searchable catalog table, quick Active/Featured toggles, soft-archiving (`isActive: false`), and nested multi-variant editor (SKU, price override, stock count).
3. **Categories (`/admin/categories`):** Reorderable (`sortOrder`) collection manager with thumbnail URLs and active toggles.
4. **Inventory (`/admin/inventory`):** Live stock table with **All**, **Low Stock (`≤ 5`)**, and **Out of Stock (`0`)** filters, inline stock adjustment modal requiring a mandatory audit reason, and immutable **Inventory Audit Log** viewer.
5. **Orders (`/admin/orders` & `/[id]`):** Searchable order ledger, detailed inspection view, internal notes, and fulfillment status transitions — cancelling an order executes an atomic `$transaction` that restores variant stock **exactly once** (`stockRestored: false → true`) with compensating `InventoryLog` entries.
6. **Payments (`/admin/payments` & `/[id]`):** Filterable payment ledger highlighting `trxId` and `senderAccount`, with one-click **Verify**, **Mark COD Paid**, and **Reject** (audit note required) recording `verifiedById` and `verifiedAt`.
7. **Promotions (`/admin/promotions`):** Create/edit `PERCENTAGE` and `FIXED` promo codes, minimum order amounts, redemption caps (`usedCount / maxUses`), expiry dates, and active toggles.
8. **Reviews, Inquiries & Newsletter (`/admin/reviews`):** 3-tab hub for moderating product reviews (`APPROVED` / `REJECTED` + `isFeatured` homepage toggle), managing Support & Wholesale inquiries (`NEW` / `REPLIED` / `ARCHIVED`), and viewing/exporting First-Order Club subscribers as **CSV**.
9. **Store Settings (`/admin/settings`):** 4-tab configuration covering Store Profile & Policy Texts, Shipping & Merchant Payment Accounts (`SUPER_ADMIN` only), Homepage Editorial Content, and Access Governance (password rotation & staff account management, `SUPER_ADMIN` only).

---

## Database Schema Summary (13 NeonDB Relational Models)

| Model | Purpose |
| :--- | :--- |
| `AdminUser` | Role-based back-office accounts (`SUPER_ADMIN`, `STAFF`), bcrypt hashes, active flag, last login |
| `Category` | Storefront collections with unique slugs, thumbnails, `sortOrder`, and `isActive` |
| `Product` | Specialty coffee lots & gear with roast level, tasting notes, pricing, images, featured/active flags |
| `ProductVariant` | Weight/grind SKUs (`priceOverride`, live `stockCount`, `isActive`) |
| `InventoryLog` | Immutable stock audit ledger (`quantityDelta`, `previousStock`, `newStock`, `reason`, `adminId`) |
| `Order` | Guest orders (`RV-YYMMDD-XXXX`), shipping details, financials, fulfillment status, `stockRestored` guard |
| `OrderItem` | Frozen purchase snapshots (`productNameSnapshot`, `variantSnapshot`, `skuSnapshot`, `unitPriceSnapshot`) |
| `Payment` | Payment audit record (`COD` / `MANUAL_TRANSFER` / `MFS`, `trxId`, `senderAccount`, `verifiedById`, `auditNote`) |
| `PromoCode` | Percentage/fixed discount rules (`minOrderAmount`, `maxUses`, `usedCount`, `expiresAt`, `isActive`) |
| `ProductReview` | Moderated customer reviews (`PENDING` / `APPROVED` / `REJECTED`, `isFeatured`, `isVerifiedPurchase`) |
| `NewsletterSubscriber` | First-Order Club email captures with source tracking |
| `SupportInquiry` | Customer support and wholesale partnership messages (`NEW` / `REPLIED` / `ARCHIVED`) |
| `StoreSettings` | Singleton store configuration (currency, delivery fees, free-shipping threshold, payment accounts, hero/story/policies JSON) |

---

## Local Setup & Installation Guide

### Prerequisites
- Node.js `20+`
- `pnpm` (`10+`)
- A NeonDB PostgreSQL database (pooled + direct connection strings)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the project root and populate your credentials:
```env
# NeonDB Pooled Connection (runtime queries)
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# NeonDB Direct Connection (Prisma migrations & db push)
DIRECT_URL="postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"

# 32+ character cryptographically random secret for jose HS256 JWT signing
JWT_SECRET="replace-with-a-64-char-random-hex-secret"

# Optional: Canonical URL for sitemap.xml & robots.txt
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Push Schema / Run Migrations & Seed NeonDB
```bash
pnpm exec prisma db push
# Or for versioned migrations:
# pnpm exec prisma migrate dev

pnpm exec prisma db seed
```

### 4. Start the Development Server
```bash
pnpm dev
```
Visit `http://localhost:3000` for the storefront and `http://localhost:3000/admin/login` for the Operational Admin Portal.

---

## Admin Demo Credentials & Quick Access

Clients and reviewers can access the Admin Portal directly via the **Admin Demo** button in the storefront header, the **Admin Portal / Demo Login** link in the footer, or by visiting `/admin/login`:

- **Admin Login URL:** `/admin/login`
- **Demo Super Admin Email:** `admin@rostvyn.com`
- **Demo Super Admin Password:** `RostvynAdmin@2026`
- **One-Click Demo Login:** Available directly on `/admin/login` inside the **Client Demo Quick Access** panel.
- **Self-Registration:** Use the **Create Demo Account** tab on `/admin/login` (`POST /api/admin/auth/register`) to spin up a custom `SUPER_ADMIN` or `STAFF` test account immediately.
- **Sample Storefront Promo Codes:** `WELCOME10` (10% off orders \$20+) and `ROAST5` (\$5 off orders \$35+).

---

## Deploying to Vercel (with NeonDB)

1. Push this repository to GitHub / GitLab / Bitbucket and import it into **Vercel**.
2. Set the following **Environment Variables** in your Vercel Project Settings:
   - `DATABASE_URL` (NeonDB pooled connection string)
   - `DIRECT_URL` (NeonDB direct connection string)
   - `JWT_SECRET` (strong 32+ char random secret)
   - `NEXT_PUBLIC_SITE_URL` (your live Vercel domain, e.g., `https://rostvyn.vercel.app`)
3. Vercel automatically runs the configured build script (`prisma generate && next build`).
4. Ensure your NeonDB instance has been synced and seeded (`pnpm exec prisma db push && pnpm exec prisma db seed`).
