import type { OrderDeliveryType, OrderItemSnapshot } from '@/src/types';

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = Math.abs(safe).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return safe < 0 ? `-₦${formatted}` : `₦${formatted}`;
}

export function sanitizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '2349027481035';
  if (digits.length === 11 && digits.startsWith('0')) {
    return `234${digits.slice(1)}`;
  }
  return digits;
}

export function formatWhatsAppDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '09027481035';
  if (digits.startsWith('0')) return digits;
  if (digits.startsWith('234') && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }
  return `+${digits}`;
}

export function generateOrderCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `ES-${timestamp}-${suffix}`;
}

export interface WhatsAppMessageParams {
  kitchenName: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  deliveryType: OrderDeliveryType;
  deliveryAddress: string;
  notes: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
}

export function buildWhatsAppOrderText(params: WhatsAppMessageParams): string {
  const lines: string[] = [
    `*New Order — ${params.kitchenName}*`,
    `Order Ref: ${params.orderCode}`,
    '',
    `*Items Ordered:*`,
    ...params.items.map(
      (item) => `• ${item.quantity}x ${item.name} (${formatCurrency(item.line_total)})`
    ),
    '',
    `Subtotal: ${formatCurrency(params.subtotal)}`,
    params.deliveryType === 'delivery'
      ? `Delivery Fee: ${params.deliveryFee === 0 ? 'Free' : formatCurrency(params.deliveryFee)}`
      : `Pickup: Free`,
    `*Total: ${formatCurrency(params.totalAmount)}*`,
    '',
    `*Fulfillment:* ${params.deliveryType === 'delivery' ? 'Delivery' : 'Kitchen Pickup'}`,
    `*Customer:* ${params.customerName}`,
    `*Phone:* ${params.customerPhone}`,
  ];

  if (params.deliveryType === 'delivery' && params.deliveryAddress.trim()) {
    lines.push(`*Delivery Address:* ${params.deliveryAddress.trim()}`);
  }

  if (params.notes.trim()) {
    lines.push(`*Kitchen Notes:* ${params.notes.trim()}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, text: string): string {
  const cleanNumber = sanitizeWhatsAppNumber(phoneNumber);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppInquiryUrl(phoneNumber: string, text: string): string {
  const cleanNumber = sanitizeWhatsAppNumber(phoneNumber);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}
