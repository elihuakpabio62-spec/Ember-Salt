import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { formatCurrency } from '@/src/lib/whatsapp';
import { fetchCategories, fetchFoodItems, fetchOrders } from '@/src/services/menuService';
import type { Category, FoodItem, OrderRecord } from '@/src/types';

export function AdminDashboardPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [foodRes, catRes, orderRes] = await Promise.all([
        fetchFoodItems(),
        fetchCategories(),
        fetchOrders(),
      ]);
      setFoods(foodRes.items);
      setCategories(catRes.items);
      setOrders(orderRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const availableCount = foods.filter((f) => f.is_available).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#1A1917]">Kitchen Overview</h1>
          <p className="mt-1 text-sm text-[#645F58]">
            Manage live menu items, categories, and incoming WhatsApp orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/menu"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white hover:bg-[#173B2E] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Food Item</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[#B91C1C]/30 bg-white p-4">
          <p className="text-sm text-[#B91C1C]">{error}</p>
          <button
            type="button"
            onClick={loadOverview}
            className="rounded-lg border border-[#E6E1D8] px-3 py-1.5 text-xs font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E6E1D8] bg-white p-5">
          <p className="text-xs font-medium text-[#645F58]">Total Menu Items</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-[#1A1917] tabular-nums">
            {loading ? '—' : foods.length}
          </p>
          <Link
            to="/admin/menu"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F4E3D] hover:underline"
          >
            <span>Manage dishes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-[#E6E1D8] bg-white p-5">
          <p className="text-xs font-medium text-[#645F58]">Available Today</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-[#1A1917] tabular-nums">
            {loading ? '—' : availableCount}
          </p>
          <p className="mt-3 text-xs text-[#645F58] tabular-nums">
            {loading ? '' : `${foods.length - availableCount} marked sold out`}
          </p>
        </div>

        <div className="rounded-xl border border-[#E6E1D8] bg-white p-5">
          <p className="text-xs font-medium text-[#645F58]">Categories</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-[#1A1917] tabular-nums">
            {loading ? '—' : categories.length}
          </p>
          <Link
            to="/admin/categories"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F4E3D] hover:underline"
          >
            <span>Edit categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-[#E6E1D8] bg-white p-5">
          <p className="text-xs font-medium text-[#645F58]">Pending Orders</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-[#1A1917] tabular-nums">
            {loading ? '—' : pendingOrders}
          </p>
          <Link
            to="/admin/orders"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F4E3D] hover:underline"
          >
            <span>View order queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-xl border border-[#E6E1D8] bg-white">
        <div className="flex items-center justify-between border-b border-[#E6E1D8] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[#1A1917]">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-xs font-medium text-[#1F4E3D] hover:underline"
          >
            See all orders
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[#F2EFE9]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-[#1A1917]">No orders logged yet</p>
            <p className="mt-1 text-xs text-[#645F58]">
              Orders placed via the WhatsApp checkout modal appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6E1D8] text-xs font-medium text-[#645F58]">
                  <th className="px-5 py-3">Order Ref</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D8]">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF9F7]">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-[#1A1917]">
                      {order.order_code}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1A1917]">{order.customer_name}</p>
                      <p className="font-mono text-xs text-[#645F58]">{order.customer_phone}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-[#645F58]">{order.delivery_type}</td>
                    <td className="px-5 py-3 capitalize">
                      <span
                        className={`text-xs font-medium ${
                          order.status === 'completed'
                            ? 'text-[#16A34A]'
                            : order.status === 'cancelled'
                              ? 'text-[#B91C1C]'
                              : 'text-[#B45309]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-[#1A1917] tabular-nums">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
