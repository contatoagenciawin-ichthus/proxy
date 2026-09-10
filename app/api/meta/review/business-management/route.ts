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
type SharedWaba = {
  id: string
  name?: string
  currency?: string
  timezone_id?: string
  owner_business_info?: {
    id?: string
    name?: string
  }
}

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

async function safeGet<T>(path: string): Promise<SafeResult<T | null>> {
  try {
    const result = await metaGraphRequest<T>(path)
    return { ok: true, data: result }
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Graph API request failed.",
    }
  }
}

function normalizeMetaId(value: string | null) {
  if (!value) return ""
  return /^\d+$/.test(value) ? value : ""
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

    const signupWabaId = normalizeMetaId(request.headers.get("x-review-waba-id"))
    const signupPhoneNumberId = normalizeMetaId(
      request.headers.get("x-review-phone-number-id"),
    )
    const signupBusinessId = normalizeMetaId(
      request.headers.get("x-review-business-id"),
    )

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

    const sharedWabasEndpoint = `/${config.businessId}/client_whatsapp_business_accounts`
    const [systemUsers, sharedWabas, signupWaba] = await Promise.all([
      safeList<SystemUser>(
        `/${config.businessId}/system_users?fields=id,name,role&limit=100`,
      ),
      safeList<SharedWaba>(
        `${sharedWabasEndpoint}?fields=id,name,currency,timezone_id,owner_business_info&limit=100`,
      ),
      signupWabaId
        ? safeGet<SharedWaba>(
            `/${signupWabaId}?fields=id,name,currency,timezone_id,owner_business_info`,
          )
        : Promise.resolve<SafeResult<SharedWaba | null>>({ ok: true, data: null }),
    ])

    const matchedSharedWaba = signupWabaId
      ? sharedWabas.data.find((waba) => waba.id === signupWabaId) || null
      : null

    const resolvedWaba = matchedSharedWaba || signupWaba.data
    const ownerBusiness = resolvedWaba?.owner_business_info?.id
      ? {
          id: resolvedWaba.owner_business_info.id,
          name: resolvedWaba.owner_business_info.name || "Customer Business",
          source: `/${resolvedWaba.id}?fields=owner_business_info`,
        }
      : signupBusinessId
        ? {
            id: signupBusinessId,
            name: "Business selected during Embedded Signup",
            source: "Embedded Signup event",
          }
        : null

    return NextResponse.json({
      ok: true,
      permission: "business_management",
      authentication: {
        model: "server-to-server",
        credential: "System User Access Token",
        userLoginRequiredForBackendCalls: false,
        customerAuthorizationRequired: true,
        tokenVisibleToBrowser: false,
      },
      techProviderBusiness: {
        id: config.businessId,
        name: selectedBusiness?.name || "Proxy Technology",
        endpoint: businessSource,
      },
      embeddedSignup: {
        wabaId: signupWabaId || null,
        phoneNumberId: signupPhoneNumberId || null,
        businessId: signupBusinessId || ownerBusiness?.id || null,
      },
      customerBusiness: ownerBusiness,
      authorizedClientWaba: {
        endpoint: signupWabaId
          ? `/${signupWabaId}?fields=id,name,currency,timezone_id,owner_business_info`
          : null,
        ...signupWaba,
      },
      systemUsers: {
        endpoint: `/${config.businessId}/system_users`,
        ...systemUsers,
      },
      sharedClientWabas: {
        endpoint: sharedWabasEndpoint,
        ...sharedWabas,
      },
      sharedWabaMatch: {
        requestedWabaId: signupWabaId || null,
        matched: Boolean(matchedSharedWaba),
        waba: matchedSharedWaba,
      },
      verification: {
        metaLoginAndEmbeddedSignupExpected: true,
        embeddedSignupEvidenceReceived: Boolean(signupWabaId),
        customerBusinessResolved: Boolean(ownerBusiness?.id),
        sharedClientWabaRetrieved: Boolean(matchedSharedWaba),
        serverToServerBusinessManagementCompleted:
          systemUsers.ok && sharedWabas.ok,
        tokenVisibleToBrowser: false,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = "force-dynamic"
