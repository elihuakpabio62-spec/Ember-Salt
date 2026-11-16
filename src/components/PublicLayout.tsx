import { Outlet } from 'react-router-dom';
import { Footer } from '@/src/components/Footer';
import { Navbar } from '@/src/components/Navbar';
import { OrderModal } from '@/src/components/OrderModal';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-[#1A1917]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <OrderModal />
    </div>
  );
}
