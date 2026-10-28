import "server-only"

import crypto from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "__Host-proxy-meta-ads-session"

type StoredMetaAdsSession = {
  accessToken: string
  expiresAt?: number | null
  scopes?: string[]
  userId?: string | null
}

function encryptionKey() {
  const secret = process.env.META_ADS_SESSION_SECRET || ""
  if (!secret) {
    throw new Error("META_ADS_SESSION_SECRET is not configured.")
  }
  return crypto.createHash("sha256").update(secret).digest()
}

function encrypt(value: StoredMetaAdsSession) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const plaintext = Buffer.from(JSON.stringify(value), "utf8")
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString("base64url")
}

function decrypt(value: string): StoredMetaAdsSession | null {
  try {
    const raw = Buffer.from(value, "base64url")
    if (raw.length < 29) return null

    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const encrypted = raw.subarray(28)

    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv)
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8")

    const parsed = JSON.parse(plaintext) as StoredMetaAdsSession
    return parsed?.accessToken ? parsed : null
  } catch {
    return null
  }
}

export async function persistMetaAdsSession(session: StoredMetaAdsSession) {
  const store = await cookies()
  const now = Math.floor(Date.now() / 1000)
  const maxAge = session.expiresAt
    ? Math.max(300, session.expiresAt - now)
    : 60 * 60 * 24 * 30

  store.set(COOKIE_NAME, encrypt(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  })
}

export async function readMetaAdsSession() {
  const store = await cookies()
  const value = store.get(COOKIE_NAME)?.value
  if (!value) return null

  const session = decrypt(value)
  if (!session) return null

  if (
    session.expiresAt &&
    session.expiresAt <= Math.floor(Date.now() / 1000) + 60
  ) {
    return null
  }

  return session
}
