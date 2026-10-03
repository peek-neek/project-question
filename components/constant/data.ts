// Shared types and constants (safe to import from client components).
// The data itself lives in data/questions.json — see ./store.ts.

export type QuestionAnswer = {
  id: string
  question: string
  // Use "\n\n" to separate paragraphs
  answer: string
}

export type QuestionType = {
  id: number
  // URL segment, e.g. "estimates" -> /estimates
  slug: string
  label: string
  // Emoji shown alongside the label
  icon: string
  // Must be one of COLOR_PALETTE: Tailwind only generates classes it finds
  // written out in source files
  color: string
  questions: QuestionAnswer[]
}

export const COLOR_PALETTE = [
  "bg-red-400 hover:bg-red-500",
  "bg-emerald-400 hover:bg-emerald-500",
  "bg-violet-400 hover:bg-violet-500",
  "bg-blue-400 hover:bg-blue-500",
  "bg-orange-400 hover:bg-orange-500",
  "bg-pink-400 hover:bg-pink-500",
  "bg-cyan-400 hover:bg-cyan-500",
  "bg-amber-400 hover:bg-amber-500",
  "bg-indigo-400 hover:bg-indigo-500",
  "bg-teal-400 hover:bg-teal-500",
  "bg-rose-400 hover:bg-rose-500",
  "bg-sky-400 hover:bg-sky-500",
]

// Value of the category <select> when the user is creating a new category
export const CUSTOM_CATEGORY = "__custom__"

// Top-level routes that a category slug must not shadow
export const RESERVED_SLUGS = ["submit"]
