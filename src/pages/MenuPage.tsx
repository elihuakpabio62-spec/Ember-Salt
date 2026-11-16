import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { FoodCard } from '@/src/components/FoodCard';
import { fetchCategories, fetchFoodItems } from '@/src/services/menuService';
import type { Category, FoodItem } from '@/src/types';

export function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, foodRes] = await Promise.all([fetchCategories(), fetchFoodItems()]);
      setCategories(catRes.items);
      setFoodItems(foodRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return foodItems.filter((item) => {
      if (availableOnly && !item.is_available) return false;
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.category_name ?? '').toLowerCase().includes(query) ||
        (item.dietary_note ?? '').toLowerCase().includes(query)
      );
    });
  }, [foodItems, availableOnly, selectedCategory, searchQuery]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setAvailableOnly(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E6E1D8] pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1F4E3D]">
          Seasonal Menu
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1A1917]">
              Prepared Fresh to Order
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#645F58]">
              Select individual dishes to send straight to WhatsApp or build a shared bag for
              delivery and pickup.
            </p>
          </div>
          <p className="font-mono text-xs text-[#645F58] tabular-nums">
            {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'} shown
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#F2EFE9] p-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`min-h-[36px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-white text-[#1A1917] shadow-sm'
                  : 'text-[#645F58] hover:text-[#1A1917]'
              }`}
            >
              All Dishes
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[36px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-white text-[#1A1917] shadow-sm'
                    : 'text-[#645F58] hover:text-[#1A1917]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#645F58]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes or ingredients..."
                aria-label="Search menu items"
                className="min-h-[40px] w-full rounded-lg border border-[#E6E1D8] bg-white py-2 pl-9 pr-8 text-sm text-[#1A1917] placeholder:text-[#9A938A] focus:border-[#1F4E3D] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#645F58] hover:text-[#1A1917]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-[#E6E1D8] bg-white px-3.5 text-xs font-medium text-[#1A1917] whitespace-nowrap shrink-0">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4 w-4 rounded border-[#E6E1D8] accent-[#1F4E3D]"
              />
              <span>Available only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-[#E6E1D8] bg-white"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-[#EFECE5]" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-[#EFECE5]" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-[#EFECE5]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#EFECE5]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-[#E6E1D8] bg-white p-10 text-center">
          <p className="text-sm font-medium text-[#B91C1C]">{error}</p>
          <button
            type="button"
            onClick={loadMenu}
            className="mt-4 inline-flex min-h-[40px] items-center rounded-lg bg-[#1F4E3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#173B2E]"
          >
            Try Again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-10 rounded-xl border border-[#E6E1D8] bg-white p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-[#1A1917]">
            No dishes match your filter
          </h2>
          <p className="mt-2 text-sm text-[#645F58]">
            Try clearing your search term or switching back to all categories.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 inline-flex min-h-[40px] items-center rounded-lg bg-[#1F4E3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#173B2E]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((dish) => (
            <FoodCard key={dish.id} food={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
