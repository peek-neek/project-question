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

// Vercel's Upstash integration may add a custom prefix to the variable names
// (e.g. STORAGE_KV_REST_API_URL), so match on the suffix
function findEnv(suffixes: string[]) {
  const key = Object.keys(process.env).find((name) =>
    suffixes.some((suffix) => name.endsWith(suffix))
  )
  return key ? process.env[key] : undefined
}

const redisUrl = findEnv(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"])
const redisToken = findEnv(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"])
const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

// On Vercel the file fallback can never be written, so saving must fail
// with a setup hint instead of a generic read-only error
export const STORAGE_MISSING =
  !redis && process.env.VERCEL
    ? "No Redis connection found. In Vercel, connect Upstash for Redis to this project (Production environment) and redeploy."
    : null

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
