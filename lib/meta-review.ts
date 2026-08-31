const DEFAULT_GRAPH_VERSION = "v26.0"
const DEFAULT_BUSINESS_ID = "1400292674809647"
const DEFAULT_WABA_ID = "1086874920553716"
const DEFAULT_PHONE_NUMBER_ID = "1273362979192758"

export type MetaGraphError = {
  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

export class MetaReviewError extends Error {
  status: number
  details?: MetaGraphError

  constructor(message: string, status = 500, details?: MetaGraphError) {
    super(message)
    this.name = "MetaReviewError"
    this.status = status
    this.details = details
  }
}

export function getMetaReviewConfig() {
  const graphVersion = process.env.META_GRAPH_VERSION || DEFAULT_GRAPH_VERSION
  const accessToken = process.env.META_REVIEW_ACCESS_TOKEN || ""
  const reviewKey = process.env.META_REVIEW_KEY || ""
  const businessId = process.env.META_REVIEW_BUSINESS_ID || DEFAULT_BUSINESS_ID
  const wabaId = process.env.META_REVIEW_WABA_ID || DEFAULT_WABA_ID
  const phoneNumberId =
    process.env.META_REVIEW_PHONE_NUMBER_ID || DEFAULT_PHONE_NUMBER_ID
  const recipientPhone = process.env.META_REVIEW_RECIPIENT_PHONE || ""

  return {
    graphVersion,
    accessToken,
    reviewKey,
    businessId,
    wabaId,
    phoneNumberId,
    recipientPhone,
  }
}

export function assertReviewAccess(request: Request) {
  const { reviewKey } = getMetaReviewConfig()

  if (!reviewKey) {
    throw new MetaReviewError(
      "A console de revisão ainda não possui META_REVIEW_KEY configurada.",
      503,
    )
  }

  const providedKey = request.headers.get("x-review-key") || ""
  if (providedKey !== reviewKey) {
    throw new MetaReviewError("Chave de revisão inválida.", 401)
  }
}

export function assertMetaReviewReady() {
  const config = getMetaReviewConfig()
  const missing: string[] = []

  if (!config.accessToken) missing.push("META_REVIEW_ACCESS_TOKEN")

  if (missing.length) {
    throw new MetaReviewError(
      `Configuração incompleta: ${missing.join(", ")}.`,
      503,
    )
  }

  return config
}

export async function metaGraphRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = assertMetaReviewReady()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = `https://graph.facebook.com/${config.graphVersion}${normalizedPath}`

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })

  const raw = await response.text()
  let payload: unknown = null

  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = { raw }
  }

  if (!response.ok) {
    const graphError = payload as MetaGraphError
    const message =
      graphError?.error?.message ||
      `A Graph API retornou HTTP ${response.status}.`

    throw new MetaReviewError(message, response.status, graphError)
  }

  return payload as T
}

export function normalizeWhatsAppRecipient(value: string) {
  return value.replace(/\D/g, "")
}

export function maskPhone(value: string) {
  const digits = normalizeWhatsAppRecipient(value)
  if (digits.length < 6) return digits || "não configurado"
  return `${digits.slice(0, 4)}••••${digits.slice(-4)}`
}
