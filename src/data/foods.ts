export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: FoodCategory;
}

export type FoodCategory = 'Breakfast' | 'Fruit' | 'Veg' | 'Protein' | 'Grains' | 'Dairy' | 'Meals' | 'Snacks' | 'Drinks' | 'Fast food';

// [name, emoji, serving, kcal, protein, carbs, fat, category]
type Row = [string, string, string, number, number, number, number, FoodCategory];

const ROWS: Row[] = [
  // Breakfast
  ['Oatmeal (made with water)', '🥣', '1 cup cooked (234 g)', 166, 6, 28, 4, 'Breakfast'],
  ['Overnight oats with milk & berries', '🫐', '1 jar (300 g)', 320, 14, 50, 8, 'Breakfast'],
  ['Scrambled eggs', '🍳', '2 large eggs', 180, 12, 2, 14, 'Breakfast'],
  ['Boiled egg', '🥚', '1 large (50 g)', 78, 6, 1, 5, 'Breakfast'],
  ['Wholegrain toast', '🍞', '1 slice (32 g)', 80, 4, 14, 1, 'Breakfast'],
  ['Avocado toast', '🥑', '1 slice + ½ avocado', 260, 6, 22, 17, 'Breakfast'],
  ['Pancakes with syrup', '🥞', '3 medium', 520, 10, 88, 14, 'Breakfast'],
  ['Granola with yoghurt', '🥣', '1 bowl (250 g)', 380, 14, 50, 13, 'Breakfast'],
  ['Cornflakes with milk', '🥣', '1 bowl (30 g + 200 ml)', 210, 8, 36, 4, 'Breakfast'],
  ['Croissant', '🥐', '1 medium (57 g)', 231, 5, 26, 12, 'Breakfast'],
  ['String hoppers with dhal', '🍜', '10 pieces + ½ cup dhal', 420, 14, 78, 6, 'Breakfast'],
  ['Hoppers (plain)', '🥞', '2 hoppers', 240, 4, 44, 5, 'Breakfast'],
  ['Egg hopper', '🍳', '1 hopper', 190, 8, 22, 8, 'Breakfast'],
  ['Milk rice (kiribath)', '🍚', '2 pieces (200 g)', 380, 6, 58, 14, 'Breakfast'],
  ['Idli with sambar', '🍘', '3 idli + 1 cup sambar', 330, 12, 62, 4, 'Breakfast'],
  ['Masala dosa', '🌯', '1 dosa', 390, 8, 56, 15, 'Breakfast'],

  // Fruit
  ['Banana', '🍌', '1 medium (118 g)', 105, 1, 27, 0, 'Fruit'],
  ['Apple', '🍎', '1 medium (182 g)', 95, 0, 25, 0, 'Fruit'],
  ['Orange', '🍊', '1 medium (131 g)', 62, 1, 15, 0, 'Fruit'],
  ['Mango', '🥭', '1 cup sliced (165 g)', 99, 1, 25, 1, 'Fruit'],
  ['Papaya', '🍈', '1 cup (145 g)', 62, 1, 16, 0, 'Fruit'],
  ['Pineapple', '🍍', '1 cup (165 g)', 82, 1, 22, 0, 'Fruit'],
  ['Strawberries', '🍓', '1 cup (152 g)', 49, 1, 12, 0, 'Fruit'],
  ['Blueberries', '🫐', '1 cup (148 g)', 84, 1, 21, 0, 'Fruit'],
  ['Grapes', '🍇', '1 cup (151 g)', 104, 1, 27, 0, 'Fruit'],
  ['Watermelon', '🍉', '2 cups diced (300 g)', 90, 2, 23, 0, 'Fruit'],
  ['Avocado', '🥑', '½ fruit (100 g)', 160, 2, 9, 15, 'Fruit'],

  // Veg
  ['Mixed green salad', '🥗', '2 cups (no dressing)', 30, 2, 6, 0, 'Veg'],
  ['Broccoli, steamed', '🥦', '1 cup (156 g)', 55, 4, 11, 1, 'Veg'],
  ['Carrot sticks', '🥕', '1 cup (128 g)', 52, 1, 12, 0, 'Veg'],
  ['Cucumber', '🥒', '1 cup sliced (119 g)', 16, 1, 4, 0, 'Veg'],
  ['Sweet potato, baked', '🍠', '1 medium (150 g)', 135, 3, 31, 0, 'Veg'],
  ['Potato, boiled', '🥔', '1 medium (173 g)', 150, 4, 34, 0, 'Veg'],
  ['Stir-fried vegetables', '🥬', '1 cup (with 1 tsp oil)', 110, 4, 12, 5, 'Veg'],
  ['Gotu kola sambol', '🌿', '½ cup', 70, 2, 5, 5, 'Veg'],
  ['Pol sambol', '🥥', '3 tbsp', 110, 1, 4, 10, 'Veg'],
  ['Vegetable soup', '🍲', '1 bowl (300 ml)', 120, 4, 20, 3, 'Veg'],

  // Protein
  ['Chicken breast, grilled', '🍗', '150 g', 248, 46, 0, 5, 'Protein'],
  ['Chicken thigh, roasted', '🍗', '150 g', 320, 38, 0, 18, 'Protein'],
  ['Salmon fillet, baked', '🐟', '150 g', 310, 34, 0, 19, 'Protein'],
  ['Tuna in water', '🐟', '1 can drained (120 g)', 130, 29, 0, 1, 'Protein'],
  ['Prawns, grilled', '🦐', '150 g', 150, 32, 1, 2, 'Protein'],
  ['Lean beef mince, cooked', '🥩', '150 g', 330, 39, 0, 19, 'Protein'],
  ['Steak, sirloin', '🥩', '200 g', 420, 54, 0, 22, 'Protein'],
  ['Tofu, firm', '🧈', '150 g', 215, 24, 4, 13, 'Protein'],
  ['Lentil dhal curry', '🍛', '1 cup (200 g)', 230, 12, 30, 7, 'Protein'],
  ['Chickpeas', '🫘', '1 cup cooked (164 g)', 269, 15, 45, 4, 'Protein'],
  ['Fish curry (Sri Lankan)', '🐟', '1 cup (200 g)', 260, 26, 6, 15, 'Protein'],
  ['Chicken curry', '🍛', '1 cup (220 g)', 330, 28, 8, 20, 'Protein'],
  ['Egg whites', '🥚', '4 large', 68, 14, 1, 0, 'Protein'],
  ['Whey protein shake (water)', '🥤', '1 scoop (30 g)', 120, 24, 3, 2, 'Protein'],

  // Grains
  ['White rice', '🍚', '1 cup cooked (158 g)', 205, 4, 45, 0, 'Grains'],
  ['Red / brown rice', '🍚', '1 cup cooked (195 g)', 218, 5, 46, 2, 'Grains'],
  ['Pasta, cooked', '🍝', '1 cup (140 g)', 220, 8, 43, 1, 'Grains'],
  ['Quinoa', '🌾', '1 cup cooked (185 g)', 222, 8, 39, 4, 'Grains'],
  ['Chapati / roti', '🫓', '1 medium (40 g)', 120, 3, 18, 4, 'Grains'],
  ['Pol roti', '🫓', '1 piece (70 g)', 210, 4, 26, 10, 'Grains'],
  ['Naan', '🫓', '1 piece (90 g)', 262, 9, 45, 5, 'Grains'],
  ['Wholewheat wrap', '🌯', '1 large (64 g)', 180, 6, 30, 4, 'Grains'],
  ['Bagel', '🥯', '1 medium (105 g)', 280, 11, 55, 2, 'Grains'],

  // Dairy
  ['Greek yoghurt, plain 0%', '🥛', '170 g pot', 100, 17, 6, 0, 'Dairy'],
  ['Greek yoghurt, full-fat', '🥛', '170 g pot', 165, 15, 7, 8, 'Dairy'],
  ['Curd (buffalo) with treacle', '🍯', '1 cup + 1 tbsp', 290, 9, 26, 16, 'Dairy'],
  ['Milk, semi-skimmed', '🥛', '1 glass (250 ml)', 125, 9, 12, 5, 'Dairy'],
  ['Cheddar cheese', '🧀', '30 g', 120, 7, 0, 10, 'Dairy'],
  ['Cottage cheese', '🧀', '½ cup (113 g)', 92, 12, 4, 3, 'Dairy'],
  ['Paneer', '🧀', '100 g', 296, 18, 4, 23, 'Dairy'],

  // Meals
  ['Rice & curry (Sri Lankan plate)', '🍛', '1 plate', 720, 28, 105, 20, 'Meals'],
  ['Chicken kottu roti', '🥘', '1 portion (450 g)', 850, 38, 95, 34, 'Meals'],
  ['Chicken fried rice', '🍳', '1 plate (400 g)', 680, 28, 90, 22, 'Meals'],
  ['Chicken biryani', '🍛', '1 plate (400 g)', 720, 32, 88, 26, 'Meals'],
  ['Spaghetti bolognese', '🍝', '1 plate (400 g)', 600, 32, 72, 18, 'Meals'],
  ['Chicken caesar salad', '🥗', '1 bowl', 470, 36, 14, 30, 'Meals'],
  ['Sushi (salmon nigiri)', '🍣', '6 pieces', 330, 16, 52, 6, 'Meals'],
  ['Chicken ramen', '🍜', '1 bowl', 580, 32, 66, 20, 'Meals'],
  ['Beef burrito', '🌯', '1 large', 780, 36, 82, 32, 'Meals'],
  ['Pad thai with chicken', '🍜', '1 plate (350 g)', 650, 28, 80, 24, 'Meals'],
  ['Vegetable noodles', '🍜', '1 plate (300 g)', 420, 12, 64, 12, 'Meals'],
  ['Lamprais', '🍱', '1 packet', 900, 34, 100, 40, 'Meals'],
  ['Egg fried rice', '🍳', '1 plate (350 g)', 560, 16, 84, 18, 'Meals'],
  ['Poke bowl (salmon)', '🥗', '1 bowl', 620, 32, 72, 22, 'Meals'],

  // Snacks
  ['Almonds', '🥜', '28 g (23 nuts)', 164, 6, 6, 14, 'Snacks'],
  ['Peanut butter', '🥜', '1 tbsp (16 g)', 94, 4, 3, 8, 'Snacks'],
  ['Dark chocolate 70%', '🍫', '2 squares (20 g)', 120, 2, 9, 9, 'Snacks'],
  ['Protein bar', '🍫', '1 bar (60 g)', 210, 20, 22, 7, 'Snacks'],
  ['Popcorn, air-popped', '🍿', '3 cups (24 g)', 93, 3, 19, 1, 'Snacks'],
  ['Potato chips', '🥔', '1 small bag (28 g)', 152, 2, 15, 10, 'Snacks'],
  ['Hummus with carrots', '🥕', '3 tbsp + 1 carrot', 140, 4, 14, 8, 'Snacks'],
  ['Rice cakes', '🍘', '2 cakes', 70, 2, 15, 1, 'Snacks'],
  ['Chocolate chip cookie', '🍪', '1 large (40 g)', 200, 2, 26, 10, 'Snacks'],
  ['Fish bun', '🥖', '1 bun', 260, 9, 36, 9, 'Snacks'],
  ['Vegetable roti (short eats)', '🥟', '1 piece', 220, 4, 26, 11, 'Snacks'],
  ['Samosa', '🥟', '1 medium', 260, 4, 30, 14, 'Snacks'],
  ['Murukku', '🥨', '1 handful (30 g)', 160, 3, 18, 9, 'Snacks'],
  ['Glazed donut', '🍩', '1 medium', 260, 3, 31, 14, 'Snacks'],

  // Drinks
  ['Water', '💧', '250 ml', 0, 0, 0, 0, 'Drinks'],
  ['Black coffee', '☕', '1 mug (240 ml)', 2, 0, 0, 0, 'Drinks'],
  ['Milk tea (with sugar)', '🍵', '1 cup', 90, 2, 14, 3, 'Drinks'],
  ['Plain tea (no sugar)', '🍵', '1 cup', 2, 0, 0, 0, 'Drinks'],
  ['Latte (whole milk)', '☕', 'Medium (350 ml)', 190, 10, 15, 10, 'Drinks'],
  ['Cappuccino (skim)', '☕', 'Medium (350 ml)', 90, 8, 12, 0, 'Drinks'],
  ['Orange juice', '🧃', '1 glass (250 ml)', 112, 2, 26, 0, 'Drinks'],
  ['King coconut water', '🥥', '1 nut (300 ml)', 60, 1, 14, 0, 'Drinks'],
  ['Cola', '🥤', '1 can (330 ml)', 139, 0, 35, 0, 'Drinks'],
  ['Diet cola', '🥤', '1 can (330 ml)', 1, 0, 0, 0, 'Drinks'],
  ['Beer', '🍺', '1 bottle (330 ml)', 153, 2, 13, 0, 'Drinks'],
  ['Red wine', '🍷', '1 glass (150 ml)', 125, 0, 4, 0, 'Drinks'],
  ['Smoothie (fruit)', '🥤', '1 bottle (400 ml)', 230, 3, 54, 1, 'Drinks'],

  // Fast food
  ['Cheeseburger', '🍔', '1 burger', 300, 15, 33, 12, 'Fast food'],
  ['Big burger (double)', '🍔', '1 burger', 560, 26, 46, 30, 'Fast food'],
  ['French fries', '🍟', 'Medium', 320, 4, 43, 15, 'Fast food'],
  ['Pizza, margherita', '🍕', '1 slice (107 g)', 250, 11, 31, 9, 'Fast food'],
  ['Pizza, pepperoni', '🍕', '1 slice (113 g)', 300, 13, 34, 13, 'Fast food'],
  ['Fried chicken', '🍗', '2 pieces', 520, 38, 16, 34, 'Fast food'],
  ['Chicken nuggets', '🍗', '6 pieces', 270, 15, 16, 16, 'Fast food'],
  ['Subway 6" turkey sub', '🥖', '6-inch, no cheese', 280, 18, 46, 3, 'Fast food'],
  ['Hot dog', '🌭', '1 with bun', 290, 11, 24, 17, 'Fast food'],
  ['Shawarma wrap', '🌯', '1 wrap', 620, 32, 52, 30, 'Fast food'],
];

export const FOODS: FoodItem[] = ROWS.map(([name, emoji, serving, kcal, protein, carbs, fat, category], i) => ({
  id: `f${i}`,
  name,
  emoji,
  serving,
  kcal,
  protein,
  carbs,
  fat,
  category,
}));

export const FOOD_CATEGORIES: FoodCategory[] = ['Breakfast', 'Meals', 'Protein', 'Grains', 'Veg', 'Fruit', 'Dairy', 'Snacks', 'Drinks', 'Fast food'];

export function searchFoods(query: string, category?: FoodCategory | null): FoodItem[] {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  return FOODS.filter((f) => (!category || f.category === category) && terms.every((t) => f.name.toLowerCase().includes(t))).sort((a, b) => {
    if (!q) return 0;
    const ai = a.name.toLowerCase().indexOf(terms[0] ?? '');
    const bi = b.name.toLowerCase().indexOf(terms[0] ?? '');
    return ai - bi;
  });
}
