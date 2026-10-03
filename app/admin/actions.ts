"use server"

import { revalidatePath } from "next/cache"

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
