// Types only — data lives in the `recommended_tools` and
// `recommended_tool_categories` tables and is fetched via server functions.

export type ToolPricing = {
  plan: string;
  price: string;
  note?: string;
};

export type ToolFaq = { q: string; a: string };

export type ToolFeature = { title: string; description: string };

export type ToolReview = {
  id: string;
  toolSlug: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ToolReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export type RecommendedTool = {
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  url: string;
  gold: boolean;
  perk: string | null;
  letter: string;
  gradient: string;
  tags: string[];
  rating: number;
  reviewsCount: number;
  usedBy: number;
  launchedYear: number | null;
  website: string | null;
  pros: string[];
  cons: string[];
  bestFor: string[];
  features: ToolFeature[];
  pricing: ToolPricing[];
  faq: ToolFaq[];
  alternatives: string[];
  position: number;
  isPublished: boolean;
};

export type ToolCategory = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  position: number;
};

export const GRADIENT_PRESETS = [
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-fuchsia-500",
  "from-blue-500 to-cyan-500",
  "from-indigo-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-500",
  "from-orange-500 to-rose-500",
  "from-slate-700 to-slate-900",
];
