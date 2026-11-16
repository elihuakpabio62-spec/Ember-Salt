import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { FoodImage } from '@/src/components/FoodImage';
import { useToast } from '@/src/context/ToastContext';
import { formatCurrency } from '@/src/lib/whatsapp';
import {
  createFoodItem,
  deleteFoodItem,
  fetchCategories,
  fetchFoodItems,
  updateFoodItem,
  uploadFoodImage,
} from '@/src/services/menuService';
import type { Category, FoodItem } from '@/src/types';

interface FoodFormState {
  name: string;
  category_id: string;
  price: string;
  prep_time_minutes: string;
  dietary_note: string;
  description: string;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
}

const EMPTY_FORM: FoodFormState = {
  name: '',
  category_id: '',
  price: '',
  prep_time_minutes: '15',
  dietary_note: '',
  description: '',
  image_url: '',
  is_available: true,
  is_featured: false,
};

export function AdminFoodItemsPage() {
  const { showToast } = useToast();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [form, setForm] = useState<FoodFormState>(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deletingItem, setDeletingItem] = useState<FoodItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [foodRes, catRes] = await Promise.all([fetchFoodItems(), fetchCategories()]);
      setFoods(foodRes.items);
      setCategories(catRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load food items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return foods.filter((item) => {
      if (categoryFilter !== 'all' && item.category_id !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.category_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [foods, searchQuery, categoryFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category_id: item.category_id ?? '',
      price: String(item.price),
      prep_time_minutes: String(item.prep_time_minutes),
      dietary_note: item.dietary_note ?? '',
      description: item.description,
      image_url: item.image_url,
      is_available: item.is_available,
      is_featured: item.is_featured,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setUploadingImage(true);
    try {
      const publicUrl = await uploadFoodImage(file);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      showToast('success', 'Image uploaded', 'Stored in Supabase food-images bucket.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed.';
      setFormError(msg);
      showToast('error', 'Upload failed', msg);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const sanitizedPrice = form.price.replace(/,/g, '').trim();
    const parsedPrice = Number(sanitizedPrice);
    const parsedPrep = Number(form.prep_time_minutes);

    if (form.name.trim().length < 2) {
      setFormError('Dish name must be at least 2 characters.');
      return;
    }
    if (!sanitizedPrice || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError('Please enter a valid price.');
      return;
    }
    if (!Number.isFinite(parsedPrep) || parsedPrep < 1) {
      setFormError('Prep time must be at least 1 minute.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category_id: form.category_id || null,
        price: parsedPrice,
        prep_time_minutes: parsedPrep,
        dietary_note: form.dietary_note,
        description: form.description,
        image_url: form.image_url,
        is_available: form.is_available,
        is_featured: form.is_featured,
      };

      if (editingItem) {
        const updated = await updateFoodItem(editingItem.id, payload);
        setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        showToast('success', 'Dish updated', `${updated.name} has been saved.`);
      } else {
        const created = await createFoodItem(payload);
        setFoods((prev) => [created, ...prev]);
        showToast('success', 'Dish created', `${created.name} is now on the menu.`);
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save dish.';
      setFormError(msg);
      showToast('error', 'Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      const updated = await updateFoodItem(item.id, { is_available: !item.is_available });
      setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showToast(
        'info',
        updated.is_available ? `${updated.name} marked available` : `${updated.name} marked sold out`
      );
    } catch (err) {
      showToast('error', 'Update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteFoodItem(deletingItem.id);
      setFoods((prev) => prev.filter((f) => f.id !== deletingItem.id));
      showToast('success', 'Dish deleted', `${deletingItem.name} was removed from the menu.`);
      setDeletingItem(null);
    } catch (err) {
      showToast('error', 'Delete failed', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#1A1917]">Food Items</h1>
          <p className="mt-1 text-sm text-[#645F58]">
            Create, edit, upload photography, and toggle daily dish availability.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white hover:bg-[#173B2E] whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Add Food Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#645F58]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes..."
            className="min-h-[40px] w-full rounded-lg border border-[#E6E1D8] bg-white py-2 pl-9 pr-3 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="min-h-[40px] rounded-lg border border-[#E6E1D8] bg-white px-3.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[#B91C1C]/30 bg-white p-4">
          <p className="text-sm text-[#B91C1C]">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="rounded-lg border border-[#E6E1D8] px-3 py-1.5 text-xs font-medium text-[#1A1917]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Food Table */}
      <div className="overflow-hidden rounded-xl border border-[#E6E1D8] bg-white">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-[#F2EFE9]" />
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="font-display text-lg font-semibold text-[#1A1917]">No dishes found</h2>
            <p className="mt-1 text-sm text-[#645F58]">
              {foods.length === 0
                ? 'Start building your menu by adding your first wood-fired dish.'
                : 'No dishes match your active search or category filter.'}
            </p>
            {foods.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white hover:bg-[#173B2E]"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Dish</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6E1D8] text-xs font-medium text-[#645F58]">
                  <th className="px-5 py-3.5">Dish</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Prep</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Price</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D8]">
                {filteredFoods.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF9F7]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F2EFE9]">
                          <FoodImage
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#1A1917]">{item.name}</p>
                          <p className="max-w-xs truncate text-xs text-[#645F58]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#645F58] whitespace-nowrap">
                      {item.category_name || 'Uncategorized'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#645F58] tabular-nums whitespace-nowrap">
                      {item.prep_time_minutes} min
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          item.is_available
                            ? 'border-[#16A34A]/30 bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]'
                            : 'border-[#B91C1C]/30 bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-[#1A1917] tabular-nums whitespace-nowrap">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          aria-label={`Edit ${item.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#645F58] hover:bg-[#F2EFE9] hover:text-[#1A1917]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          aria-label={`Delete ${item.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#645F58] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="food-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E6E1D8] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-4">
              <h2 id="food-modal-title" className="font-display text-xl font-semibold text-[#1A1917]">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#645F58] hover:bg-[#F2EFE9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label htmlFor="dish-name" className="block text-sm font-medium text-[#1A1917]">
                  Dish Name <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="dish-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Oak-Fired Prime Ribeye"
                  className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="dish-category" className="block text-sm font-medium text-[#1A1917]">
                    Category
                  </label>
                  <select
                    id="dish-category"
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dish-price" className="block text-sm font-medium text-[#1A1917]">
                    Price (NGN &#8358;) <span className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="dish-price"
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="10,000.00"
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="dish-prep" className="block text-sm font-medium text-[#1A1917]">
                    Prep Time (minutes)
                  </label>
                  <input
                    id="dish-prep"
                    type="number"
                    min="1"
                    value={form.prep_time_minutes}
                    onChange={(e) => setForm((p) => ({ ...p, prep_time_minutes: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="dish-dietary" className="block text-sm font-medium text-[#1A1917]">
                    Dietary Note
                  </label>
                  <input
                    id="dish-dietary"
                    type="text"
                    value={form.dietary_note}
                    onChange={(e) => setForm((p) => ({ ...p, dietary_note: e.target.value }))}
                    placeholder="Gluten-Free, Vegan, etc."
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dish-desc" className="block text-sm font-medium text-[#1A1917]">
                  Description
                </label>
                <textarea
                  id="dish-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe ingredients, preparation method, and accompaniments..."
                  className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Supabase Storage Image Upload */}
              <div className="rounded-xl border border-[#E6E1D8] bg-[#FAF9F7] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#1A1917]">Dish Photography</p>
                    <p className="text-xs text-[#645F58]">
                      Upload to Supabase Storage (JPG, PNG, WebP up to 5MB) or paste a URL.
                    </p>
                  </div>
                  <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-[#E6E1D8] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1A1917] hover:bg-[#F2EFE9] whitespace-nowrap">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploadingImage}
                      onChange={handleImageFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {form.image_url && (
                  <div className="mt-3 aspect-[16/9] w-44 overflow-hidden rounded-lg border border-[#E6E1D8] bg-white">
                    <FoodImage
                      src={form.image_url}
                      alt={form.name || 'Dish preview'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://.../storage/v1/object/public/food-images/..."
                  aria-label="Image URL"
                  className="mt-3 w-full rounded-lg border border-[#E6E1D8] bg-white px-3 py-2 text-xs text-[#1A1917] focus:border-[#1F4E3D] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1A1917]">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#1F4E3D]"
                  />
                  <span>Available for ordering</span>
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1A1917]">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#1F4E3D]"
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#B91C1C]"
                >
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[#E6E1D8] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[40px] rounded-lg border border-[#E6E1D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="min-h-[40px] rounded-lg bg-[#1F4E3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#173B2E] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E6E1D8] bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-[#1A1917]">Delete Dish?</h2>
            <p className="mt-2 text-sm text-[#645F58]">
              Are you sure you want to permanently remove{' '}
              <span className="font-semibold text-[#1A1917]">{deletingItem.name}</span> from your
              Supabase menu?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="min-h-[40px] rounded-lg border border-[#E6E1D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="min-h-[40px] rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#991B1B] disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete Dish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
