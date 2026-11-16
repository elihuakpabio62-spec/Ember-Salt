import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/src/context/ToastContext';
import { formatCurrency } from '@/src/lib/whatsapp';
import { fetchOrders, updateOrderStatus } from '@/src/services/menuService';
import type { OrderRecord, OrderStatus } from '@/src/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'completed',
  'cancelled',
];

export function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
      );
      showToast('success', `Order ${updated.order_code} updated`, `Status set to ${nextStatus}.`);
    } catch (err) {
      showToast('error', 'Status update failed', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1A1917]">Customer Orders</h1>
        <p className="mt-1 text-sm text-[#645F58]">
          Track WhatsApp checkout orders and update kitchen fulfillment status.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#F2EFE9] p-1 w-fit">
        {(['all', ...STATUS_OPTIONS] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === status
                ? 'bg-white text-[#1A1917] shadow-sm'
                : 'text-[#645F58] hover:text-[#1A1917]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[#B91C1C]/30 bg-white p-4">
          <p className="text-sm text-[#B91C1C]">{error}</p>
          <button
            type="button"
            onClick={loadOrders}
            className="rounded-lg border border-[#E6E1D8] px-3 py-1.5 text-xs font-medium text-[#1A1917]"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white border border-[#E6E1D8]" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-[#E6E1D8] bg-white p-12 text-center">
          <p className="font-display text-lg font-semibold text-[#1A1917]">No orders in this view</p>
          <p className="mt-1 text-sm text-[#645F58]">
            New WhatsApp orders submitted from the storefront will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-[#E6E1D8] bg-white p-5"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-[#E6E1D8] pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#645F58]">
                    <span className="font-mono font-semibold text-[#1A1917]">
                      {order.order_code}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="capitalize">{order.delivery_type}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="tabular-nums">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#1A1917]">
                    {order.customer_name} &middot;{' '}
                    <span className="font-mono font-normal text-[#645F58]">
                      {order.customer_phone}
                    </span>
                  </p>
                  {order.delivery_address && (
                    <p className="mt-0.5 text-xs text-[#645F58]">
                      Address: {order.delivery_address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-base font-semibold text-[#1A1917] tabular-nums">
                    {formatCurrency(order.total_amount)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as OrderStatus)
                    }
                    aria-label={`Order ${order.order_code} status`}
                    className="min-h-[38px] rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3 text-xs font-medium capitalize text-[#1A1917] focus:border-[#1F4E3D] focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                {order.items.map((item, idx) => (
                  <div key={`${order.id}-${idx}`} className="flex justify-between text-[#1A1917]">
                    <span>
                      <span className="font-mono text-xs text-[#645F58] tabular-nums">
                        {item.quantity}x
                      </span>{' '}
                      {item.name}
                    </span>
                    <span className="font-mono text-xs text-[#645F58] tabular-nums">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                ))}
                {order.notes && (
                  <p className="pt-2 text-xs text-[#645F58]">
                    Kitchen note: <span className="text-[#1A1917]">{order.notes}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
