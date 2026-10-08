import type { Diet, MealSlot } from '../types';

export type MealKind = 'cook' | 'no-cook' | 'buy';
export type MealTag = 'high-protein' | 'desk-friendly' | 'meal-prep' | 'budget' | 'local';

export interface MealIdea {
  id: string;
  name: string;
  emoji: string;
  slots: MealSlot[];
  kind: MealKind;
  minutes: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Most restrictive diet this meal satisfies. */
  diet: Diet;
  tags: MealTag[];
  ingredients: string[];
  steps: string[];
  /** For "buy" meals: where to get it and how to order it lighter. */
  buyTip?: string;
  hue: number;
}

export const MEALS: MealIdea[] = [
  // ---------- Breakfast ----------
  {
    id: 'protein-oats', name: 'Protein overnight oats', emoji: '🫙', slots: ['breakfast'], kind: 'no-cook', minutes: 5,
    kcal: 380, protein: 28, carbs: 48, fat: 9, diet: 'vegetarian', tags: ['high-protein', 'meal-prep', 'desk-friendly', 'budget'],
    ingredients: ['40 g rolled oats', '150 g Greek yoghurt (0%)', '100 ml milk', '½ scoop vanilla protein (optional)', '80 g berries', '1 tsp chia seeds'],
    steps: ['Stir oats, yoghurt, milk, protein and chia in a jar.', 'Top with berries, lid on, fridge overnight.', 'Grab it on your way out — eat cold at your desk.'],
    hue: 265,
  },
  {
    id: 'yoghurt-bowl', name: 'Greek yoghurt berry bowl', emoji: '🫐', slots: ['breakfast', 'snack'], kind: 'no-cook', minutes: 3,
    kcal: 290, protein: 24, carbs: 34, fat: 6, diet: 'vegetarian', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['200 g Greek yoghurt (0–2%)', '100 g mixed berries', '15 g granola', '1 tsp honey'],
    steps: ['Spoon yoghurt into a bowl.', 'Top with berries, granola and a drizzle of honey.'],
    hue: 290,
  },
  {
    id: 'egg-white-toast', name: 'Veggie egg-white scramble on toast', emoji: '🍳', slots: ['breakfast'], kind: 'cook', minutes: 10,
    kcal: 310, protein: 28, carbs: 26, fat: 9, diet: 'vegetarian', tags: ['high-protein'],
    ingredients: ['1 whole egg + 4 egg whites', 'Handful spinach', '4 cherry tomatoes', '1 slice wholegrain toast', 'Spray oil, salt, pepper'],
    steps: ['Wilt spinach and tomatoes in a sprayed pan.', 'Pour in the eggs and stir gently until just set.', 'Serve on toast with plenty of pepper.'],
    hue: 45,
  },
  {
    id: 'pb-banana-toast', name: 'Peanut butter banana toast', emoji: '🍌', slots: ['breakfast'], kind: 'no-cook', minutes: 4,
    kcal: 350, protein: 12, carbs: 46, fat: 13, diet: 'vegan', tags: ['budget'],
    ingredients: ['2 slices wholegrain bread', '1 tbsp peanut butter', '1 small banana', 'Pinch of cinnamon'],
    steps: ['Toast the bread.', 'Spread peanut butter thinly, top with sliced banana and cinnamon.'],
    hue: 40,
  },
  {
    id: 'tofu-scramble', name: 'Turmeric tofu scramble', emoji: '🟡', slots: ['breakfast'], kind: 'cook', minutes: 10,
    kcal: 300, protein: 22, carbs: 14, fat: 17, diet: 'vegan', tags: ['high-protein'],
    ingredients: ['200 g firm tofu', '½ tsp turmeric', '½ onion, diced', 'Handful spinach', '1 tsp oil', 'Chilli flakes'],
    steps: ['Soften onion in oil.', 'Crumble in tofu with turmeric, cook 4 min.', 'Fold in spinach, season, done.'],
    hue: 50,
  },
  {
    id: 'salmon-bagel', name: 'Smoked salmon bagel thin', emoji: '🥯', slots: ['breakfast'], kind: 'no-cook', minutes: 5,
    kcal: 320, protein: 22, carbs: 30, fat: 11, diet: 'pescatarian', tags: ['high-protein'],
    ingredients: ['1 bagel thin', '60 g smoked salmon', '30 g light cream cheese', 'Cucumber, capers, dill'],
    steps: ['Toast the bagel thin.', 'Spread cream cheese, layer salmon and cucumber, finish with capers.'],
    hue: 15,
  },
  {
    id: 'cafe-egg-wrap', name: 'Coffee-shop egg white wrap + black coffee', emoji: '☕', slots: ['breakfast'], kind: 'buy', minutes: 2,
    kcal: 290, protein: 20, carbs: 34, fat: 8, diet: 'vegetarian', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['Egg white & spinach wrap', 'Americano or long black'],
    steps: ['Order on your commute.', 'Skip the pastry case and syrups.'],
    buyTip: 'Most coffee chains have an egg-white wrap under 300 kcal. A plain Americano is ~5 kcal vs ~250 for a flavoured latte.',
    hue: 30,
  },
  {
    id: 'string-hoppers', name: 'String hoppers & dhal (easy on the sambol)', emoji: '🍜', slots: ['breakfast', 'dinner'], kind: 'buy', minutes: 5,
    kcal: 420, protein: 14, carbs: 76, fat: 7, diet: 'vegan', tags: ['local', 'budget'],
    ingredients: ['10 string hoppers', '½ cup dhal curry', '1 tbsp pol sambol'],
    steps: ['Order 10 string hoppers with dhal.', 'Ask for kiri hodi on the side and use a spoonful.'],
    buyTip: 'Coconut gravies are where the calories hide — keep sambol and kiri hodi to a spoonful each.',
    hue: 35,
  },

  // ---------- Lunch ----------
  {
    id: 'chicken-quinoa', name: 'Chicken & quinoa meal-prep bowl', emoji: '🥙', slots: ['lunch', 'dinner'], kind: 'cook', minutes: 25,
    kcal: 520, protein: 45, carbs: 50, fat: 14, diet: 'any', tags: ['high-protein', 'meal-prep', 'desk-friendly'],
    ingredients: ['150 g chicken breast', '¾ cup cooked quinoa', 'Roasted peppers & courgette', '½ cup chickpeas', 'Lemon-yoghurt dressing'],
    steps: ['Season chicken with paprika & garlic; roast 20 min at 200 °C with the veg.', 'Cook quinoa while it roasts.', 'Portion into 3–4 boxes — lunches sorted till Thursday.'],
    hue: 140,
  },
  {
    id: 'tuna-jar', name: 'Tuna & chickpea salad jar', emoji: '🫙', slots: ['lunch'], kind: 'no-cook', minutes: 8,
    kcal: 430, protein: 38, carbs: 36, fat: 14, diet: 'pescatarian', tags: ['high-protein', 'desk-friendly', 'budget', 'meal-prep'],
    ingredients: ['1 can tuna in water', '½ can chickpeas', 'Cucumber, tomato, red onion', '1 tbsp olive oil + lemon', 'Mixed leaves'],
    steps: ['Dressing at the bottom of the jar, then chickpeas and veg.', 'Tuna next, leaves on top.', 'Shake into a bowl at lunch.'],
    hue: 190,
  },
  {
    id: 'chicken-wrap', name: 'Rotisserie chicken salad wrap', emoji: '🌯', slots: ['lunch'], kind: 'no-cook', minutes: 7,
    kcal: 450, protein: 38, carbs: 40, fat: 14, diet: 'any', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['1 wholewheat wrap', '120 g shredded rotisserie chicken (no skin)', 'Lettuce, tomato, cucumber', '2 tbsp tzatziki or hummus'],
    steps: ['Spread tzatziki over the wrap.', 'Pile on chicken and salad, roll tight, halve.'],
    hue: 25,
  },
  {
    id: 'lentil-soup', name: 'Red lentil & veg soup + roll', emoji: '🍲', slots: ['lunch', 'dinner'], kind: 'cook', minutes: 30,
    kcal: 420, protein: 20, carbs: 66, fat: 8, diet: 'vegan', tags: ['meal-prep', 'budget'],
    ingredients: ['80 g red lentils', 'Carrot, onion, celery', '1 tsp cumin + paprika', '600 ml veg stock', '1 wholegrain roll'],
    steps: ['Sweat veg 5 min, add spices and lentils.', 'Pour in stock, simmer 20 min, blend half.', 'Freezes brilliantly in portions.'],
    hue: 20,
  },
  {
    id: 'sub-light', name: '6" chicken sub, loaded salad', emoji: '🥖', slots: ['lunch'], kind: 'buy', minutes: 5,
    kcal: 330, protein: 25, carbs: 45, fat: 5, diet: 'any', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['6-inch multigrain sub', 'Grilled chicken or turkey', 'All the salad', 'Mustard or sweet onion sauce'],
    steps: ['Order a 6-inch, not a footlong.', 'Skip cheese and mayo; load the veg.'],
    buyTip: 'Cheese + mayo adds ~200 kcal to a sub. Double meat is a cheap protein boost.',
    hue: 85,
  },
  {
    id: 'sushi-box', name: 'Sushi box + edamame', emoji: '🍣', slots: ['lunch', 'dinner'], kind: 'buy', minutes: 3,
    kcal: 480, protein: 28, carbs: 70, fat: 9, diet: 'pescatarian', tags: ['desk-friendly'],
    ingredients: ['8-piece salmon & tuna box', 'Small edamame', 'Soy sauce, ginger'],
    steps: ['Pick nigiri and maki over tempura or mayo rolls.', 'Add edamame for protein and fibre.'],
    buyTip: 'Avoid "crunchy", "tempura" and "spicy mayo" rolls — they can double the calories.',
    hue: 350,
  },
  {
    id: 'rotisserie-salad', name: 'Supermarket chicken + salad bag', emoji: '🛒', slots: ['lunch', 'dinner'], kind: 'buy', minutes: 4,
    kcal: 400, protein: 48, carbs: 10, fat: 18, diet: 'any', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['Pack of cooked chicken breast (~200 g)', 'Bag of mixed salad', 'Light vinaigrette'],
    steps: ['Grab both from the chilled aisle.', 'Toss together at your desk.'],
    buyTip: 'Ready-cooked chicken breast is one of the cheapest high-protein lunches you can buy.',
    hue: 120,
  },
  {
    id: 'rice-curry-smart', name: 'Rice & curry, done smarter', emoji: '🍛', slots: ['lunch'], kind: 'buy', minutes: 5,
    kcal: 600, protein: 30, carbs: 80, fat: 16, diet: 'any', tags: ['local'],
    ingredients: ['Half portion of rice (red if available)', 'Fish or chicken curry', '2–3 veg curries (dhal, beans, gotu kola)', 'Skip the papadam'],
    steps: ['Ask for half rice — fill the space with veg curries.', 'Choose dry-cooked or fish curries over creamy ones.'],
    buyTip: 'A standard lunch packet is 800–1000 kcal. Half rice + extra veg saves ~250 kcal.',
    hue: 30,
  },
  {
    id: 'burrito-bowl', name: 'Chicken burrito bowl', emoji: '🥗', slots: ['lunch', 'dinner'], kind: 'cook', minutes: 20,
    kcal: 550, protein: 38, carbs: 60, fat: 15, diet: 'any', tags: ['high-protein', 'meal-prep'],
    ingredients: ['130 g chicken, cumin & chilli', '½ cup rice', '½ cup black beans', 'Salsa, corn, lettuce', '¼ avocado'],
    steps: ['Pan-fry spiced chicken strips 8 min.', 'Warm beans, build bowls with rice and salsa.', 'Avocado on at serving time.'],
    hue: 10,
  },
  {
    id: 'paneer-tikka', name: 'Paneer tikka salad', emoji: '🧀', slots: ['lunch', 'dinner'], kind: 'cook', minutes: 20,
    kcal: 480, protein: 30, carbs: 20, fat: 30, diet: 'vegetarian', tags: ['high-protein'],
    ingredients: ['120 g paneer, cubed', '3 tbsp yoghurt + tikka spice', 'Peppers & onion', 'Salad + mint yoghurt'],
    steps: ['Marinate paneer and veg in spiced yoghurt.', 'Grill or air-fry 12 min.', 'Serve over salad with mint yoghurt.'],
    hue: 25,
  },
  {
    id: 'poke-light', name: 'Light poke bowl', emoji: '🥢', slots: ['lunch', 'dinner'], kind: 'buy', minutes: 5,
    kcal: 480, protein: 32, carbs: 55, fat: 13, diet: 'pescatarian', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['Half rice, half greens', 'Salmon or tuna', 'Edamame, cucumber, seaweed', 'Ponzu or soy dressing'],
    steps: ['Base: half rice, half leaves.', 'Pick ponzu instead of spicy mayo.'],
    buyTip: 'Mayo-based sauces and crispy toppings can add 300 kcal to a poke bowl.',
    hue: 200,
  },
  {
    id: 'hummus-pita', name: 'Hummus veggie pita', emoji: '🫓', slots: ['lunch'], kind: 'no-cook', minutes: 6,
    kcal: 420, protein: 15, carbs: 58, fat: 14, diet: 'vegan', tags: ['desk-friendly', 'budget'],
    ingredients: ['1 wholemeal pita', '4 tbsp hummus', 'Grated carrot, cucumber, peppers', 'Rocket, lemon'],
    steps: ['Warm the pita.', 'Spread hummus inside and stuff with veg.'],
    hue: 60,
  },

  // ---------- Dinner ----------
  {
    id: 'prawn-stirfry', name: 'Garlic prawn stir-fry', emoji: '🦐', slots: ['dinner'], kind: 'cook', minutes: 15,
    kcal: 480, protein: 36, carbs: 52, fat: 12, diet: 'pescatarian', tags: ['high-protein'],
    ingredients: ['180 g prawns', 'Stir-fry veg pack', '2 garlic cloves, ginger', '1 tbsp soy + 1 tsp sesame oil', '½ cup cooked rice'],
    steps: ['Flash-fry garlic and ginger.', 'Add prawns 2 min, then veg 3 min.', 'Splash soy, serve over rice.'],
    hue: 15,
  },
  {
    id: 'salmon-traybake', name: 'Salmon, sweet potato & greens', emoji: '🐟', slots: ['dinner'], kind: 'cook', minutes: 25,
    kcal: 540, protein: 38, carbs: 40, fat: 22, diet: 'pescatarian', tags: ['high-protein'],
    ingredients: ['140 g salmon fillet', '1 medium sweet potato, cubed', 'Broccoli & green beans', 'Lemon, garlic, 1 tsp oil'],
    steps: ['Roast sweet potato 10 min at 200 °C.', 'Add salmon and greens, roast 12 min more.', 'Squeeze over lemon.'],
    hue: 20,
  },
  {
    id: 'light-chicken-curry', name: 'Light chicken curry & red rice', emoji: '🍛', slots: ['dinner', 'lunch'], kind: 'cook', minutes: 35,
    kcal: 560, protein: 42, carbs: 55, fat: 17, diet: 'any', tags: ['high-protein', 'meal-prep', 'local'],
    ingredients: ['150 g chicken breast', 'Roasted curry powder, curry leaves, pandan', '100 ml light coconut milk', 'Onion, garlic, ginger, tomato', '¾ cup red rice'],
    steps: ['Temper curry leaves and onion in 1 tsp oil.', 'Add chicken and spices, then tomato.', 'Simmer with light coconut milk 20 min. Serve with red rice.'],
    hue: 28,
  },
  {
    id: 'beef-noodles', name: 'Lean beef & veg noodles', emoji: '🍜', slots: ['dinner'], kind: 'cook', minutes: 20,
    kcal: 560, protein: 40, carbs: 58, fat: 16, diet: 'any', tags: ['high-protein'],
    ingredients: ['130 g lean beef strips', '60 g dry egg noodles', 'Pak choi, peppers, spring onion', 'Soy, oyster sauce, chilli'],
    steps: ['Cook noodles; sear beef hard and fast.', 'Toss in veg and sauces, then noodles.'],
    hue: 0,
  },
  {
    id: 'tofu-curry', name: 'Tofu & veg coconut curry', emoji: '🥥', slots: ['dinner'], kind: 'cook', minutes: 25,
    kcal: 480, protein: 22, carbs: 44, fat: 24, diet: 'vegan', tags: ['meal-prep'],
    ingredients: ['150 g firm tofu', 'Thai curry paste', '120 ml light coconut milk', 'Peppers, aubergine, spinach', '½ cup jasmine rice'],
    steps: ['Fry curry paste 1 min, add coconut milk.', 'Simmer veg 10 min, add tofu cubes 5 min.', 'Serve with rice.'],
    hue: 100,
  },
  {
    id: 'fajitas', name: 'One-pan chicken fajitas', emoji: '🌮', slots: ['dinner'], kind: 'cook', minutes: 25,
    kcal: 520, protein: 42, carbs: 48, fat: 16, diet: 'any', tags: ['high-protein'],
    ingredients: ['150 g chicken strips', 'Peppers & red onion', 'Fajita spice', '2 small tortillas', 'Salsa + 2 tbsp Greek yoghurt'],
    steps: ['Toss everything with spice on one tray.', 'Roast 20 min at 220 °C.', 'Wrap with salsa and yoghurt (instead of sour cream).'],
    hue: 12,
  },
  {
    id: 'grill-plate', name: 'Grilled chicken plate, extra salad', emoji: '🍢', slots: ['dinner', 'lunch'], kind: 'buy', minutes: 10,
    kcal: 520, protein: 50, carbs: 30, fat: 20, diet: 'any', tags: ['high-protein'],
    ingredients: ['Grilled chicken (not fried)', 'Double salad instead of fries', 'Garlic sauce on the side'],
    steps: ['Order the plate, swap fries for salad.', 'Dip, don\'t drown, in the garlic sauce.'],
    buyTip: 'Garlic sauce is ~100 kcal per tablespoon — get it on the side.',
    hue: 35,
  },
  {
    id: 'green-curry-takeaway', name: 'Thai green curry, half rice', emoji: '🍲', slots: ['dinner'], kind: 'buy', minutes: 20,
    kcal: 600, protein: 34, carbs: 60, fat: 24, diet: 'any', tags: [],
    ingredients: ['Chicken green curry', 'Half portion jasmine rice', 'Side of stir-fried greens'],
    steps: ['Share the rice or save half for tomorrow.', 'Add steamed greens for volume.'],
    buyTip: 'Curries are fine — it\'s the full rice portion and spring rolls that add up.',
    hue: 110,
  },
  {
    id: 'cauli-fried-rice', name: 'Egg fried cauliflower rice', emoji: '🥦', slots: ['dinner'], kind: 'cook', minutes: 15,
    kcal: 360, protein: 22, carbs: 20, fat: 20, diet: 'vegetarian', tags: ['budget'],
    ingredients: ['300 g riced cauliflower', '3 eggs', 'Peas, carrot, spring onion', 'Soy sauce, sesame oil'],
    steps: ['Stir-fry cauliflower 5 min until dry.', 'Push aside, scramble eggs, mix in veg.', 'Season with soy and sesame.'],
    hue: 55,
  },
  {
    id: 'bolognese-light', name: 'Lighter bolognese', emoji: '🍝', slots: ['dinner'], kind: 'cook', minutes: 30,
    kcal: 520, protein: 40, carbs: 55, fat: 14, diet: 'any', tags: ['high-protein', 'meal-prep'],
    ingredients: ['130 g 5% beef or turkey mince', 'Grated courgette & carrot', 'Tinned tomatoes, garlic, oregano', '60 g dry wholewheat pasta'],
    steps: ['Brown mince, add grated veg (adds volume, few calories).', 'Simmer with tomatoes 20 min.', 'Serve on a measured portion of pasta.'],
    hue: 5,
  },
  {
    id: 'tuna-ambul', name: 'Tuna ambul thiyal, red rice & gotu kola', emoji: '🐟', slots: ['dinner', 'lunch'], kind: 'cook', minutes: 35,
    kcal: 520, protein: 40, carbs: 55, fat: 13, diet: 'pescatarian', tags: ['high-protein', 'local', 'meal-prep'],
    ingredients: ['150 g fresh tuna, cubed', 'Goraka paste, pepper, curry leaves', '¾ cup red rice', 'Gotu kola mallum'],
    steps: ['Coat tuna in goraka, pepper and salt.', 'Simmer with a little water until dry and dark.', 'Serve with red rice and gotu kola.'],
    hue: 340,
  },
  {
    id: 'chickpea-spinach', name: 'Chickpea & spinach curry + chapati', emoji: '🫘', slots: ['dinner', 'lunch'], kind: 'cook', minutes: 20,
    kcal: 470, protein: 18, carbs: 62, fat: 15, diet: 'vegan', tags: ['budget', 'meal-prep'],
    ingredients: ['1 can chickpeas', '2 big handfuls spinach', 'Onion, garlic, ginger, garam masala', 'Tinned tomatoes', '1 chapati'],
    steps: ['Fry aromatics and spices.', 'Add tomatoes and chickpeas, simmer 10 min.', 'Wilt in spinach. Serve with chapati.'],
    hue: 80,
  },

  // ---------- Snacks ----------
  {
    id: 'apple-pb', name: 'Apple + peanut butter', emoji: '🍎', slots: ['snack'], kind: 'no-cook', minutes: 2,
    kcal: 190, protein: 4, carbs: 28, fat: 8, diet: 'vegan', tags: ['desk-friendly', 'budget'],
    ingredients: ['1 medium apple', '1 tbsp peanut butter'],
    steps: ['Slice, dip, enjoy.'], hue: 0,
  },
  {
    id: 'yoghurt-honey', name: 'Greek yoghurt + honey', emoji: '🍯', slots: ['snack'], kind: 'no-cook', minutes: 1,
    kcal: 150, protein: 17, carbs: 17, fat: 0, diet: 'vegetarian', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['170 g 0% Greek yoghurt', '1 tsp honey'],
    steps: ['Stir honey through yoghurt.'], hue: 45,
  },
  {
    id: 'boiled-eggs', name: 'Two boiled eggs', emoji: '🥚', slots: ['snack', 'breakfast'], kind: 'cook', minutes: 10,
    kcal: 156, protein: 12, carbs: 1, fat: 10, diet: 'vegetarian', tags: ['high-protein', 'meal-prep', 'budget'],
    ingredients: ['2 eggs', 'Salt, pepper or chilli flakes'],
    steps: ['Boil 8 minutes, cool in cold water.', 'Make 6 on Sunday for the week.'], hue: 50,
  },
  {
    id: 'edamame', name: 'Salted edamame', emoji: '🫛', slots: ['snack'], kind: 'cook', minutes: 5,
    kcal: 190, protein: 17, carbs: 14, fat: 8, diet: 'vegan', tags: ['high-protein'],
    ingredients: ['1 cup frozen edamame in pods', 'Sea salt, chilli'],
    steps: ['Microwave or boil 4 min.', 'Salt generously.'], hue: 110,
  },
  {
    id: 'protein-bar', name: 'Protein bar (under 220 kcal)', emoji: '🍫', slots: ['snack'], kind: 'buy', minutes: 1,
    kcal: 210, protein: 20, carbs: 22, fat: 7, diet: 'vegetarian', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['Any bar with ≥ 15 g protein and ≤ 220 kcal'],
    steps: ['Keep one in your desk drawer for 4 pm emergencies.'],
    buyTip: 'Check the label: many "protein" bars are 300+ kcal candy bars in disguise.', hue: 20,
  },
  {
    id: 'cottage-pineapple', name: 'Cottage cheese & pineapple', emoji: '🍍', slots: ['snack'], kind: 'no-cook', minutes: 2,
    kcal: 160, protein: 14, carbs: 20, fat: 3, diet: 'vegetarian', tags: ['high-protein', 'desk-friendly'],
    ingredients: ['½ cup cottage cheese', '½ cup pineapple chunks'],
    steps: ['Top cottage cheese with pineapple.'], hue: 55,
  },
  {
    id: 'popcorn', name: 'Air-popped popcorn', emoji: '🍿', slots: ['snack'], kind: 'cook', minutes: 5,
    kcal: 95, protein: 3, carbs: 19, fat: 1, diet: 'vegan', tags: ['budget', 'desk-friendly'],
    ingredients: ['25 g popcorn kernels', 'Smoked paprika or nutritional yeast'],
    steps: ['Pop in a covered bowl in the microwave (2–3 min).', 'Season and snack — 3 cups for under 100 kcal.'], hue: 45,
  },
  {
    id: 'thambili-peanuts', name: 'King coconut + small handful of peanuts', emoji: '🥥', slots: ['snack'], kind: 'buy', minutes: 2,
    kcal: 200, protein: 6, carbs: 18, fat: 12, diet: 'vegan', tags: ['local', 'budget'],
    ingredients: ['1 king coconut (thambili)', '20 g roasted peanuts'],
    steps: ['Hydrating, natural electrolytes, and the nuts keep you full.'],
    buyTip: 'Great swap for a sugary soft drink at the roadside.', hue: 90,
  },
  {
    id: 'hummus-sticks', name: 'Hummus & veg sticks', emoji: '🥕', slots: ['snack'], kind: 'no-cook', minutes: 4,
    kcal: 140, protein: 4, carbs: 14, fat: 8, diet: 'vegan', tags: ['desk-friendly', 'meal-prep'],
    ingredients: ['3 tbsp hummus', 'Carrot, cucumber, pepper sticks'],
    steps: ['Prep a few boxes of veg sticks on Sunday.'], hue: 30,
  },
  {
    id: 'cappuccino-banana', name: 'Skinny cappuccino + banana', emoji: '☕', slots: ['snack', 'breakfast'], kind: 'buy', minutes: 3,
    kcal: 195, protein: 9, carbs: 39, fat: 1, diet: 'vegetarian', tags: ['desk-friendly'],
    ingredients: ['Medium skimmed-milk cappuccino', '1 banana'],
    steps: ['Your 3 pm coffee run, minus the muffin.'],
    buyTip: 'A café muffin is often 450+ kcal — a banana does the same job for 105.', hue: 35,
  },
];

const DIET_RANK: Record<Diet, number> = { vegan: 0, vegetarian: 1, pescatarian: 2, any: 3 };

/** Does a meal suit someone with this diet? */
export function fitsDiet(meal: MealIdea, diet: Diet): boolean {
  return DIET_RANK[meal.diet] <= DIET_RANK[diet];
}

export function mealById(id: string): MealIdea | undefined {
  return MEALS.find((m) => m.id === id);
}
