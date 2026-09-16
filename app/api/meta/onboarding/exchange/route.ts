import { createHash, createHmac } from "node:crypto"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_APP_ID = "1952034255371331"
const DEFAULT_GRAPH_VERSION = "v26.0"

const CLIENT_HANDOFFS = [
  {
    wabaId: "269938242876600",
    phoneNumberId: "280401731826708",
    handoffUrl:
      "https://eduardobrasil.fonsecabrasilserrao.com/api/whatsapp/meta/credentials",
  },
] as const

type OAuthTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: GraphError
}

type GraphError = {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

type DebugTokenResponse = {
  data?: {
    app_id?: string
    is_valid?: boolean
    scopes?: string[]
    user_id?: string
    type?: string
    expires_at?: number
    data_access_expires_at?: number
  }
  error?: GraphError
}

type IntegrationIdentity = {
  id?: string
  name?: string
  client_business_id?: string
}

type PhoneNumber = {
  id?: string
  display_phone_number?: string
  verified_name?: string
  status?: string
  platform_type?: string
}

type GraphEnvelope<T> = T & { error?: GraphError }

type HandoffResponse = {
  ok?: boolean
  fingerprint?: string
  expiresAt?: string | null
  error?: string
}

class OnboardingExchangeError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "OnboardingExchangeError"
    this.status = status
  }
}

function getConfig() {
  return {
    appId:
      process.env.META_APP_ID?.trim() ||
      process.env.NEXT_PUBLIC_META_APP_ID?.trim() ||
      DEFAULT_APP_ID,
    appSecret: process.env.META_APP_SECRET?.trim() || "",
    graphVersion: process.env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION,
  }
}

async function graphRequest<T>(
  graphVersion: string,
  path: string,
  accessToken: string,
): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const response = await fetch(`https://graph.facebook.com/${graphVersion}${normalized}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const raw = await response.text()
  let payload: GraphEnvelope<T> | null = null
  try {
    payload = raw ? (JSON.parse(raw) as GraphEnvelope<T>) : null
  } catch {
    throw new OnboardingExchangeError(
      `A Graph API respondeu em formato inesperado (HTTP ${response.status}).`,
      502,
    )
  }

  if (!response.ok || payload?.error) {
    throw new OnboardingExchangeError(
      payload?.error?.message || `A Graph API retornou HTTP ${response.status}.`,
      response.status || 400,
    )
  }

  return payload as T
}

async function resolveClientAsset(input: {
  graphVersion: string
  accessToken: string
  requestedWabaId?: string
  requestedPhoneNumberId?: string
}) {
  const requestedWabaId = input.requestedWabaId?.trim() || ""
  const requestedPhoneNumberId = input.requestedPhoneNumberId?.trim() || ""

  const candidates = CLIENT_HANDOFFS.filter((client) => {
    if (requestedWabaId && client.wabaId !== requestedWabaId) return false
    if (requestedPhoneNumberId && client.phoneNumberId !== requestedPhoneNumberId) return false
    return true
  })

  if (!candidates.length) {
    throw new OnboardingExchangeError(
      "O ativo retornado pelo Embedded Signup ainda não está cadastrado para handoff seguro.",
      403,
    )
  }

  const accessible: Array<{
    client: (typeof CLIENT_HANDOFFS)[number]
    phone: PhoneNumber
  }> = []

  for (const client of candidates) {
    try {
      const phone = await graphRequest<PhoneNumber>(
        input.graphVersion,
        `/${client.phoneNumberId}?fields=id,display_phone_number,verified_name,status,platform_type`,
        input.accessToken,
      )
      if (phone.id === client.phoneNumberId) accessible.push({ client, phone })
    } catch {
      // O token pode enxergar apenas o cliente concluído nesta sessão.
    }
  }

  if (accessible.length !== 1) {
    throw new OnboardingExchangeError(
      accessible.length === 0
        ? "A credencial emitida pela Meta não conseguiu acessar o número esperado."
        : "Mais de um ativo compatível ficou acessível; o handoff foi interrompido por segurança.",
      403,
    )
  }

  return accessible[0]
}

async function handoffCredential(input: {
  url: string
  appSecret: string
  payload: Record<string, unknown>
}) {
  const rawBody = JSON.stringify(input.payload)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = `sha256=${createHmac("sha256", input.appSecret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex")}`

  const response = await fetch(input.url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-proxy-timestamp": timestamp,
      "x-proxy-signature": signature,
    },
    body: rawBody,
  })

  const raw = await response.text()
  let result: HandoffResponse = {}
  try {
    result = raw ? (JSON.parse(raw) as HandoffResponse) : {}
  } catch {
    throw new OnboardingExchangeError(
      `O backend do cliente respondeu em formato inesperado (HTTP ${response.status}).`,
      502,
    )
  }

  if (!response.ok || result.ok !== true) {
    throw new OnboardingExchangeError(
      result.error || `O backend do cliente recusou o handoff (HTTP ${response.status}).`,
      response.status || 502,
    )
  }

  return result
}

