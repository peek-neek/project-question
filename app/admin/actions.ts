"use server"

import { revalidatePath } from "next/cache"

import { COLOR_PALETTE } from "@/components/constant/data"
import {
  getQuestionTypes,
  saveQuestionTypes,
} from "@/components/constant/store"
import {
  checkPasscode,
  endAdminSession,
  isAdmin,
  isPasscodeConfigured,
  startAdminSession,
} from "@/lib/admin"

export type UnlockState = { error: string | null }
export type EditResult = { error: string | null }

export async function unlockAdmin(
  _prev: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  if (!isPasscodeConfigured()) {
    return { error: "Admin passcode isn't set up on the server." }
  }
  const passcode = String(formData.get("passcode") ?? "")
  if (!/^\d{4}$/.test(passcode) || !checkPasscode(passcode)) {
    // Slow down guessing a little
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { error: "Incorrect passcode." }
  }
  await startAdminSession()
  revalidatePath("/", "layout")
  return { error: null }
}

export async function lockAdmin() {
  await endAdminSession()
  revalidatePath("/", "layout")
}

// Server actions are public endpoints, so each one re-checks the session
async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorized")
}

export async function deleteQuestionType(slug: string) {
  await requireAdmin()
  const types = await getQuestionTypes()
  await saveQuestionTypes(types.filter((type) => type.slug !== slug))
  revalidatePath("/", "layout")
}

export async function deleteQuestion(slug: string, questionId: string) {
  await requireAdmin()
  const types = await getQuestionTypes()
  const type = types.find((type) => type.slug === slug)
  if (!type) return
  type.questions = type.questions.filter((qa) => qa.id !== questionId)
  await saveQuestionTypes(types)
  revalidatePath("/", "layout")
}

// Slug is deliberately left unchanged so existing links keep working
export async function updateQuestionType(
  slug: string,
  input: { label: string; icon: string; color: string }
): Promise<EditResult> {
  await requireAdmin()
  const label = input.label.trim()
  const icon = input.icon.trim() || "📁"
  if (!label) return { error: "Name can't be empty." }
  if (!COLOR_PALETTE.includes(input.color)) return { error: "Pick a color." }

  const types = await getQuestionTypes()
  const type = types.find((type) => type.slug === slug)
  if (!type) return { error: "This category no longer exists." }
  const clash = types.find(
    (other) =>
      other.slug !== slug && other.label.toLowerCase() === label.toLowerCase()
  )
  if (clash) return { error: `"${clash.label}" already exists.` }

  Object.assign(type, { label, icon, color: input.color })
  await saveQuestionTypes(types)
  revalidatePath("/", "layout")
  return { error: null }
}

export async function updateQuestion(
  slug: string,
  questionId: string,
  input: { question: string; answer: string }
): Promise<EditResult> {
  await requireAdmin()
  const question = input.question.trim()
  const answer = input.answer.trim()
  if (!question || !answer) {
    return { error: "Question and answer can't be empty." }
  }

  const types = await getQuestionTypes()
  const qa = types
    .find((type) => type.slug === slug)
    ?.questions.find((qa) => qa.id === questionId)
  if (!qa) return { error: "This question no longer exists." }

  Object.assign(qa, { question, answer })
  await saveQuestionTypes(types)
  revalidatePath("/", "layout")
  return { error: null }
}
