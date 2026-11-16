import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const ADMIN_SESSION_KEY = 'ember_salt_admin_passcode';

function normalizeSupabaseUrl(value: string): string {
  if (!value || value.includes('your-project-id')) return '';
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawUrl);

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  rawAnonKey.length > 20 &&
  !rawAnonKey.includes('your-supabase-anon-key');

export function getActiveAdminPassword(): string {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) ?? '';
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, rawAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export const FOOD_IMAGES_BUCKET = 'food-images';
