import { Plus } from 'lucide-react';
import { FoodImage } from '@/src/components/FoodImage';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';
import { formatCurrency } from '@/src/lib/whatsapp';
import type { FoodItem } from '@/src/types';

interface FoodCardProps {
  food: FoodItem;
}

export function FoodCard({ food }: FoodCardProps) {
  const { addToBag, orderNowSingle } = useCart();
  const { showToast } = useToast();

  const handleAddToBag = () => {
    addToBag(food, 1);
    showToast('success', `${food.name} added to bag`, 'Open your Order Bag anytime to checkout.');
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#E6E1D8] bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFE9]">
        <FoodImage
          src={food.image_url}
          alt={food.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!food.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4 text-center">
            <span className="text-sm font-semibold tracking-wide text-white">
              Sold Out Today
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Zero-pill clean unboxed metadata line */}
        <div className="flex items-center gap-2 text-xs text-[#645F58]">
          <span className="truncate">{food.category_name || 'Kitchen Special'}</span>
          <span aria-hidden="true">&middot;</span>
          <span className="shrink-0 tabular-nums">{food.prep_time_minutes} min</span>
          {food.dietary_note && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="truncate">{food.dietary_note}</span>
            </>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug text-[#1A1917]">
            {food.name}
          </h3>
          <span className="shrink-0 font-mono text-base font-medium text-[#1A1917] tabular-nums">
            {formatCurrency(food.price)}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#645F58]">
          {food.description}
        </p>

        <div className="mt-5 flex items-center gap-2.5 border-t border-[#E6E1D8]/70 pt-4">
          <button
            type="button"
            disabled={!food.is_available}
            onClick={() => orderNowSingle(food)}
            className="flex-1 min-h-[40px] rounded-lg bg-[#1F4E3D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#173B2E] disabled:cursor-not-allowed disabled:bg-[#D6D1C7] disabled:text-[#645F58] whitespace-nowrap"
          >
            {food.is_available ? 'Order Now' : 'Unavailable'}
          </button>
          <button
            type="button"
            disabled={!food.is_available}
            onClick={handleAddToBag}
            aria-label={`Add ${food.name} to order bag`}
            className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2 text-sm font-medium text-[#1A1917] transition-colors hover:bg-[#F2EFE9] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
