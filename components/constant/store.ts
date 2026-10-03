import { promises as fs } from "fs"
import path from "path"
import { Redis } from "@upstash/redis"

import type { QuestionType } from "@/components/constant/data"
import seed from "@/data/questions.json"

// Two backends behind the same functions:
// - Upstash Redis when its env vars are set (production on Vercel, whose
//   file system is read-only). The first read seeds it from questions.json.
// - data/questions.json otherwise (local development).
const REDIS_KEY = "question-types"

const hasRedis = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
)
const redis = hasRedis ? Redis.fromEnv() : null

const DATA_FILE = path.join(process.cwd(), "data", "questions.json")

export async function getQuestionTypes(): Promise<QuestionType[]> {
  if (redis) {
    const stored = await redis.get<QuestionType[]>(REDIS_KEY)
    if (stored) return stored
    // nx: don't clobber data another request seeded in the meantime
    await redis.set(REDIS_KEY, seed, { nx: true })
    return (await redis.get<QuestionType[]>(REDIS_KEY)) ?? seed
  }
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"))
}

export async function saveQuestionTypes(types: QuestionType[]) {
  if (redis) {
    await redis.set(REDIS_KEY, types)
    return
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(types, null, 2) + "\n")
}

export async function getQuestionType(slug: string) {
  const types = await getQuestionTypes()
  return types.find((type) => type.slug === slug)
}
