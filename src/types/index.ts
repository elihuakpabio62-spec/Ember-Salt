export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  created_at?: string;
}

export interface FoodItem {
  id: string;
  category_id: string | null;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  prep_time_minutes: number;
  dietary_note: string;
  is_available: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

export type OrderDeliveryType = 'delivery' | 'pickup';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled';

export interface OrderItemSnapshot {
  food_id: string;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  delivery_type: OrderDeliveryType;
  delivery_address: string;
  notes: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
}

export interface OrderRecord extends OrderPayload {
  id: string;
  order_code: string;
  status: OrderStatus;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  kitchen_name: string;
  whatsapp_number: string;
  address: string;
  opening_hours: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  updated_at?: string;
}

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}
