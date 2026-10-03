import { promises as fs } from "fs"
import path from "path"

import type { QuestionType } from "@/components/constant/data"

// Stored as JSON so submissions from /submit can be persisted at runtime.
// Swap these functions for a database later; callers won't change.
const DATA_FILE = path.join(process.cwd(), "data", "questions.json")

export async function getQuestionTypes(): Promise<QuestionType[]> {
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"))
}

export async function saveQuestionTypes(types: QuestionType[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(types, null, 2) + "\n")
}

export async function getQuestionType(slug: string) {
  const types = await getQuestionTypes()
  return types.find((type) => type.slug === slug)
}
