import { useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FoodImage } from '@/src/components/FoodImage';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';
import {
  buildWhatsAppOrderText,
  buildWhatsAppUrl,
  formatCurrency,
} from '@/src/lib/whatsapp';
import { createOrderRecord } from '@/src/services/menuService';
import type { OrderDeliveryType, OrderItemSnapshot } from '@/src/types';

interface ConfirmedReceipt {
  orderCode: string;
  whatsappUrl: string;
  customerName: string;
  totalAmount: number;
  deliveryType: OrderDeliveryType;
  savedToDatabase: boolean;
}

export function OrderModal() {
  const {
    items,
    subtotal,
    isModalOpen,
    storeSettings,
    closeModal,
    updateQuantity,
    removeItem,
    clearBag,
  } = useCart();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<OrderDeliveryType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [receipt, setReceipt] = useState<ConfirmedReceipt | null>(null);

  useEffect(() => {
    if (!isModalOpen) {
      setErrorMessage('');
    }
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const qualifiesFreeDelivery =
    subtotal >= storeSettings.free_delivery_threshold || subtotal === 0;
  const deliveryFee =
    deliveryType === 'delivery' && !qualifiesFreeDelivery ? storeSettings.delivery_fee : 0;
  const totalAmount = subtotal + deliveryFee;

  const handleClose = () => {
    setReceipt(null);
    closeModal();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Please add at least one dish to your order.');
      return;
    }
    if (customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (customerPhone.replace(/\D/g, '').length < 7) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }
    if (deliveryType === 'delivery' && deliveryAddress.trim().length < 5) {
      setErrorMessage('Please provide a complete delivery street address.');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems: OrderItemSnapshot[] = items.map((entry) => ({
        food_id: entry.food.id,
        name: entry.food.name,
        price: entry.food.price,
        quantity: entry.quantity,
        line_total: Number((entry.food.price * entry.quantity).toFixed(2)),
      }));

      const { orderCode, savedToDatabase } = await createOrderRecord({
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : '',
        notes,
        items: orderItems,
        subtotal: Number(subtotal.toFixed(2)),
        delivery_fee: Number(deliveryFee.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
      });

      const messageText = buildWhatsAppOrderText({
        kitchenName: storeSettings.kitchen_name,
        orderCode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim(),
        items: orderItems,
        subtotal,
        deliveryFee,
        totalAmount,
      });

      const whatsappUrl = buildWhatsAppUrl(storeSettings.whatsapp_number, messageText);

      setReceipt({
        orderCode,
        whatsappUrl,
        customerName: customerName.trim(),
        totalAmount,
        deliveryType,
        savedToDatabase,
      });

      clearBag();
      showToast(
        'success',
        `Order ${orderCode} ready`,
        'Click "Open WhatsApp" below if WhatsApp did not launch automatically.'
      );

      // Launch WhatsApp cleanly via anchor navigation for desktop & mobile compatibility
      const anchor = document.createElement('a');
      anchor.href = whatsappUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit order.';
      setErrorMessage(msg);
      showToast('error', 'Order could not be processed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-[#FAF9F7] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6E1D8] bg-white px-6 py-4">
          <div>
            <h2 id="order-modal-title" className="font-display text-xl font-semibold text-[#1A1917]">
              {receipt ? 'Order Ready for WhatsApp' : 'Your Order Bag'}
            </h2>
            {!receipt && (
              <p className="text-xs text-[#645F58]">
                Free local delivery on orders {formatCurrency(storeSettings.free_delivery_threshold)}+
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close order modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#645F58] hover:bg-[#F2EFE9] hover:text-[#1A1917] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {receipt ? (
            <div className="rounded-xl border border-[#E6E1D8] bg-white p-6">
              <div className="flex items-center gap-3 text-[#1F4E3D]">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1A1917]">
                    Order #{receipt.orderCode} Prepared
                  </p>
                  <p className="text-xs text-[#645F58]">
                    {receipt.savedToDatabase
                      ? 'Logged to kitchen queue and formatted for WhatsApp.'
                      : 'Formatted for direct WhatsApp kitchen confirmation.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-[#E6E1D8] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#645F58]">Customer</span>
                  <span className="font-medium text-[#1A1917]">{receipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#645F58]">Fulfillment</span>
                  <span className="font-medium capitalize text-[#1A1917]">
                    {receipt.deliveryType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#645F58]">Total Due</span>
                  <span className="font-mono font-semibold text-[#1A1917] tabular-nums">
                    {formatCurrency(receipt.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={receipt.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#1F4E3D] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#173B2E]"
                >
                  <span>Send Order on WhatsApp</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-4 py-2 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2EFE9] text-[#645F58]">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#1A1917]">
                Your order bag is empty
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-[#645F58]">
                Explore our wood-fired mains, handmade pastas, and harvest bowls to start an order.
              </p>
              <Link
                to="/menu"
                onClick={handleClose}
                className="mt-6 inline-flex min-h-[40px] items-center rounded-lg bg-[#1F4E3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#173B2E]"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <form id="whatsapp-order-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Items List */}
              <div className="divide-y divide-[#E6E1D8] rounded-xl border border-[#E6E1D8] bg-white">
                {items.map(({ food, quantity }) => (
                  <div key={food.id} className="flex items-center gap-3.5 p-3.5">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F2EFE9]">
                      <FoodImage
                        src={food.image_url}
                        alt={food.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1A1917]">{food.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-[#645F58] tabular-nums">
                        {formatCurrency(food.price)} each
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(food.id, quantity - 1)}
                          aria-label={`Decrease ${food.name} quantity`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E1D8] bg-[#FAF9F7] text-[#1A1917] hover:bg-[#F2EFE9]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-medium tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(food.id, quantity + 1)}
                          aria-label={`Increase ${food.name} quantity`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E1D8] bg-[#FAF9F7] text-[#1A1917] hover:bg-[#F2EFE9]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-mono text-sm font-semibold text-[#1A1917] tabular-nums">
                        {formatCurrency(food.price * quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(food.id)}
                        aria-label={`Remove ${food.name}`}
                        className="text-[#645F58] hover:text-[#B91C1C] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fulfillment Mode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#645F58]">
                  Fulfillment Method
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-[#F2EFE9] p-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`min-h-[38px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      deliveryType === 'delivery'
                        ? 'bg-white text-[#1A1917] shadow-sm'
                        : 'text-[#645F58] hover:text-[#1A1917]'
                    }`}
                  >
                    Local Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`min-h-[38px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      deliveryType === 'pickup'
                        ? 'bg-white text-[#1A1917] shadow-sm'
                        : 'text-[#645F58] hover:text-[#1A1917]'
                    }`}
                  >
                    Kitchen Pickup
                  </button>
                </div>
              </div>

              {/* Customer Verification Fields */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="order-name"
                    className="block text-sm font-medium text-[#1A1917]"
                  >
                    Full Name <span className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="order-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jordan Alvarez"
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-white px-3.5 py-2.5 text-sm text-[#1A1917] placeholder:text-[#9A938A] focus:border-[#1F4E3D] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-phone"
                    className="block text-sm font-medium text-[#1A1917]"
                  >
                    Phone Number (WhatsApp) <span className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="order-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (503) 555-0194"
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-white px-3.5 py-2.5 text-sm text-[#1A1917] placeholder:text-[#9A938A] focus:border-[#1F4E3D] focus:outline-none"
                  />
                </div>

                {deliveryType === 'delivery' && (
                  <div>
                    <label
                      htmlFor="order-address"
                      className="block text-sm font-medium text-[#1A1917]"
                    >
                      Delivery Street Address <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="order-address"
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="1240 NW Flanders St, Apt 4B"
                      className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-white px-3.5 py-2.5 text-sm text-[#1A1917] placeholder:text-[#9A938A] focus:border-[#1F4E3D] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="order-notes"
                    className="block text-sm font-medium text-[#1A1917]"
                  >
                    Dietary or Kitchen Notes
                  </label>
                  <textarea
                    id="order-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Medium-rare ribeye, dressing on the side..."
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-white px-3.5 py-2 text-sm text-[#1A1917] placeholder:text-[#9A938A] focus:border-[#1F4E3D] focus:outline-none"
                  />
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
                >
                  {errorMessage}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer Totals & Submit */}
        {!receipt && items.length > 0 && (
          <div className="border-t border-[#E6E1D8] bg-white px-6 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#645F58]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#645F58]">
                <span>{deliveryType === 'delivery' ? 'Local Delivery' : 'Kitchen Pickup'}</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E6E1D8] pt-2 text-base font-semibold text-[#1A1917]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="whatsapp-order-form"
              disabled={submitting}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#1F4E3D] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#173B2E] disabled:opacity-60"
            >
              <span>{submitting ? 'Preparing WhatsApp Order...' : 'Complete Order on WhatsApp'}</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
