import {
  FOOD_IMAGES_BUCKET,
  getActiveAdminPassword,
  isSupabaseConfigured,
  supabase,
} from '@/src/lib/supabase';
import { generateOrderCode } from '@/src/lib/whatsapp';
import {
  DEFAULT_STORE_SETTINGS,
  SHOWCASE_CATEGORIES,
  SHOWCASE_FOOD_ITEMS,
} from '@/src/data/showcaseCatalog';
import type {
  Category,
  ContactMessage,
  FoodItem,
  OrderPayload,
  OrderRecord,
  OrderStatus,
  StoreSettings,
} from '@/src/types';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function requireSupabase() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.'
    );
  }
  return supabase;
}

function requireAdminPassword(): string {
  const pwd = getActiveAdminPassword();
  if (!pwd) {
    throw new Error('Admin session expired. Please unlock the admin dashboard again.');
  }
  return pwd;
}

function isMissingRpcError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return (
    err.code === 'PGRST202' ||
    (err.message ?? '').toLowerCase().includes('schema cache') ||
    (err.message ?? '').toLowerCase().includes('could not find the function')
  );
}

function formatWriteError(actionLabel: string, err: { code?: string; message?: string }): Error {
  const msg = err.message ?? 'Unknown database error';
  if (err.code === '42501' || msg.toLowerCase().includes('row-level security')) {
    return new Error(
      `${actionLabel} blocked by Supabase RLS. Run the Admin SQL RPC functions from supabase/schema.sql in your Supabase SQL Editor.`
    );
  }
  return new Error(`${actionLabel}: ${msg}`);
}

export interface CatalogResult<T> {
  items: T[];
  source: 'supabase' | 'showcase';
}

export async function fetchCategories(): Promise<CatalogResult<Category>> {
  if (!supabase || !isSupabaseConfigured) {
    return { items: SHOWCASE_CATEGORIES, source: 'showcase' };
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return {
    items: (data ?? []) as Category[],
    source: 'supabase',
  };
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  sort_order?: number;
}): Promise<Category> {
  const client = requireSupabase();
  const password = requireAdminPassword();
  const payload = {
    name: input.name.trim(),
    slug: input.slug?.trim() || slugify(input.name),
    description: input.description?.trim() ?? '',
    sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
  };

  const { data, error } = await client.rpc('admin_upsert_category', {
    p_password: password,
    p_id: null,
    p_name: payload.name,
    p_slug: payload.slug,
    p_description: payload.description,
    p_sort_order: payload.sort_order,
  });

  if (!error) {
    return data as Category;
  }

  if (isMissingRpcError(error)) {
    const fallback = await client.from('categories').insert(payload).select().single();
    if (!fallback.error) {
      return fallback.data as Category;
    }
    throw formatWriteError('Could not create category', fallback.error);
  }

  throw formatWriteError('Could not create category', error);
}

export async function updateCategory(
  id: string,
  input: {
    name: string;
    slug?: string;
    description?: string;
    sort_order?: number;
  }
): Promise<Category> {
  const client = requireSupabase();
  const password = requireAdminPassword();
  const payload = {
    name: input.name.trim(),
    slug: input.slug?.trim() || slugify(input.name),
    description: input.description?.trim() ?? '',
    sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
  };

  const { data, error } = await client.rpc('admin_upsert_category', {
    p_password: password,
    p_id: id,
    p_name: payload.name,
    p_slug: payload.slug,
    p_description: payload.description,
    p_sort_order: payload.sort_order,
  });

  if (!error) {
    return data as Category;
  }

  if (isMissingRpcError(error)) {
    const fallback = await client
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!fallback.error) {
      return fallback.data as Category;
    }
    throw formatWriteError('Could not update category', fallback.error);
  }

  throw formatWriteError('Could not update category', error);
}

export async function deleteCategory(id: string): Promise<void> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  const { error } = await client.rpc('admin_delete_category', {
    p_password: password,
    p_id: id,
  });

  if (!error) return;

  if (isMissingRpcError(error)) {
    const fallback = await client.from('categories').delete().eq('id', id);
    if (!fallback.error) return;
    throw formatWriteError('Could not delete category', fallback.error);
  }

  throw formatWriteError('Could not delete category', error);
}

