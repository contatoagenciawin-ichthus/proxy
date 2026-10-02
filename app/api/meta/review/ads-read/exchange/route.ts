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

type AdAccount = {
  id: string
  name?: string
  account_status?: number
  currency?: string
  timezone_name?: string
}

type InsightsRow = {
  account_id?: string
  account_name?: string
  campaign_id?: string
  campaign_name?: string
  spend?: string
  impressions?: string
  reach?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  frequency?: string
  actions?: Array<{ action_type?: string; value?: string }>
  cost_per_action_type?: Array<{ action_type?: string; value?: string }>
  date_start?: string
  date_stop?: string
}

function errorResponse(error: unknown) {
  if (error instanceof MetaReviewError) {
    return NextResponse.json(
      { ok: false, error: error.message, graph: error.details?.error },
      { status: error.status },
    )
  }

  console.error("ads_read code exchange error", error)
  return NextResponse.json(
    { ok: false, error: "Unexpected ads_read authorization exchange error." },
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

async function fetchAccountInsights(
  graphVersion: string,
  accountId: string,
  accessToken: string,
) {
  const fields = [
    "account_id",
    "account_name",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "date_start",
    "date_stop",
  ].join(",")

  const path =
    `/${accountId}/insights?level=account&date_preset=last_30d&fields=${encodeURIComponent(fields)}&limit=1`

  const payload = await graphRequest<{ data?: InsightsRow[] }>(
    graphVersion,
    path,
    accessToken,
  )

  return payload.data?.[0] || null
}

async function fetchCampaignInsights(
  graphVersion: string,
  accountId: string,
  accessToken: string,
) {
  const fields = [
    "campaign_id",
    "campaign_name",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "actions",
    "cost_per_action_type",
    "date_start",
    "date_stop",
  ].join(",")

  const path =
    `/${accountId}/insights?level=campaign&date_preset=last_30d&fields=${encodeURIComponent(fields)}&limit=50`

  const payload = await graphRequest<{ data?: InsightsRow[] }>(
    graphVersion,
    path,
    accessToken,
  )

  return payload.data || []
}

export async function POST(request: Request) {
  try {
    assertReviewAccess(request)

    const config = getMetaReviewConfig()
    const appId =
      process.env.META_APP_ID ||
      process.env.NEXT_PUBLIC_META_APP_ID ||
      DEFAULT_APP_ID
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
      requestedAccountId?: string
    }

    const code = body.code?.trim() || ""
    const requestedAccountIdRaw = body.requestedAccountId?.trim() || ""
    const requestedAccountId = requestedAccountIdRaw
      ? requestedAccountIdRaw.startsWith("act_")
        ? requestedAccountIdRaw
        : `act_${requestedAccountIdRaw}`
      : ""

    if (requestedAccountId && !/^act_\d+$/.test(requestedAccountId)) {
      throw new MetaReviewError("Requested ad account ID is invalid.", 400)
    }

    const expectedRedirectUri = new URL("/meta/callback", request.url).toString()

    if (!code) {
      throw new MetaReviewError("Authorization code is required.", 400)
    }

    if (body.redirectUri !== expectedRedirectUri) {
      throw new MetaReviewError(
        "OAuth redirect URI does not match the review callback.",
        400,
      )
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
        tokenPayload.error?.message ||
          "Meta did not return an access token for ads_read.",
        tokenResponse.status || 400,
        tokenPayload,
      )
    }

    const accessToken = tokenPayload.access_token
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
    const adsReadGranted = grantedScopes.includes("ads_read")

    if (!adsReadGranted) {
      throw new MetaReviewError(
        "Meta authorization completed, but the issued token does not include ads_read.",
        403,
      )
    }

    const accountsPayload = await graphRequest<{ data?: AdAccount[] }>(
      config.graphVersion,
      "/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=100",
      accessToken,
    )

    // Keep every account returned by Meta. The review flow previously truncated
    // the response to the first 10 accounts, which could hide valid client
    // accounts from the selector even when the authorized user had access.
    const accounts = [...(accountsPayload.data || [])]

    let requestedAccountProbe: {
      requested: string | null
      accessible: boolean
      error: string | null
    } = {
      requested: requestedAccountId || null,
      accessible: requestedAccountId
        ? accounts.some((account) => account.id === requestedAccountId)
        : false,
      error: null,
    }

    if (
      requestedAccountId &&
      !accounts.some((account) => account.id === requestedAccountId)
    ) {
      try {
        const requestedAccount = await graphRequest<AdAccount>(
          config.graphVersion,
          `/${requestedAccountId}?fields=id,name,account_status,currency,timezone_name`,
          accessToken,
        )
        accounts.push(requestedAccount)
        requestedAccountProbe = {
          requested: requestedAccountId,
          accessible: true,
          error: null,
        }
      } catch (error) {
        requestedAccountProbe = {
          requested: requestedAccountId,
          accessible: false,
          error:
            error instanceof Error
              ? error.message
              : "Direct ad account lookup failed.",
        }
      }
    }

    const accountsWithInsights = await Promise.all(
      accounts.map(async (account) => {
        try {
          const insights = await fetchAccountInsights(
            config.graphVersion,
            account.id,
            accessToken,
          )
          return { ...account, insights, insightsError: null }
        } catch (error) {
          return {
            ...account,
            insights: null,
            insightsError:
              error instanceof Error ? error.message : "Insights request failed.",
          }
        }
      }),
    )

    const primaryAccount =
      accountsWithInsights.find(
        (account) => account.account_status === 1 && account.insights,
      ) ||
      accountsWithInsights.find((account) => account.insights) ||
      accountsWithInsights[0] ||
      null

    const campaignInsightsByAccountEntries = await Promise.all(
      accountsWithInsights.map(async (account) => {
        try {
          const rows = await fetchCampaignInsights(
            config.graphVersion,
            account.id,
            accessToken,
          )
          return [
            account.id,
            { data: rows, error: null as string | null },
          ] as const
        } catch (error) {
          return [
            account.id,
            {
              data: [] as InsightsRow[],
              error:
                error instanceof Error
                  ? error.message
                  : "Campaign insights request failed.",
            },
          ] as const
        }
      }),
    )

    const campaignInsightsByAccount = Object.fromEntries(
      campaignInsightsByAccountEntries,
    ) as Record<
      string,
      { data: InsightsRow[]; error: string | null }
    >

    const primaryCampaignInsights = primaryAccount
      ? campaignInsightsByAccount[primaryAccount.id]?.data || []
      : []

    return NextResponse.json({
      ok: true,
      permission: "ads_read",
      authentication: {
        model: "Facebook OAuth authorization code",
        tokenExchangeCompleted: true,
        tokenVisibleToBrowser: false,
        tokenPersistedByReviewFlow: false,
      },
      grantedScopes,
      tokenValidation: {
        valid: debugPayload.data?.is_valid === true,
        tokenType: debugPayload.data?.type || tokenPayload.token_type || "USER",
        userId: debugPayload.data?.user_id || null,
      },
      adAccounts: accountsWithInsights,
      requestedAccountProbe,
      primaryAccountId: primaryAccount?.id || null,
      campaignInsights: primaryCampaignInsights,
      campaignInsightsError: primaryAccount
        ? campaignInsightsByAccount[primaryAccount.id]?.error || null
        : null,
      campaignInsightsByAccount,
      period: "last_30d",
      verification: {
        adsReadGranted,
        tokenValid: debugPayload.data?.is_valid === true,
        adAccountsRetrieved: accountsWithInsights.length > 0,
        accountInsightsRetrieved: accountsWithInsights.some((account) => Boolean(account.insights)),
        campaignInsightsRetrieved: Object.values(
          campaignInsightsByAccount,
        ).some((entry) => entry.data.length > 0),
        tokenVisibleToBrowser: false,
        tokenPersistedByReviewFlow: false,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = "force-dynamic"