export async function POST(request: Request) {
  try {
    const config = getConfig()
    if (!config.appSecret) {
      throw new OnboardingExchangeError(
        "META_APP_SECRET não está configurado no backend da Proxy.",
        503,
      )
    }

    const body = (await request.json()) as {
      code?: string
      wabaId?: string
      phoneNumberId?: string
      businessId?: string
    }
    const code = body.code?.trim() || ""
    if (!code) {
      throw new OnboardingExchangeError("Código de autorização ausente.", 400)
    }

    const tokenParams = new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      code,
    })
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/oauth/access_token?${tokenParams.toString()}`,
      { cache: "no-store" },
    )
    const tokenPayload = (await tokenResponse.json()) as OAuthTokenResponse

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new OnboardingExchangeError(
        tokenPayload.error?.message ||
          "A Meta não retornou a credencial do Business Integration System User.",
        tokenResponse.status || 400,
      )
    }

    const accessToken = tokenPayload.access_token
    const appAccessToken = `${config.appId}|${config.appSecret}`
    const debugParams = new URLSearchParams({
      input_token: accessToken,
      access_token: appAccessToken,
    })
    const debugResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/debug_token?${debugParams.toString()}`,
      { cache: "no-store" },
    )
    const debugPayload = (await debugResponse.json()) as DebugTokenResponse

    if (!debugResponse.ok || debugPayload.data?.is_valid !== true) {
      throw new OnboardingExchangeError(
        debugPayload.error?.message || "A Meta emitiu uma credencial que não pôde ser validada.",
        debugResponse.status || 403,
      )
    }

    if (debugPayload.data.app_id && debugPayload.data.app_id !== config.appId) {
      throw new OnboardingExchangeError("A credencial emitida pertence a outro aplicativo Meta.", 403)
    }

    const grantedScopes = debugPayload.data.scopes || []
    const requiredScopes = [
      "whatsapp_business_management",
      "whatsapp_business_messaging",
    ]
    const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope))
    if (missingScopes.length) {
      throw new OnboardingExchangeError(
        `A credencial não recebeu as permissões necessárias: ${missingScopes.join(", ")}.`,
        403,
      )
    }

    let identity: IntegrationIdentity = {}
    try {
      identity = await graphRequest<IntegrationIdentity>(
        config.graphVersion,
        "/me?fields=id,name,client_business_id",
        accessToken,
      )
    } catch {
      // A identidade é metadado auxiliar; o acesso ao ativo abaixo é a validação decisiva.
    }

    const resolved = await resolveClientAsset({
      graphVersion: config.graphVersion,
      accessToken,
      requestedWabaId: body.wabaId,
      requestedPhoneNumberId: body.phoneNumberId,
    })

    if (resolved.phone.status && resolved.phone.status !== "CONNECTED") {
      throw new OnboardingExchangeError(
        `O número foi localizado, mas está com status ${resolved.phone.status}.`,
        409,
      )
    }

    if (
      resolved.phone.platform_type &&
      resolved.phone.platform_type !== "CLOUD_API"
    ) {
      throw new OnboardingExchangeError(
        `O número foi localizado, mas ainda aparece como ${resolved.phone.platform_type}.`,
        409,
      )
    }

    const fingerprint = createHash("sha256")
      .update(accessToken, "utf8")
      .digest("hex")
      .slice(0, 16)

    const handoff = await handoffCredential({
      url: resolved.client.handoffUrl,
      appSecret: config.appSecret,
      payload: {
        wabaId: resolved.client.wabaId,
        phoneNumberId: resolved.client.phoneNumberId,
        accessToken,
        tokenType:
          tokenPayload.token_type || debugPayload.data.type || "Business Integration System User",
        expiresIn: tokenPayload.expires_in || null,
        scopes: grantedScopes,
        integrationUserId: identity.id || debugPayload.data.user_id || null,
        clientBusinessId: identity.client_business_id || body.businessId || null,
      },
    })

    if (handoff.fingerprint && handoff.fingerprint !== fingerprint) {
      throw new OnboardingExchangeError(
        "O backend do cliente armazenou uma credencial diferente da emitida nesta sessão.",
        502,
      )
    }

    return NextResponse.json({
      ok: true,
      tokenExchangeCompleted: true,
      tokenStored: true,
      tokenVisibleToBrowser: false,
      tokenFingerprint: fingerprint,
      expiresAt: handoff.expiresAt || null,
      grantedScopes,
      integrationUserId: identity.id || debugPayload.data.user_id || null,
      clientBusinessId: identity.client_business_id || body.businessId || null,
      asset: {
        wabaId: resolved.client.wabaId,
        phoneNumberId: resolved.client.phoneNumberId,
        displayPhoneNumber: resolved.phone.display_phone_number || null,
        verifiedName: resolved.phone.verified_name || null,
        status: resolved.phone.status || null,
        platformType: resolved.phone.platform_type || null,
      },
    })
  } catch (error) {
    const status = error instanceof OnboardingExchangeError ? error.status : 500
    const message =
      error instanceof Error ? error.message : "Falha inesperada na troca da autorização Meta."
    console.error("Meta Embedded Signup exchange failed", { status, message })
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
