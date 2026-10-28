import { NextResponse } from "next/server"

import { currentPlatformAdmin } from "@/lib/meta-admin/auth"
import { getMetaReviewConfig, MetaReviewError } from "@/lib/meta-review"

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

type CallStats = {
  attempted: number
  succeeded: number
  failed: number
}

async function monitoredGraphRequest<T>(
  graphVersion: string,
  path: string,
  accessToken: string,
  stats: CallStats,
): Promise<T> {
  stats.attempted += 1
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
    stats.failed += 1
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

  stats.succeeded += 1
  return payload as T
}

async function accountInsights(
  graphVersion: string,
  accountId: string,
  accessToken: string,
  stats: CallStats,
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

  const payload = await monitoredGraphRequest<{ data?: InsightsRow[] }>(
    graphVersion,
    `/${accountId}/insights?level=account&date_preset=last_30d&fields=${encodeURIComponent(fields)}&limit=1`,
    accessToken,
    stats,
  )

  return payload.data?.[0] || null
}

async function campaignInsights(
  graphVersion: string,
  accountId: string,
  accessToken: string,
  stats: CallStats,
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

  const payload = await monitoredGraphRequest<{ data?: InsightsRow[] }>(
    graphVersion,
    `/${accountId}/insights?level=campaign&date_preset=last_30d&fields=${encodeURIComponent(fields)}&limit=50`,
    accessToken,
    stats,
  )

  return payload.data || []
}

export async function POST() {
  if (!(await currentPlatformAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 })
  }

  const config = getMetaReviewConfig()
  const accessToken = config.accessToken
  const stats: CallStats = { attempted: 0, succeeded: 0, failed: 0 }

  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "META_REVIEW_ACCESS_TOKEN is not configured in production.",
        stats,
      },
      { status: 503 },
    )
  }

  try {
    const accountsPayload = await monitoredGraphRequest<{ data?: AdAccount[] }>(
      config.graphVersion,
      "/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=100",
      accessToken,
      stats,
    )

    const accounts = accountsPayload.data || []

    const accountsWithInsights = await Promise.all(
      accounts.map(async (account) => {
        try {
          const insights = await accountInsights(
            config.graphVersion,
            account.id,
            accessToken,
            stats,
          )
          return { ...account, insights, insightsError: null as string | null }
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

    const campaignEntries = await Promise.all(
      accountsWithInsights.map(async (account) => {
        try {
          const data = await campaignInsights(
            config.graphVersion,
            account.id,
            accessToken,
            stats,
          )
          return [account.id, { data, error: null as string | null }] as const
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

    const campaignInsightsByAccount = Object.fromEntries(campaignEntries)
    const primaryAccount =
      accountsWithInsights.find(
        (account) => account.account_status === 1 && account.insights,
      ) ||
      accountsWithInsights.find((account) => account.insights) ||
      accountsWithInsights[0] ||
      null

    const errorRate =
      stats.attempted > 0 ? stats.failed / stats.attempted : 0

    return NextResponse.json({
      ok: true,
      completedAt: new Date().toISOString(),
      period: "last_30d",
      primaryAccountId: primaryAccount?.id || null,
      adAccounts: accountsWithInsights,
      campaignInsightsByAccount,
      stats: {
        ...stats,
        errorRate,
        errorRatePercent: Number((errorRate * 100).toFixed(2)),
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta Ads refresh failed."
    const errorRate =
      stats.attempted > 0 ? stats.failed / stats.attempted : 0

    return NextResponse.json(
      {
        ok: false,
        error: message,
        stats: {
          ...stats,
          errorRate,
          errorRatePercent: Number((errorRate * 100).toFixed(2)),
        },
      },
      { status: error instanceof MetaReviewError ? error.status : 500 },
    )
  }
}

export const dynamic = "force-dynamic"
