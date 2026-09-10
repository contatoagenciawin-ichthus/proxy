import { NextResponse } from "next/server"

import {
  MetaReviewError,
  assertReviewAccess,
  getMetaReviewConfig,
  metaGraphRequest,
} from "@/lib/meta-review"

type Business = { id: string; name?: string }
type BusinessList = { data?: Business[] }
type SystemUser = { id: string; name?: string; role?: string }
type SystemUserList = { data?: SystemUser[] }
type SharedWaba = {
  id: string
  name?: string
  currency?: string
  timezone_id?: string
}
type SharedWabaList = { data?: SharedWaba[] }

type SafeResult<T> = {
  ok: boolean
  data: T
  error?: string
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
      {
        ok: false,
        error: error.message,
        graph: error.details?.error,
      },
      { status: error.status },
    )
  }

  console.error("business_management review error", error)
  return NextResponse.json(
    { ok: false, error: "Unexpected review console error." },
    { status: 500 },
  )
}

export async function GET(request: Request) {
  try {
    assertReviewAccess(request)
    const config = getMetaReviewConfig()

    let selectedBusiness: Business | null = null
    let businessSource = "/me/businesses"

    try {
      const businesses = await metaGraphRequest<BusinessList>(
        "/me/businesses?fields=id,name&limit=100",
      )
      selectedBusiness =
        businesses.data?.find((business) => business.id === config.businessId) || null
    } catch {
      selectedBusiness = await metaGraphRequest<Business>(
        `/${config.businessId}?fields=id,name`,
      )
      businessSource = `/${config.businessId}`
    }

    const [systemUsers, sharedWabas] = await Promise.all([
      safeList<SystemUser>(
        `/${config.businessId}/system_users?fields=id,name,role&limit=100`,
      ),
      safeList<SharedWaba>(
        `/${config.businessId}/client_whatsapp_business_accounts?fields=id,name,currency,timezone_id&limit=100`,
      ),
    ])

    return NextResponse.json({
      ok: true,
      permission: "business_management",
      authentication: {
        model: "server-to-server",
        credential: "System User Access Token",
        userLoginRequired: false,
        tokenVisibleToBrowser: false,
      },
      business: {
        id: config.businessId,
        name: selectedBusiness?.name || "Proxy Technology",
        endpoint: businessSource,
      },
      systemUsers: {
        endpoint: `/${config.businessId}/system_users`,
        ...systemUsers,
      },
      sharedClientWabas: {
        endpoint: `/${config.businessId}/client_whatsapp_business_accounts`,
        ...sharedWabas,
      },
      productionFlow: [
        "A customer completes WhatsApp Embedded Signup and explicitly grants access to the required business assets.",
        "Meta shares the authorized WhatsApp Business Account with Proxy Technology as the Tech Provider.",
        "Proxy's backend uses its System User Access Token and business_management to retrieve the authorized business context and shared client WABAs.",
        "The WABA is then associated with the correct tenant in Proxy's products. Tokens remain server-side.",
      ],
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = "force-dynamic"
