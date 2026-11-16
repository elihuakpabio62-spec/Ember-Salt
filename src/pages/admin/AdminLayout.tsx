import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Check, Copy, Menu, RefreshCw } from 'lucide-react';
import { AdminSidebar } from '@/src/components/admin/AdminSidebar';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/menu': 'Food Items',
  '/admin/categories': 'Categories',
  '/admin/orders': 'Customer Orders',
  '/admin/messages': 'Contact Inquiries',
  '/admin/settings': 'Store Settings',
};

const ADMIN_RPC_SQL = `create or replace function public.assert_admin_password(p_password text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_password, '') <> 'Mamaputnigeria' then
    raise exception 'Invalid admin password';
  end if;
end;
$$;

create or replace function public.verify_admin_password(p_password text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce(p_password, '') = 'Mamaputnigeria';
$$;

create or replace function public.admin_upsert_category(
  p_password text, p_id uuid default null, p_name text default '',
  p_slug text default '', p_description text default '', p_sort_order integer default 0
) returns public.categories language plpgsql security definer set search_path = public as $$
declare v_row public.categories;
begin
  perform public.assert_admin_password(p_password);
  if p_id is null then
    insert into public.categories (name, slug, description, sort_order)
    values (trim(p_name), trim(p_slug), coalesce(trim(p_description), ''), coalesce(p_sort_order, 0))
    returning * into v_row;
  else
    update public.categories
    set name = trim(p_name), slug = trim(p_slug),
        description = coalesce(trim(p_description), ''), sort_order = coalesce(p_sort_order, 0)
    where id = p_id returning * into v_row;
  end if;
  return v_row;
end;
$$;

create or replace function public.admin_delete_category(p_password text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin_password(p_password);
  delete from public.categories where id = p_id;
end;
$$;

create or replace function public.admin_upsert_food_item(
  p_password text, p_id uuid default null, p_category_id uuid default null,
  p_name text default '', p_slug text default '', p_description text default '',
  p_price numeric default 0, p_image_url text default '', p_prep_time_minutes integer default 15,
  p_dietary_note text default '', p_is_available boolean default true, p_is_featured boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.food_items; v_cat_name text;
begin
  perform public.assert_admin_password(p_password);
  if p_id is null then
    insert into public.food_items (category_id, name, slug, description, price, image_url, prep_time_minutes, dietary_note, is_available, is_featured)
    values (p_category_id, trim(p_name), trim(p_slug), coalesce(trim(p_description), ''), p_price, coalesce(trim(p_image_url), ''), greatest(1, coalesce(p_prep_time_minutes, 15)), coalesce(trim(p_dietary_note), ''), coalesce(p_is_available, true), coalesce(p_is_featured, false))
    returning * into v_row;
  else
    update public.food_items
    set category_id = p_category_id, name = coalesce(nullif(trim(p_name), ''), name),
        description = coalesce(p_description, description), price = coalesce(p_price, price),
        image_url = coalesce(p_image_url, image_url), prep_time_minutes = greatest(1, coalesce(p_prep_time_minutes, prep_time_minutes)),
        dietary_note = coalesce(p_dietary_note, dietary_note), is_available = coalesce(p_is_available, is_available),
        is_featured = coalesce(p_is_featured, is_featured)
    where id = p_id returning * into v_row;
  end if;
  select name into v_cat_name from public.categories where id = v_row.category_id;
  return to_jsonb(v_row) || jsonb_build_object('categories', jsonb_build_object('name', v_cat_name));
end;
$$;

create or replace function public.admin_toggle_food_availability(p_password text, p_id uuid, p_is_available boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.food_items; v_cat_name text;
begin
  perform public.assert_admin_password(p_password);
  update public.food_items set is_available = p_is_available where id = p_id returning * into v_row;
  select name into v_cat_name from public.categories where id = v_row.category_id;
  return to_jsonb(v_row) || jsonb_build_object('categories', jsonb_build_object('name', v_cat_name));
end;
$$;

create or replace function public.admin_delete_food_item(p_password text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin_password(p_password);
  delete from public.food_items where id = p_id;
end;
$$;

create or replace function public.admin_get_orders(p_password text)
returns setof public.orders language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin_password(p_password);
  return query select * from public.orders order by created_at desc;
end;
$$;

create or replace function public.admin_update_order_status(p_password text, p_id uuid, p_status text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare v_row public.orders;
begin
  perform public.assert_admin_password(p_password);
  update public.orders set status = p_status where id = p_id returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_get_contact_messages(p_password text)
returns setof public.contact_messages language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin_password(p_password);
  return query select * from public.contact_messages order by created_at desc;
end;
$$;

create or replace function public.admin_update_store_settings(
  p_password text, p_kitchen_name text, p_whatsapp_number text,
  p_address text, p_opening_hours text, p_delivery_fee numeric, p_free_delivery_threshold numeric
) returns public.store_settings language plpgsql security definer set search_path = public as $$
declare v_row public.store_settings;
begin
  perform public.assert_admin_password(p_password);
  insert into public.store_settings (id, kitchen_name, whatsapp_number, address, opening_hours, delivery_fee, free_delivery_threshold)
  values (1, trim(p_kitchen_name), trim(p_whatsapp_number), trim(p_address), trim(p_opening_hours), p_delivery_fee, p_free_delivery_threshold)
  on conflict (id) do update set
    kitchen_name = excluded.kitchen_name, whatsapp_number = excluded.whatsapp_number,
    address = excluded.address, opening_hours = excluded.opening_hours,
    delivery_fee = excluded.delivery_fee, free_delivery_threshold = excluded.free_delivery_threshold
  returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.verify_admin_password(text) to anon, authenticated;
grant execute on function public.admin_upsert_category(text, uuid, text, text, text, integer) to anon, authenticated;
grant execute on function public.admin_delete_category(text, uuid) to anon, authenticated;
grant execute on function public.admin_upsert_food_item(text, uuid, uuid, text, text, text, numeric, text, integer, text, boolean, boolean) to anon, authenticated;
grant execute on function public.admin_toggle_food_availability(text, uuid, boolean) to anon, authenticated;
grant execute on function public.admin_delete_food_item(text, uuid) to anon, authenticated;
grant execute on function public.admin_get_orders(text) to anon, authenticated;
grant execute on function public.admin_update_order_status(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_get_contact_messages(text) to anon, authenticated;
grant execute on function public.admin_update_store_settings(text, text, text, text, text, numeric, numeric) to anon, authenticated;

drop policy if exists "Authenticated admins upload food images" on storage.objects;
create policy "Authenticated admins upload food images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'food-images');
drop policy if exists "Authenticated admins update food images" on storage.objects;
create policy "Authenticated admins update food images" on storage.objects for update to anon, authenticated using (bucket_id = 'food-images');
drop policy if exists "Authenticated admins delete food images" on storage.objects;
create policy "Authenticated admins delete food images" on storage.objects for delete to anon, authenticated using (bucket_id = 'food-images');

notify pgrst, 'reload schema';`;

