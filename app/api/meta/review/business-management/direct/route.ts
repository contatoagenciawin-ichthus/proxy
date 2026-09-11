import { NextResponse } from "next/server"

import {
  MetaReviewError,
  assertReviewAccess,
  getMetaReviewConfig,
  metaGraphRequest,
} from "@/lib/meta-review"

type Business = { id: string; name?: string }
type SystemUser = { id: string; name?: string; role?: string }

type SafeResult<T> = {
  ok: boolean
  data: T
  error?: string
}

async function safeGet<T>(path: string): Promise<SafeResult<T | null>> {
  try {
    return { ok: true, data: await metaGraphRequest<T>(path) }
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Graph API request failed.",
    }
  }
}

async function safeList<T>(path: string): Promise<SafeResult<T[]>> {
  try {
    const result = await metaGraphRequest<{ data?: T[] }>(path)
    return { ok: true, data: result.data || [] }
  } catch (error) {
    return {
      ok: false,
      data: [],
      error: error instanceof Error ? error.message : "Graph API request failed.",
    }
  }
}

function errorResponse(error: unknown) {
  if (error instanceof MetaReviewError) {
    return NextResponse.json(
      { ok: false, error: error.message, graph: error.details?.error },
      { status: error.status },
    )
  }

  console.error("direct business_management review error", error)
  return NextResponse.json(
    { ok: false, error: "Unexpected review console error." },
    { status: 500 },
  )
}

export async function GET(request: Request) {
  try {
    assertReviewAccess(request)
    const config = getMetaReviewConfig()

    const [tokenIdentity, business, businesses, systemUsers] = await Promise.all([
      safeGet<{ id: string; name?: string }>("/me?fields=id,name"),
      safeGet<Business>(`/${config.businessId}?fields=id,name`),
      safeList<Business>("/me/businesses?fields=id,name&limit=100"),
      safeList<SystemUser>(
        `/${config.businessId}/system_users?fields=id,name,role&limit=100`,
      ),
    ])

    const businessListed = businesses.data.some(
      (item) => item.id === config.businessId,
    )

    return NextResponse.json({
      ok: true,
      permission: "business_management",
      authentication: {
        customerAuthorization: "Facebook Login for Business",
        backendCredential: "System User Access Token",
        tokenVisibleToBrowser: false,
      },
      tokenIdentity,
      techProviderBusiness: {
        endpoint: `/${config.businessId}?fields=id,name`,
        ...business,
      },
      accessibleBusinesses: {
        endpoint: "/me/businesses?fields=id,name&limit=100",
        ...businesses,
        configuredBusinessListed: businessListed,
      },
      systemUsers: {
        endpoint: `/${config.businessId}/system_users?fields=id,name,role&limit=100`,
        ...systemUsers,
      },
      verification: {
        configuredBusinessResolved: Boolean(business.ok && business.data?.id),
        businessManagementReadCompleted: Boolean(business.ok && businesses.ok),
        systemUserReadCompleted: systemUsers.ok,
        tokenVisibleToBrowser: false,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = "force-dynamic"
