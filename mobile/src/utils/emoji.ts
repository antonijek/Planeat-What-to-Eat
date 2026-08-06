const EMOJI_RULES: { words: string[]; emoji: string }[] = [
  { words: ["pancake"], emoji: "🥞" },
  { words: ["waffle"], emoji: "🧇" },
  { words: ["omelette", "omelet", "fried egg", "poached", "scrambled"], emoji: "🍳" },
  { words: ["toast", "bread", "sandwich", "grilled cheese"], emoji: "🍞" },
  { words: ["cake", "cheesecake", "brownie", "sponge"], emoji: "🍰" },
  { words: ["cookie", "biscuit", "biscuits"], emoji: "🍪" },
  { words: ["pie", "tart", "crumble", "pastry"], emoji: "🥧" },
  { words: ["chocolate", "choc"], emoji: "🍫" },
  { words: ["ice cream", "frozen", "popsicle", "sorbet"], emoji: "🍦" },
  { words: ["curry"], emoji: "🍛" },
  { words: ["pasta", "spaghetti", "lasagne", "lasagna", "noodle", "macaroni"], emoji: "🍝" },
  { words: ["pizza"], emoji: "🍕" },
  { words: ["burger", "hamburger", "sloppy joe"], emoji: "🍔" },
  { words: ["salad", "slaw"], emoji: "🥗" },
  { words: ["soup", "stew", "broth"], emoji: "🍲" },
  { words: ["rice", "risotto", "pilaf", "biryani"], emoji: "🍚" },
  { words: ["chicken"], emoji: "🍗" },
  { words: ["beef", "steak", "roast beef"], emoji: "🥩" },
  { words: ["pork", "ham", "bacon"], emoji: "🍖" },
  { words: ["fish", "salmon", "trout", "cod"], emoji: "🐟" },
  { words: ["seafood", "shrimp", "prawn", "squid", "calamari", "crab", "mussel", "oyster"], emoji: "🦐" },
  { words: ["apple", "berry", "berries", "strawberry", "blueberry", "raspberry", "fruit", "peach", "apricot", "cherry", "plum"], emoji: "🍎" },
  { words: ["banana"], emoji: "🍌" },
  { words: ["smoothie", "juice", "shake"], emoji: "🥤" },
  { words: ["coffee", "latte", "cappuccino"], emoji: "☕" },
  { words: ["tea"], emoji: "🫖" },
  { words: ["meatball", "kebab", "kofta", "kefta", "kofte"], emoji: "🍢" },
  { words: ["wrap", "burrito", "taco", "quesadilla"], emoji: "🌯" },
  { words: ["dumpling", "gyoza", "empanada", "samosa", "pastry filled"], emoji: "🥟" },
  { words: ["candy", "sweet", "fudge", "caramel"], emoji: "🍬" },
  { words: ["popcorn"], emoji: "🍿" },
  { words: ["fries", "chips", "wedges"], emoji: "🍟" },
];

const FALLBACK_EMOJI = "🍽️";

/** Vraća emoji za recept na osnovu ključnih reči u imenu. */
export function getRecipeEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const rule of EMOJI_RULES) {
    if (rule.words.some((w) => lower.includes(w))) return rule.emoji;
  }
  return FALLBACK_EMOJI;
}