export function AdminLayout() {
  const { isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rpcMissing, setRpcMissing] = useState(false);
  const [checkingRpc, setCheckingRpc] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const location = useLocation();

  const checkAdminRpcs = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) return;
    setCheckingRpc(true);
    try {
      const { error } = await supabase.rpc('admin_get_orders', { p_password: '' });
      if (
        error &&
        (error.code === 'PGRST202' ||
          error.message.toLowerCase().includes('schema cache') ||
          error.message.toLowerCase().includes('could not find the function'))
      ) {
        setRpcMissing(true);
      } else {
        setRpcMissing(false);
      }
    } catch {
      setRpcMissing(false);
    } finally {
      setCheckingRpc(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkAdminRpcs();
    }
  }, [isAuthenticated, checkAdminRpcs]);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_RPC_SQL);
      setCopiedSql(true);
      showToast(
        'success',
        'Admin SQL copied',
        'Paste and run it in Supabase SQL Editor, then click Re-check.'
      );
      window.setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      showToast('error', 'Clipboard unavailable', 'Copy the SQL script from supabase/schema.sql.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#E6E1D8] border-t-[#1F4E3D]" />
          <p className="mt-3 text-sm text-[#645F58]">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[#FAF9F7] text-[#1A1917]">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[#E6E1D8] bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E1D8] text-[#1A1917] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#645F58]">Admin</span>
              <span className="text-[#9A938A]">/</span>
              <span className="font-semibold text-[#1A1917]">{pageTitle}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {rpcMissing && (
              <div className="rounded-xl border border-[#D97706]/40 bg-white p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display text-base font-semibold text-[#1A1917]">
                      Finish Supabase Admin Setup
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#645F58]">
                      Your tables are connected, but the password-verified admin SQL functions are
                      not installed in Supabase yet. Copy and run this SQL in your Supabase SQL
                      Editor to enable creating/editing dishes, categories, and order updates.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1F4E3D] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#173B2E] whitespace-nowrap"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied SQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Admin SQL</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={checkAdminRpcs}
                      disabled={checkingRpc}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3 py-1.5 text-xs font-medium text-[#1A1917] hover:bg-[#F2EFE9] whitespace-nowrap"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${checkingRpc ? 'animate-spin' : ''}`} />
                      <span>Re-check</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
