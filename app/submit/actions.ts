"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  COLOR_PALETTE,
  CUSTOM_CATEGORY,
  RESERVED_SLUGS,
  type QuestionType,
} from "@/components/constant/data"
import {
  getQuestionTypes,
  saveQuestionTypes,
} from "@/components/constant/store"
import { isAdmin } from "@/lib/admin"

export type SubmitState = { error: string | null }

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function submitQuestions(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  // Server actions are public endpoints, so check even though the page is gated
  if (!(await isAdmin())) {
    return { error: "Admin mode is off. Turn it on from the homepage." }
  }

  const category = String(formData.get("category") ?? "")
  const questions = formData.getAll("question").map((v) => String(v).trim())
  const answers = formData.getAll("answer").map((v) => String(v).trim())

  // Ignore rows left completely blank
  const pairs = questions
    .map((question, i) => ({ question, answer: answers[i] ?? "" }))
    .filter((qa) => qa.question || qa.answer)

  if (pairs.length === 0) {
    return { error: "Add at least one question and answer." }
  }
  if (pairs.some((qa) => !qa.question || !qa.answer)) {
    return { error: "Every question needs an answer, and vice versa." }
  }

  const types = await getQuestionTypes()
  let target: QuestionType | undefined

  if (category === CUSTOM_CATEGORY) {
    const label = String(formData.get("customLabel") ?? "").trim()
    const icon = String(formData.get("customIcon") ?? "").trim() || "📁"
    if (!label) return { error: "Give your new category a name." }

    const existing = types.find(
      (type) => type.label.toLowerCase() === label.toLowerCase()
    )
    if (existing) {
      return {
        error: `"${existing.label}" already exists. Pick it from the list instead.`,
      }
    }

    const base = slugify(label) || "category"
    let slug = base
    for (
      let n = 2;
      types.some((type) => type.slug === slug) || RESERVED_SLUGS.includes(slug);
      n++
    ) {
      slug = `${base}-${n}`
    }

    // Prefer a color no other category is using yet
    const usedColors = new Set(types.map((type) => type.color))
    target = {
      id: Math.max(0, ...types.map((type) => type.id)) + 1,
      slug,
      label,
      icon,
      color:
        COLOR_PALETTE.find((color) => !usedColors.has(color)) ??
        COLOR_PALETTE[types.length % COLOR_PALETTE.length],
      questions: [],
    }
    types.push(target)
  } else {
    target = types.find((type) => type.slug === category)
    if (!target) return { error: "Choose a category." }
  }

  let nextId = Math.max(0, ...target.questions.map((qa) => Number(qa.id) || 0))
  for (const qa of pairs) {
    target.questions.push({ id: String(++nextId), ...qa })
  }

  await saveQuestionTypes(types)
  revalidatePath("/", "layout")
  redirect(`/${target.slug}`)
}
