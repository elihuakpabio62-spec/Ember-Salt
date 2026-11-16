import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/src/components/PublicLayout';
import { AuthProvider } from '@/src/context/AuthContext';
import { CartProvider } from '@/src/context/CartContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { AboutPage } from '@/src/pages/AboutPage';
import { ContactPage } from '@/src/pages/ContactPage';
import { HomePage } from '@/src/pages/HomePage';
import { MenuPage } from '@/src/pages/MenuPage';
import { AdminCategoriesPage } from '@/src/pages/admin/AdminCategoriesPage';
import { AdminDashboardPage } from '@/src/pages/admin/AdminDashboardPage';
import { AdminFoodItemsPage } from '@/src/pages/admin/AdminFoodItemsPage';
import { AdminLayout } from '@/src/pages/admin/AdminLayout';
import { AdminLoginPage } from '@/src/pages/admin/AdminLoginPage';
import { AdminMessagesPage } from '@/src/pages/admin/AdminMessagesPage';
import { AdminOrdersPage } from '@/src/pages/admin/AdminOrdersPage';
import { AdminSettingsPage } from '@/src/pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Storefront Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Admin Authentication */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="menu" element={<AdminFoodItemsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
