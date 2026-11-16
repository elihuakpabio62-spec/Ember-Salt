import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { FoodCard } from '@/src/components/FoodCard';
import { FoodImage } from '@/src/components/FoodImage';
import { useCart } from '@/src/context/CartContext';
import { BUNDLED_IMAGES } from '@/src/lib/images';
import { buildWhatsAppInquiryUrl } from '@/src/lib/whatsapp';
import { fetchFoodItems } from '@/src/services/menuService';
import type { FoodItem } from '@/src/types';

export function HomePage() {
  const { storeSettings } = useCart();
  const [featuredDishes, setFeaturedDishes] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const whatsappHref = buildWhatsAppInquiryUrl(
    storeSettings.whatsapp_number,
    `Hello ${storeSettings.kitchen_name}, I would like to place a quick order or ask about today's menu.`
  );

  const loadFeatured = async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await fetchFoodItems();
      const featured = items.filter((item) => item.is_featured);
      setFeaturedDishes((featured.length > 0 ? featured : items).slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load featured dishes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
  }, []);

  return (
    <div>
      {/* 1. Storefront Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col justify-center lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1F4E3D]">
              Wood-Fired Kitchen &middot; Lagos
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-[#1A1917] [text-wrap:balance]">
              Hearth-cooked seasonal plates, delivered warm.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#645F58]">
              Every morning we light the white oak hearth, roll fresh egg pasta by hand, and
              prepare vibrant seasonal plates ready for local delivery or pickup via direct
              WhatsApp ordering.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173B2E] whitespace-nowrap"
              >
                <span>Explore Full Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-[#E6E1D8] bg-white px-5 py-3 text-sm font-medium text-[#1A1917] transition-colors hover:bg-[#F2EFE9] whitespace-nowrap"
              >
                Our Kitchen Story
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E6E1D8] bg-[#F2EFE9] lg:h-full lg:aspect-auto">
              <FoodImage
                src={BUNDLED_IMAGES.heroWoodfiredFeast}
                alt="Wood-fired dinner spread with roasted chicken, sourdough flatbread, and seasonal vegetables"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 4-Column Craft Strip below Hero */}
        <div className="mt-12 grid grid-cols-2 gap-6 border-y border-[#E6E1D8] py-7 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1917]">White Oak Hearth</p>
            <p className="mt-1 text-xs leading-relaxed text-[#645F58]">
              Roasted over seasoned Pacific Northwest white oak embers.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1917]">Daily Handmade Pasta</p>
            <p className="mt-1 text-xs leading-relaxed text-[#645F58]">
              Pasture-raised yolks and organic stone-milled semolina.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1917]">Zero Middlemen</p>
            <p className="mt-1 text-xs leading-relaxed text-[#645F58]">
              Direct WhatsApp confirmation straight from our kitchen pass.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1917]">Service Hours</p>
            <p className="mt-1 text-xs leading-relaxed text-[#645F58]">
              {storeSettings.opening_hours}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured Collection Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#645F58]">
              Today&apos;s Selection
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#1A1917]">
              Featured from the Hearth
            </h2>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F4E3D] hover:underline underline-offset-4 whitespace-nowrap"
          >
            <span>View all dishes</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-[#E6E1D8] bg-white"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-[#EFECE5]" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[#EFECE5]" />
                  <div className="h-5 w-2/3 animate-pulse rounded bg-[#EFECE5]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#EFECE5]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-xl border border-[#E6E1D8] bg-white p-8 text-center">
            <p className="text-sm text-[#B91C1C]">{error}</p>
            <button
              type="button"
              onClick={loadFeatured}
              className="mt-4 inline-flex min-h-[40px] items-center rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white hover:bg-[#173B2E]"
            >
              Retry Loading Menu
            </button>
          </div>
        ) : featuredDishes.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#E6E1D8] bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold text-[#1A1917]">
              Menu items are being updated
            </p>
            <p className="mt-1 text-sm text-[#645F58]">
              Visit our Menu page or check back shortly for today&apos;s fresh plates.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDishes.map((dish) => (
              <FoodCard key={dish.id} food={dish} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Craftsmanship & Kitchen Story */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#F2EFE9]">
              <FoodImage
                src={BUNDLED_IMAGES.aboutKitchenHearth}
                alt="Chefs grilling over glowing white oak embers in the Ember & Salt open hearth kitchen"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1F4E3D]">
              Craft &amp; Provenance
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-[#1A1917] [text-wrap:balance]">
              Honest ingredients, live fire, and direct hospitality.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#645F58]">
              We partner directly with local market growers, coastal fisheries,
              and heritage grain mills. Ordering through WhatsApp connects your table straight to
              our kitchen pass—no third-party app markups, and exact timing for delivery or hot
              counter pickup.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/about"
                className="inline-flex min-h-[40px] items-center rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-5 py-2 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
              >
                Read Our Story
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-[40px] items-center rounded-lg px-4 py-2 text-sm font-medium text-[#1F4E3D] hover:underline underline-offset-4"
              >
                Private Dining &amp; Catering
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hovering WhatsApp Quick-Access Button */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order or chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#1F4E3D] px-5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#173B2E] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4E3D] whitespace-nowrap"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span>WhatsApp Order</span>
      </a>
    </div>
  );
}
