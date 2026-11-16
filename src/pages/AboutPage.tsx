import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FoodImage } from '@/src/components/FoodImage';
import { useCart } from '@/src/context/CartContext';
import { BUNDLED_IMAGES } from '@/src/lib/images';

export function AboutPage() {
  const { storeSettings } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1F4E3D]">
          Our Kitchen Story
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-[#1A1917] sm:text-5xl [text-wrap:balance]">
          Built around live oak fire, patient fermentation, and honest seasonal cooking.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#645F58]">
          Based in Lagos, {storeSettings.kitchen_name} began as a neighborhood hearth kitchen
          focused on doing a small number of dishes extraordinarily well—grilling over seasoned
          hardwood, extruding pasta each morning, and preparing vibrant plates to order.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E6E1D8] bg-[#F2EFE9]">
            <FoodImage
              src={BUNDLED_IMAGES.aboutKitchenHearth}
              alt="Open wood-fired hearth kitchen with glowing embers and fresh herbs"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1A1917]">
              Why Direct Kitchen Ordering Matters
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#645F58]">
              Traditional food delivery apps charge steep commissions and strip away direct
              communication between guests and cooks. When you place an order here, it routes
              straight to our kitchen pass via WhatsApp so we can confirm timing, dietary
              adjustments, and courier handoff in real time.
            </p>
          </div>

          <div className="border-t border-[#E6E1D8] pt-5 text-sm space-y-1.5">
            <p className="font-semibold text-[#1A1917]">Location &amp; Hours</p>
            <p className="text-[#645F58]">{storeSettings.address}</p>
            <p className="text-[#645F58]">
              <span className="font-medium text-[#1A1917]">Days of Service:</span> Monday - Friday
            </p>
            <p className="text-[#645F58]">
              <span className="font-medium text-[#1A1917]">Time:</span> 7:00am - 10:00pm
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/menu"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#173B2E]"
            >
              <span>Order from Menu</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-[42px] items-center rounded-lg border border-[#E6E1D8] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Sourcing & Standards */}
      <div className="mt-16 grid gap-8 border-t border-[#E6E1D8] pt-12 md:grid-cols-3">
        <div>
          <p className="font-mono text-xs text-[#645F58]">01</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-[#1A1917]">
            Fresh Market Produce
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#645F58]">
            Seasonal vegetables and aromatics are sourced fresh each morning to anchor our harvest
            bowls and wood-roasted sides.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs text-[#645F58]">02</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-[#1A1917]">
            Prime Cuts &amp; Seafood
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#645F58]">
            Dry-aged beef and fresh coastal catch are prepped in-house and cooked strictly over
            hardwood embers—never gas broilers.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs text-[#645F58]">03</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-[#1A1917]">
            Packed for Travel
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#645F58]">
            Vented insulated containers preserve crust and sear on wood-fired mains and keep
            handmade sauces balanced until they reach your table.
          </p>
        </div>
      </div>
    </div>
  );
}
