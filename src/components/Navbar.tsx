import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/admin', label: 'Admin' },
];

export function Navbar() {
  const { totalItems, openModal, storeSettings } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E1D8] bg-[#FAF9F7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-tight text-[#1A1917] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F4E3D]"
        >
          {storeSettings.kitchen_name}
        </Link>

        {/* Zone 2: Clean single-line text nav links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#645F58]"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#1A1917] ${
                  isActive
                    ? 'text-[#1A1917] underline decoration-[#1F4E3D] decoration-2 underline-offset-8'
                    : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openModal}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#173B2E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4E3D]"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Order Bag</span>
            {totalItems > 0 && (
              <span className="ml-0.5 font-mono text-xs tabular-nums">({totalItems})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E6E1D8] bg-white text-[#1A1917] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[#E6E1D8] bg-[#FAF9F7] px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F2EFE9] text-[#1F4E3D] font-semibold'
                      : 'text-[#1A1917] hover:bg-[#F2EFE9]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
