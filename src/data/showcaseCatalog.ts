import { BUNDLED_IMAGES } from '@/src/lib/images';
import type { Category, FoodItem, StoreSettings } from '@/src/types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  kitchen_name: 'Ember & Salt',
  whatsapp_number: (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim() || '09027481035',
  address: 'Ako Palace Express, No. 2 Ojiaka Street, Lagos',
  opening_hours: 'Monday - Friday · 7:00am - 10:00pm',
  delivery_fee: 1500,
  free_delivery_threshold: 25000,
};

export const SHOWCASE_CATEGORIES: Category[] = [
  {
    id: 'cat-wood-fired',
    name: 'Wood-Fired Mains',
    slug: 'wood-fired-mains',
    description: 'Oak-ember roasted cuts, wild seafood, and hearth specialties.',
    sort_order: 1,
  },
  {
    id: 'cat-pasta',
    name: 'Handmade Pasta',
    slug: 'handmade-pasta',
    description: 'Fresh daily extruded and hand-cut pasta with seasonal sauces.',
    sort_order: 2,
  },
  {
    id: 'cat-bowls',
    name: 'Harvest Bowls',
    slug: 'harvest-bowls',
    description: 'Charred seasonal vegetables, heirloom grains, and vibrant dressings.',
    sort_order: 3,
  },
  {
    id: 'cat-burgers',
    name: 'Hearth Burgers',
    slug: 'hearth-burgers',
    description: 'Dry-aged grass-fed patties on house-baked toasted brioche.',
    sort_order: 4,
  },
  {
    id: 'cat-desserts',
    name: 'Patisserie & Desserts',
    slug: 'patisserie-desserts',
    description: 'Small-batch sweet finishes crafted in our pastry kitchen.',
    sort_order: 5,
  },
];

export const SHOWCASE_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'dish-charred-ribeye',
    category_id: 'cat-wood-fired',
    category_name: 'Wood-Fired Mains',
    name: 'Oak-Fired Prime Ribeye',
    slug: 'oak-fired-prime-ribeye',
    description:
      '12oz pasture-raised ribeye seared over white oak embers with charred garlic, blistered vine tomatoes, and oregano chimichurri.',
    price: 24500.0,
    image_url: BUNDLED_IMAGES.dishCharredRibeye,
    prep_time_minutes: 25,
    dietary_note: 'Gluten-Free',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'dish-truffle-tagliatelle',
    category_id: 'cat-pasta',
    category_name: 'Handmade Pasta',
    name: 'Black Truffle Tagliatelle',
    slug: 'black-truffle-tagliatelle',
    description:
      'Hand-rolled egg yolk ribbons tossed in cultured Alpine butter, shaved winter black truffle, cracked pepper, and 24-month Parmigiano.',
    price: 16500.0,
    image_url: BUNDLED_IMAGES.dishTruffleTagliatelle,
    prep_time_minutes: 18,
    dietary_note: 'Vegetarian',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'dish-miso-salmon',
    category_id: 'cat-wood-fired',
    category_name: 'Wood-Fired Mains',
    name: 'White Miso Glazed Salmon',
    slug: 'white-miso-glazed-salmon',
    description:
      'Wild king salmon caramelized with sweet Kyoto miso, served over steamed jasmine rice with charred baby bok choy and toasted sesame.',
    price: 18500.0,
    image_url: BUNDLED_IMAGES.dishMisoSalmon,
    prep_time_minutes: 20,
    dietary_note: 'Dairy-Free',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'dish-saffron-bowl',
    category_id: 'cat-bowls',
    category_name: 'Harvest Bowls',
    name: 'Harissa Cauliflower & Farro Bowl',
    slug: 'harissa-cauliflower-farro-bowl',
    description:
      'Wood-roasted spiced cauliflower, heirloom farro, avocado, crispy chickpeas, pickled red shallots, and preserved lemon tahini.',
    price: 11500.0,
    image_url: BUNDLED_IMAGES.dishSaffronBowl,
    prep_time_minutes: 15,
    dietary_note: 'Vegan',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'dish-smash-burger',
    category_id: 'cat-burgers',
    category_name: 'Hearth Burgers',
    name: 'Double Aged Cheddar Smash Burger',
    slug: 'double-aged-cheddar-smash-burger',
    description:
      'Two crisp-edged chuck & brisket patties, 2-year Tillamook cheddar, sweet caramelized onions, house dill pickles, and rosemary fries.',
    price: 13500.0,
    image_url: BUNDLED_IMAGES.dishSmashBurger,
    prep_time_minutes: 16,
    dietary_note: 'House Classic',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'dish-espresso-tiramisu',
    category_id: 'cat-desserts',
    category_name: 'Patisserie & Desserts',
    name: 'Dark Cocoa Espresso Tiramisu',
    slug: 'dark-cocoa-espresso-tiramisu',
    description:
      'Savoiardi soaked in single-origin espresso, layered with whipped mascarpone custard and Valrhona dark cocoa.',
    price: 7500.0,
    image_url: BUNDLED_IMAGES.dishTiramisu,
    prep_time_minutes: 10,
    dietary_note: 'Vegetarian',
    is_available: true,
    is_featured: true,
  },
];
