import { NextResponse } from "next/server"

import {
  MetaReviewError,
  assertReviewAccess,
  getMetaReviewConfig,
} from "@/lib/meta-review"

const DEFAULT_APP_ID = "1952034255371331"

type OAuthTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

type IntegrationIdentity = {
  id: string
  name?: string
  client_business_id?: string
}

type Business = {
  id: string
  name?: string
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
  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

function errorResponse(error: unknown) {
  if (error instanceof MetaReviewError) {
    return NextResponse.json(
      { ok: false, error: error.message, graph: error.details?.error },
      { status: error.status },
    )
  }

  console.error("business_management code exchange error", error)
  return NextResponse.json(
    { ok: false, error: "Unexpected authorization exchange error." },
    { status: 500 },
  )
}

async function graphRequest<T>(
  graphVersion: string,
  path: string,
  accessToken: string,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}${normalizedPath}`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  )

  const raw = await response.text()
  let payload: unknown = null

  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = { raw }
  }

  if (!response.ok) {
    const graphError = payload as {
      error?: {
        message?: string
        type?: string
        code?: number
        error_subcode?: number
        fbtrace_id?: string
      }
    }
    throw new MetaReviewError(
      graphError.error?.message || `Graph API returned HTTP ${response.status}.`,
      response.status,
      graphError,
    )
  }

  return payload as T
}

export async function POST(request: Request) {
  try {
    assertReviewAccess(request)

    const config = getMetaReviewConfig()
    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID || DEFAULT_APP_ID
    const appSecret = process.env.META_APP_SECRET || ""

    if (!appSecret) {
      throw new MetaReviewError(
        "META_APP_SECRET is not configured for the server-side authorization code exchange.",
        503,
      )
    }

    const body = (await request.json()) as {
      code?: string
      redirectUri?: string
    }

    const code = body.code?.trim() || ""
    const expectedRedirectUri = new URL("/meta/callback", request.url).toString()

    if (!code) {
      throw new MetaReviewError("Authorization code is required.", 400)
    }

    if (body.redirectUri !== expectedRedirectUri) {
      throw new MetaReviewError("OAuth redirect URI does not match the review callback.", 400)
    }

    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: expectedRedirectUri,
      code,
    })

    const tokenResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/oauth/access_token?${tokenParams.toString()}`,
      { cache: "no-store" },
    )

    const tokenPayload = (await tokenResponse.json()) as OAuthTokenResponse

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new MetaReviewError(
        tokenPayload.error?.message || "Meta did not return a Business Integration System User Access Token.",
        tokenResponse.status || 400,
        tokenPayload,
      )
    }

    const accessToken = tokenPayload.access_token

    const identity = await graphRequest<IntegrationIdentity>(
      config.graphVersion,
      "/me?fields=id,name,client_business_id",
      accessToken,
    )

    const clientBusinessId = identity.client_business_id || ""
    const clientBusiness = clientBusinessId
      ? await graphRequest<Business>(
          config.graphVersion,
          `/${clientBusinessId}?fields=id,name`,
          accessToken,
        )
      : null

    const appAccessToken = `${appId}|${appSecret}`
    const debugParams = new URLSearchParams({
      input_token: accessToken,
      access_token: appAccessToken,
    })
    const debugResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/debug_token?${debugParams.toString()}`,
      { cache: "no-store" },
    )
    const debugPayload = (await debugResponse.json()) as DebugTokenResponse

    if (!debugResponse.ok) {
      throw new MetaReviewError(
        debugPayload.error?.message || "Meta could not validate the issued access token.",
        debugResponse.status,
        debugPayload,
      )
    }

    const grantedScopes = debugPayload.data?.scopes || []
    const businessManagementGranted = grantedScopes.includes("business_management")
    const clientBusinessResolved = Boolean(clientBusiness?.id)

    return NextResponse.json({
      ok: true,
      permission: "business_management",
      tokenExchange: {
        completed: true,
        tokenType: "Business Integration System User Access Token",
        expiresIn: tokenPayload.expires_in || null,
        tokenVisibleToBrowser: false,
      },
      integrationSystemUser: {
        id: identity.id,
        name: identity.name || "Business Integration System User",
        endpoint: "/me?fields=id,name,client_business_id",
      },
      clientBusiness: clientBusiness
        ? {
            id: clientBusiness.id,
            name: clientBusiness.name || "Authorized Client Business",
            endpoint: `/${clientBusiness.id}?fields=id,name`,
          }
        : null,
      grantedScopes,
      verification: {
        tokenExchangeCompleted: true,
        businessManagementGranted,
        clientBusinessIdReturned: Boolean(clientBusinessId),
        clientBusinessResolved,
        tokenValid: debugPayload.data?.is_valid === true,
        tokenVisibleToBrowser: false,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = "force-dynamic"
