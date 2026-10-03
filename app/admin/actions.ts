"use server"

import { revalidatePath } from "next/cache"

import { COLOR_PALETTE, type QuestionType } from "@/components/constant/data"
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

// Server actions are public endpoints, so each one re-checks the session.
// Failures are returned rather than thrown: in production Next.js replaces
// thrown error messages with an opaque digest, so the UI couldn't tell why.
const SESSION_EXPIRED =
  "Your admin session has expired. Turn admin off and on again."

// Saves and revalidates, translating storage failures into a readable error
async function persist(types: QuestionType[]): Promise<EditResult> {
  try {
    await saveQuestionTypes(types)
  } catch (err) {
    console.error("Failed to save questions", err)
    const code = (err as NodeJS.ErrnoException).code
    return {
      error:
        code === "EROFS" || code === "EACCES" || code === "EPERM"
          ? "The server can't write to its data file (read-only storage), so changes can't be saved on this host."
          : "Couldn't save changes on the server.",
    }
  }
  revalidatePath("/", "layout")
  return { error: null }
}

export async function deleteQuestionType(slug: string): Promise<EditResult> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED }
  const types = await getQuestionTypes()
  return persist(types.filter((type) => type.slug !== slug))
}

export async function deleteQuestion(
  slug: string,
  questionId: string
): Promise<EditResult> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED }
  const types = await getQuestionTypes()
  const type = types.find((type) => type.slug === slug)
  if (!type) return { error: "This category no longer exists." }
  type.questions = type.questions.filter((qa) => qa.id !== questionId)
  return persist(types)
}

// Slug is deliberately left unchanged so existing links keep working
export async function updateQuestionType(
  slug: string,
  input: { label: string; icon: string; color: string }
): Promise<EditResult> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED }
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
  return persist(types)
}

export async function updateQuestion(
  slug: string,
  questionId: string,
  input: { question: string; answer: string }
): Promise<EditResult> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED }
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
  return persist(types)
}
