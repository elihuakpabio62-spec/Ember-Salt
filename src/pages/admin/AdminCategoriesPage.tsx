import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/src/context/ToastContext';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchFoodItems,
  slugify,
  updateCategory,
} from '@/src/services/menuService';
import type { Category, FoodItem } from '@/src/types';

export function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, foodRes] = await Promise.all([fetchCategories(), fetchFoodItems()]);
      setCategories(catRes.items);
      setFoods(foodRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dishCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const dish of foods) {
      if (dish.category_id) {
        counts[dish.category_id] = (counts[dish.category_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [foods]);

  const openCreate = () => {
    setEditingCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setSortOrder(String(categories.length + 1));
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? '');
    setSortOrder(String(cat.sort_order ?? 0));
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (name.trim().length < 2) {
      setFormError('Category name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        description,
        sort_order: Number(sortOrder) || 0,
      };
      if (editingCat) {
        const updated = await updateCategory(editingCat.id, payload);
        setCategories((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        showToast('success', 'Category updated', updated.name);
      } else {
        const created = await createCategory(payload);
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
        showToast('success', 'Category created', created.name);
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save category.';
      setFormError(msg);
      showToast('error', 'Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCat) return;
    setDeleting(true);
    try {
      await deleteCategory(deletingCat.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCat.id));
      showToast('success', 'Category deleted', deletingCat.name);
      setDeletingCat(null);
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
          <h1 className="font-display text-3xl font-semibold text-[#1A1917]">Categories</h1>
          <p className="mt-1 text-sm text-[#645F58]">
            Organize menu sections and control display order on the public storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white hover:bg-[#173B2E] whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
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

      <div className="overflow-hidden rounded-xl border border-[#E6E1D8] bg-white">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-[#F2EFE9]" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="font-display text-lg font-semibold text-[#1A1917]">
              No categories yet
            </h2>
            <p className="mt-1 text-sm text-[#645F58]">
              Create categories like Wood-Fired Mains, Handmade Pasta, or Desserts.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white hover:bg-[#173B2E]"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Category</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6E1D8] text-xs font-medium text-[#645F58]">
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5 text-right">Dishes</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D8]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#FAF9F7]">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#645F58] tabular-nums">
                      {cat.sort_order}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#1A1917]">{cat.name}</p>
                      {cat.description && (
                        <p className="max-w-md truncate text-xs text-[#645F58]">{cat.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#645F58]">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-[#1A1917] tabular-nums">
                      {dishCounts[cat.id] ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          aria-label={`Edit ${cat.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#645F58] hover:bg-[#F2EFE9] hover:text-[#1A1917]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCat(cat)}
                          aria-label={`Delete ${cat.name}`}
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

      {/* Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E6E1D8] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-4">
              <h2 className="font-display text-xl font-semibold text-[#1A1917]">
                {editingCat ? 'Edit Category' : 'Add Category'}
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
                <label htmlFor="cat-name" className="block text-sm font-medium text-[#1A1917]">
                  Category Name <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setName(nextName);
                    if (!editingCat) setSlug(slugify(nextName));
                  }}
                  placeholder="Wood-Fired Mains"
                  className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cat-slug" className="block text-sm font-medium text-[#1A1917]">
                    URL Slug
                  </label>
                  <input
                    id="cat-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="wood-fired-mains"
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-xs text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cat-order" className="block text-sm font-medium text-[#1A1917]">
                    Sort Order
                  </label>
                  <input
                    id="cat-order"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cat-desc" className="block text-sm font-medium text-[#1A1917]">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional section summary..."
                  className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#B91C1C]">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-[#E6E1D8] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[40px] rounded-lg border border-[#E6E1D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] rounded-lg bg-[#1F4E3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#173B2E] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingCat ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E6E1D8] bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-[#1A1917]">Delete Category?</h2>
            <p className="mt-2 text-sm text-[#645F58]">
              Removing <span className="font-semibold text-[#1A1917]">{deletingCat.name}</span>{' '}
              will keep any linked food items in your catalog as uncategorized.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="min-h-[40px] rounded-lg border border-[#E6E1D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1917]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="min-h-[40px] rounded-lg bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#991B1B]"
              >
                {deleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
