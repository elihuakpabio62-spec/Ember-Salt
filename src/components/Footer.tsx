import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { buildWhatsAppInquiryUrl, formatWhatsAppDisplay } from '@/src/lib/whatsapp';

export function Footer() {
  const { storeSettings } = useCart();
  const whatsappHref = buildWhatsAppInquiryUrl(
    storeSettings.whatsapp_number,
    `Hello ${storeSettings.kitchen_name}, I have a question about today's menu.`
  );

  return (
    <footer className="border-t border-[#E6E1D8] bg-[#F2EFE9]/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-2xl font-semibold text-[#1A1917]">
              {storeSettings.kitchen_name}
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#645F58]">
              Wood-fired seasonal plates, handmade pasta, and hearth-baked staples prepared fresh
              to order for local delivery and kitchen pickup.
            </p>
            <div className="mt-5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-[#1F4E3D] hover:underline underline-offset-4"
              >
                <span>Message Kitchen on WhatsApp</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#645F58]">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#1A1917]">
              <li>
                <Link to="/" className="hover:text-[#1F4E3D] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-[#1F4E3D] transition-colors">
                  Full Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#1F4E3D] transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#1F4E3D] transition-colors">
                  Contact &amp; Catering
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#1F4E3D] transition-colors">
                  Kitchen Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#645F58]">
              Visit &amp; Hours
            </h3>
            <div className="mt-4 space-y-2.5 text-sm text-[#1A1917]">
              <p className="leading-relaxed">{storeSettings.address}</p>
              <p className="text-[#645F58]">{storeSettings.opening_hours}</p>
              <p className="pt-1 font-mono text-xs text-[#645F58] tabular-nums">
                WhatsApp: {formatWhatsAppDisplay(storeSettings.whatsapp_number)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#E6E1D8] pt-6 text-xs text-[#645F58] sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {storeSettings.kitchen_name}. All rights reserved.
          </p>
          <p>Direct Kitchen Ordering &middot; Fresh Daily Preparation</p>
        </div>
      </div>
    </footer>
  );
}
