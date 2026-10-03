import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

// Server-only helpers for admin mode. The passcode lives in ADMIN_PASSCODE
// (.env.local); the cookie holds an HMAC of it, so changing the passcode
// signs everyone out.
const COOKIE_NAME = "faq_admin"
const MAX_AGE_SECONDS = 60 * 60 * 8

function expectedToken() {
  const passcode = process.env.ADMIN_PASSCODE
  if (!passcode) return null
  return createHmac("sha256", passcode).update("faq-admin").digest("hex")
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

export function isPasscodeConfigured() {
  return Boolean(process.env.ADMIN_PASSCODE)
}

export function checkPasscode(input: string) {
  const passcode = process.env.ADMIN_PASSCODE
  return Boolean(passcode) && safeEqual(input, passcode!)
}

export async function isAdmin() {
  const token = expectedToken()
  const cookie = (await cookies()).get(COOKIE_NAME)?.value
  return Boolean(token && cookie && safeEqual(cookie, token))
}

export async function startAdminSession() {
  const token = expectedToken()
  if (!token) return
  ;(await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function endAdminSession() {
  ;(await cookies()).delete(COOKIE_NAME)
}