interface RawFoodRow {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  image_url: string;
  prep_time_minutes: number;
  dietary_note: string;
  is_available: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
  categories?: { name?: string | null } | null;
}

function mapFoodRow(row: RawFoodRow): FoodItem {
  return {
    id: row.id,
    category_id: row.category_id,
    category_name: row.categories?.name ?? 'Kitchen Special',
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    image_url: row.image_url,
    prep_time_minutes: Number(row.prep_time_minutes) || 15,
    dietary_note: row.dietary_note ?? '',
    is_available: Boolean(row.is_available),
    is_featured: Boolean(row.is_featured),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchFoodItems(): Promise<CatalogResult<FoodItem>> {
  if (!supabase || !isSupabaseConfigured) {
    return { items: SHOWCASE_FOOD_ITEMS, source: 'showcase' };
  }

  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load food items: ${error.message}`);
  }

  return {
    items: ((data ?? []) as RawFoodRow[]).map(mapFoodRow),
    source: 'supabase',
  };
}

export interface FoodItemInput {
  category_id: string | null;
  name: string;
  slug?: string;
  description: string;
  price: number;
  image_url: string;
  prep_time_minutes: number;
  dietary_note: string;
  is_available: boolean;
  is_featured: boolean;
}

export async function createFoodItem(input: FoodItemInput): Promise<FoodItem> {
  const client = requireSupabase();
  const password = requireAdminPassword();
  const baseSlug = input.slug?.trim() || slugify(input.name);
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const payload = {
    category_id: input.category_id || null,
    name: input.name.trim(),
    slug: uniqueSlug,
    description: input.description.trim(),
    price: Number(input.price),
    image_url: input.image_url.trim(),
    prep_time_minutes: Math.max(1, Math.round(Number(input.prep_time_minutes) || 15)),
    dietary_note: input.dietary_note.trim(),
    is_available: input.is_available,
    is_featured: input.is_featured,
  };

  const { data, error } = await client.rpc('admin_upsert_food_item', {
    p_password: password,
    p_id: null,
    p_category_id: payload.category_id,
    p_name: payload.name,
    p_slug: payload.slug,
    p_description: payload.description,
    p_price: payload.price,
    p_image_url: payload.image_url,
    p_prep_time_minutes: payload.prep_time_minutes,
    p_dietary_note: payload.dietary_note,
    p_is_available: payload.is_available,
    p_is_featured: payload.is_featured,
  });

  if (!error) {
    return mapFoodRow(data as RawFoodRow);
  }

  if (isMissingRpcError(error)) {
    const fallback = await client
      .from('food_items')
      .insert(payload)
      .select('*, categories(name)')
      .single();
    if (!fallback.error) {
      return mapFoodRow(fallback.data as RawFoodRow);
    }
    throw formatWriteError('Could not create food item', fallback.error);
  }

  throw formatWriteError('Could not create food item', error);
}

export async function updateFoodItem(id: string, input: Partial<FoodItemInput>): Promise<FoodItem> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  // Fast path for availability toggle
  if (
    input.is_available !== undefined &&
    input.name === undefined &&
    input.price === undefined &&
    input.description === undefined
  ) {
    const { data, error } = await client.rpc('admin_toggle_food_availability', {
      p_password: password,
      p_id: id,
      p_is_available: input.is_available,
    });

    if (!error) {
      return mapFoodRow(data as RawFoodRow);
    }

    if (isMissingRpcError(error)) {
      const fallback = await client
        .from('food_items')
        .update({ is_available: input.is_available })
        .eq('id', id)
        .select('*, categories(name)')
        .single();
      if (!fallback.error) {
        return mapFoodRow(fallback.data as RawFoodRow);
      }
      throw formatWriteError('Could not update availability', fallback.error);
    }

    throw formatWriteError('Could not update availability', error);
  }

  const { data, error } = await client.rpc('admin_upsert_food_item', {
    p_password: password,
    p_id: id,
    p_category_id: input.category_id ?? null,
    p_name: input.name?.trim() ?? '',
    p_slug: '',
    p_description: input.description?.trim() ?? '',
    p_price: input.price !== undefined ? Number(input.price) : null,
    p_image_url: input.image_url?.trim() ?? '',
    p_prep_time_minutes:
      input.prep_time_minutes !== undefined
        ? Math.max(1, Math.round(Number(input.prep_time_minutes) || 15))
        : null,
    p_dietary_note: input.dietary_note?.trim() ?? '',
    p_is_available: input.is_available ?? null,
    p_is_featured: input.is_featured ?? null,
  });

  if (!error) {
    return mapFoodRow(data as RawFoodRow);
  }

  if (isMissingRpcError(error)) {
    const directPayload: Record<string, unknown> = {};
    if (input.category_id !== undefined) directPayload.category_id = input.category_id || null;
    if (input.name !== undefined) directPayload.name = input.name.trim();
    if (input.description !== undefined) directPayload.description = input.description.trim();
    if (input.price !== undefined) directPayload.price = Number(input.price);
    if (input.image_url !== undefined) directPayload.image_url = input.image_url.trim();
    if (input.prep_time_minutes !== undefined) {
      directPayload.prep_time_minutes = Math.max(
        1,
        Math.round(Number(input.prep_time_minutes) || 15)
      );
    }
    if (input.dietary_note !== undefined) directPayload.dietary_note = input.dietary_note.trim();
    if (input.is_available !== undefined) directPayload.is_available = input.is_available;
    if (input.is_featured !== undefined) directPayload.is_featured = input.is_featured;

    const fallback = await client
      .from('food_items')
      .update(directPayload)
      .eq('id', id)
      .select('*, categories(name)')
      .single();
    if (!fallback.error) {
      return mapFoodRow(fallback.data as RawFoodRow);
    }
    throw formatWriteError('Could not update food item', fallback.error);
  }

  throw formatWriteError('Could not update food item', error);
}

export async function deleteFoodItem(id: string): Promise<void> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  const { error } = await client.rpc('admin_delete_food_item', {
    p_password: password,
    p_id: id,
  });

  if (!error) return;

  if (isMissingRpcError(error)) {
    const fallback = await client.from('food_items').delete().eq('id', id);
    if (!fallback.error) return;
    throw formatWriteError('Could not delete food item', fallback.error);
  }

  throw formatWriteError('Could not delete food item', error);
}

export async function uploadFoodImage(file: File): Promise<string> {
  const client = requireSupabase();

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, WebP, or AVIF image file.');
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image size must be 5 MB or smaller.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'dish';
  const filePath = `dishes/${Date.now()}-${cleanName}.${extension}`;

  const { error: uploadError } = await client.storage
    .from(FOOD_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = client.storage.from(FOOD_IMAGES_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Image uploaded, but public URL could not be resolved.');
  }

  return data.publicUrl;
}

export async function createOrderRecord(payload: OrderPayload): Promise<{
  orderCode: string;
  savedToDatabase: boolean;
}> {
  const orderCode = generateOrderCode();

  if (!supabase || !isSupabaseConfigured) {
    return { orderCode, savedToDatabase: false };
  }

  const { error } = await supabase.from('orders').insert({
    order_code: orderCode,
    customer_name: payload.customer_name.trim(),
    customer_phone: payload.customer_phone.trim(),
    delivery_type: payload.delivery_type,
    delivery_address: payload.delivery_address.trim(),
    notes: payload.notes.trim(),
    items: payload.items,
    subtotal: payload.subtotal,
    delivery_fee: payload.delivery_fee,
    total_amount: payload.total_amount,
    status: 'pending',
  });

  if (error) {
    throw new Error(`Could not log order: ${error.message}`);
  }

  return { orderCode, savedToDatabase: true };
}

export async function fetchOrders(): Promise<OrderRecord[]> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  const { data, error } = await client.rpc('admin_get_orders', {
    p_password: password,
  });

  let rows = data as OrderRecord[] | null;

  if (error) {
    if (!isMissingRpcError(error)) {
      throw new Error(`Failed to load orders: ${error.message}`);
    }
    const fallback = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (fallback.error) {
      throw new Error(`Failed to load orders: ${fallback.error.message}`);
    }
    rows = fallback.data as OrderRecord[] | null;
  }

  return (rows ?? []).map((row) => ({
    ...row,
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    total_amount: Number(row.total_amount),
  }));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderRecord> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  const { data, error } = await client.rpc('admin_update_order_status', {
    p_password: password,
    p_id: id,
    p_status: status,
  });

  if (!error) {
    return data as OrderRecord;
  }

  if (isMissingRpcError(error)) {
    const fallback = await client
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (!fallback.error) {
      return fallback.data as OrderRecord;
    }
    throw formatWriteError('Could not update order status', fallback.error);
  }

  throw formatWriteError('Could not update order status', error);
}

export async function submitContactMessage(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<{ savedToDatabase: boolean }> {
  if (!supabase || !isSupabaseConfigured) {
    return { savedToDatabase: false };
  }

  const { error } = await supabase.from('contact_messages').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  });

  if (error) {
    throw new Error(`Could not send message: ${error.message}`);
  }

  return { savedToDatabase: true };
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  const { data, error } = await client.rpc('admin_get_contact_messages', {
    p_password: password,
  });

  if (!error) {
    return (data ?? []) as ContactMessage[];
  }

  if (isMissingRpcError(error)) {
    const fallback = await client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (!fallback.error) {
      return (fallback.data ?? []) as ContactMessage[];
    }
    throw new Error(`Failed to load messages: ${fallback.error.message}`);
  }

  throw new Error(`Failed to load messages: ${error.message}`);
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!supabase || !isSupabaseConfigured) {
    return DEFAULT_STORE_SETTINGS;
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_STORE_SETTINGS;
  }

  const row = data as StoreSettings;
  const resolvedWhatsapp =
    !row.whatsapp_number || row.whatsapp_number === '15552348910'
      ? DEFAULT_STORE_SETTINGS.whatsapp_number
      : row.whatsapp_number;
  const resolvedAddress =
    !row.address || row.address === '418 Alder Street, Portland, OR 97205'
      ? DEFAULT_STORE_SETTINGS.address
      : row.address;
  const resolvedHours =
    !row.opening_hours || row.opening_hours === 'Tue–Sun · 11:30 AM – 10:00 PM'
      ? DEFAULT_STORE_SETTINGS.opening_hours
      : row.opening_hours;

  const rawFee = Number(row.delivery_fee);
  const rawThreshold = Number(row.free_delivery_threshold);

  return {
    ...row,
    whatsapp_number: resolvedWhatsapp,
    address: resolvedAddress,
    opening_hours: resolvedHours,
    delivery_fee:
      !Number.isFinite(rawFee) || rawFee === 4.5
        ? DEFAULT_STORE_SETTINGS.delivery_fee
        : rawFee,
    free_delivery_threshold:
      !Number.isFinite(rawThreshold) || rawThreshold === 45
        ? DEFAULT_STORE_SETTINGS.free_delivery_threshold
        : rawThreshold,
  };
}

export async function updateStoreSettings(
  input: Omit<StoreSettings, 'id' | 'updated_at'>
): Promise<StoreSettings> {
  const client = requireSupabase();
  const password = requireAdminPassword();

  const payload = {
    kitchen_name: input.kitchen_name.trim(),
    whatsapp_number: input.whatsapp_number.replace(/\D/g, ''),
    address: input.address.trim(),
    opening_hours: input.opening_hours.trim(),
    delivery_fee: Number(input.delivery_fee),
    free_delivery_threshold: Number(input.free_delivery_threshold),
  };

  const { data, error } = await client.rpc('admin_update_store_settings', {
    p_password: password,
    p_kitchen_name: payload.kitchen_name,
    p_whatsapp_number: payload.whatsapp_number,
    p_address: payload.address,
    p_opening_hours: payload.opening_hours,
    p_delivery_fee: payload.delivery_fee,
    p_free_delivery_threshold: payload.free_delivery_threshold,
  });

  if (!error) {
    const row = data as StoreSettings;
    return {
      ...row,
      delivery_fee: Number(row.delivery_fee),
      free_delivery_threshold: Number(row.free_delivery_threshold),
    };
  }

  if (isMissingRpcError(error)) {
    const fallback = await client
      .from('store_settings')
      .upsert({ id: 1, ...payload })
      .select()
      .single();
    if (!fallback.error) {
      const row = fallback.data as StoreSettings;
      return {
        ...row,
        delivery_fee: Number(row.delivery_fee),
        free_delivery_threshold: Number(row.free_delivery_threshold),
      };
    }
    throw formatWriteError('Could not update store settings', fallback.error);
  }

  throw formatWriteError('Could not update store settings', error);
}
