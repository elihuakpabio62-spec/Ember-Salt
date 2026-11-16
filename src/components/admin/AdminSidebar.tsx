import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ReceiptText,
  Settings,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/menu', label: 'Food Items', icon: UtensilsCrossed, end: false },
  { to: '/admin/categories', label: 'Categories', icon: FolderKanban, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText, end: false },
  { to: '/admin/messages', label: 'Inquiries', icon: MessageSquare, end: false },
  { to: '/admin/settings', label: 'Store Settings', icon: Settings, end: false },
];

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('info', 'Signed out', 'Your admin session has ended.');
      navigate('/admin/login');
    } catch (err) {
      showToast('error', 'Sign out failed', err instanceof Error ? err.message : undefined);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-[#E6E1D8] bg-white">
      <div className="flex h-16 items-center justify-between border-b border-[#E6E1D8] px-5">
        <Link to="/admin" className="font-display text-lg font-semibold text-[#1A1917]">
          Ember &amp; Salt Admin
        </Link>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="rounded-lg p-1.5 text-[#645F58] hover:bg-[#F2EFE9] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-3">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex min-h-[42px] items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1F4E3D] text-white'
                    : 'text-[#645F58] hover:bg-[#F2EFE9] hover:text-[#1A1917]'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#E6E1D8] p-4 space-y-3">
        <Link
          to="/"
          className="flex min-h-[38px] items-center justify-between rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3 text-xs font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
        >
          <span>View Public Storefront</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#645F58]" />
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-[38px] w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Lock Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw]">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
