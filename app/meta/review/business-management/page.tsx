"use client"

import { useEffect, useState } from "react"

const REVIEW_SESSION_KEY = "proxy_meta_business_management_review"
const REVIEW_ACCESS_KEY = "proxy_meta_business_management_review_key"

type ReviewSession = {
  startedAt?: string
  completedAt?: string
  metaLoginCompleted?: boolean
  embeddedSignupCompleted?: boolean
  embeddedSignupEvent?: string
  wabaId?: string
  phoneNumberId?: string
  businessId?: string
}

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

type ReviewPayload = {
  ok: true
  permission: string
  authentication: {
    model: string
    credential: string
    userLoginRequiredForBackendCalls: boolean
    customerAuthorizationRequired: boolean
    tokenVisibleToBrowser: boolean
  }
  techProviderBusiness: {
    id: string
    name: string
    endpoint: string
  }
  embeddedSignup: {
    wabaId: string | null
    phoneNumberId: string | null
    businessId: string | null
  }
  customerBusiness: {
    id: string
    name: string
    source: string
  } | null
  authorizedClientWaba: {
    endpoint: string | null
    ok: boolean
    data: SharedWaba | null
    error?: string
  }
  systemUsers: {
    endpoint: string
    ok: boolean
    data: Array<{ id: string; name?: string; role?: string }>
    error?: string
  }
  sharedClientWabas: {
    endpoint: string
    ok: boolean
    data: SharedWaba[]
    error?: string
  }
  sharedWabaMatch: {
    requestedWabaId: string | null
    matched: boolean
    waba: SharedWaba | null
  }
  verification: {
    metaLoginAndEmbeddedSignupExpected: boolean
    embeddedSignupEvidenceReceived: boolean
    customerBusinessResolved: boolean
    sharedClientWabaRetrieved: boolean
    serverToServerBusinessManagementCompleted: boolean
    tokenVisibleToBrowser: boolean
  }
}

function CheckItem({
  complete,
  children,
}: {
  complete: boolean
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          complete
            ? "bg-emerald-300 text-slate-950"
            : "border border-amber-300/50 bg-amber-300/10 text-amber-200"
        }`}
      >
        {complete ? "✓" : "!"}
      </span>
      <span className={complete ? "text-emerald-50" : "text-amber-100"}>{children}</span>
    </li>
  )
}

export default function BusinessManagementReviewPage() {
  const [reviewKey, setReviewKey] = useState("")
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null)
  const [data, setData] = useState<ReviewPayload | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedKey = window.sessionStorage.getItem(REVIEW_ACCESS_KEY)
    if (storedKey) setReviewKey(storedKey)

    const storedSession = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (storedSession) {
      try {
        setReviewSession(JSON.parse(storedSession) as ReviewSession)
      } catch {
        window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
      }
    }
  }, [])

  function storeReviewKey(value: string) {
    setReviewKey(value)
    if (value) window.sessionStorage.setItem(REVIEW_ACCESS_KEY, value)
    else window.sessionStorage.removeItem(REVIEW_ACCESS_KEY)
  }

  function startMetaAuthorization() {
    if (reviewKey) window.sessionStorage.setItem(REVIEW_ACCESS_KEY, reviewKey)
    window.location.assign("/meta/onboarding?review=business-management")
  }

  function restartReviewFlow() {
    window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
    setReviewSession(null)
    setData(null)
    setError("")
    window.location.assign("/meta/onboarding?review=business-management")
  }

  async function runReviewFlow() {
    setLoading(true)
    setError("")
    setData(null)

    try {
      const headers: Record<string, string> = { "x-review-key": reviewKey }
      if (reviewSession?.wabaId) headers["x-review-waba-id"] = reviewSession.wabaId
      if (reviewSession?.phoneNumberId) {
        headers["x-review-phone-number-id"] = reviewSession.phoneNumberId
      }
      if (reviewSession?.businessId) {
        headers["x-review-business-id"] = reviewSession.businessId
      }

      const response = await fetch("/api/meta/review/business-management", {
        headers,
        cache: "no-store",
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`)
      setData(payload as ReviewPayload)
      window.sessionStorage.setItem(REVIEW_ACCESS_KEY, reviewKey)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review verification failed.")
    } finally {
      setLoading(false)
    }
  }

  const browserAuthorizationComplete = Boolean(
    reviewSession?.metaLoginCompleted && reviewSession?.embeddedSignupCompleted,
  )
  const endToEndComplete = Boolean(
    browserAuthorizationComplete &&
      data?.verification.customerBusinessResolved &&
      data?.verification.sharedClientWabaRetrieved &&
      data?.verification.serverToServerBusinessManagementCompleted,
  )

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Proxy Technology · Meta App Review</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            business_management end-to-end review
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            This walkthrough shows the complete use case requested by Meta: customer authorization through Meta Login and WhatsApp Embedded Signup, followed by Proxy's server-to-server verification of the business assets shared by that customer.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Authentication model</p>
            <p className="mt-2 text-cyan-100/85">
              The customer-facing authorization is completed through Meta Login and Meta's official Embedded Signup. After that authorization, Proxy uses <code className="text-cyan-100">business_management</code> server-to-server with a System User Access Token stored only in the backend. The token is never exposed in the browser.
            </p>
          </div>

          <div className="mt-7 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="text-sm font-medium text-slate-300">Review access key</span>
              <input
                type="password"
                value={reviewKey}
                onChange={(event) => storeReviewKey(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                placeholder="Enter the review access key"
              />
            </label>
            <button
              type="button"
              onClick={startMetaAuthorization}
              disabled={!reviewKey}
              className="min-h-12 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {browserAuthorizationComplete ? "Run Meta authorization again" : "Start Meta Login and Embedded Signup"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}
        </header>

        <div className="mt-7 space-y-6">
          <section className={`rounded-2xl border p-6 ${browserAuthorizationComplete ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${browserAuthorizationComplete ? "text-emerald-300" : "text-amber-300"}`}>Step 1 · Customer authorization</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Meta Login and WhatsApp Embedded Signup</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  The reviewer should complete the Meta flow in full, including business and WhatsApp asset selection and the final authorization confirmation.
                </p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${browserAuthorizationComplete ? "bg-emerald-300/15 text-emerald-200" : "bg-amber-300/15 text-amber-200"}`}>
                {browserAuthorizationComplete ? "Completed" : "Required"}
              </span>
            </div>

            {reviewSession ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Meta Login</p>
                  <p className="mt-2 text-sm font-medium text-white">{reviewSession.metaLoginCompleted ? "Authorization received" : "Not completed"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Authorized WABA ID</p>
                  <p className="mt-2 break-all text-sm font-medium text-white">{reviewSession.wabaId || "Not returned yet"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Phone Number ID</p>
                  <p className="mt-2 break-all text-sm font-medium text-white">{reviewSession.phoneNumberId || "Not returned by this signup variant"}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-amber-300/20 bg-black/20 p-4 text-sm text-amber-100">
                Complete Meta Login and Embedded Signup before running the server-side verification.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 2 · Server-side verification</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Verify the authorized business context</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  Proxy's backend uses its System User Access Token to retrieve the customer WABA shared after Embedded Signup and resolve the business that owns it.
                </p>
              </div>
              <button
                type="button"
                onClick={runReviewFlow}
                disabled={!reviewKey || !browserAuthorizationComplete || loading}
                className="min-h-12 shrink-0 rounded-xl bg-cyan-200 px-5 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Running Graph API verification..." : "Run server-side verification"}
              </button>
            </div>
          </section>

          {data ? (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 3 · Customer business context</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Authorized customer business and WABA</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  These values connect the customer authorization shown in Step 1 to the business assets retrieved by Proxy's backend.
                </p>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Customer Business Portfolio</p>
                    {data.customerBusiness ? (
                      <>
                        <p className="mt-2 text-lg font-semibold text-white">{data.customerBusiness.name}</p>
                        <p className="mt-1 text-sm text-slate-400">Business ID: {data.customerBusiness.id}</p>
                        <p className="mt-3 text-xs text-slate-500">Resolved from</p>
                        <code className="mt-1 block break-all text-xs text-cyan-200">{data.customerBusiness.source}</code>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-amber-200">Customer Business Portfolio could not be resolved from the authorized WABA yet.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Authorized client WABA</p>
                    {data.authorizedClientWaba.ok && data.authorizedClientWaba.data ? (
                      <>
                        <p className="mt-2 text-lg font-semibold text-white">{data.authorizedClientWaba.data.name || "Client WABA"}</p>
                        <p className="mt-1 text-sm text-slate-400">WABA ID: {data.authorizedClientWaba.data.id}</p>
                        {data.authorizedClientWaba.endpoint ? (
                          <code className="mt-3 block break-all text-xs text-cyan-200">{data.authorizedClientWaba.endpoint}</code>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-amber-200">{data.authorizedClientWaba.error || "No authorized client WABA was supplied by the Embedded Signup review session."}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 4 · business_management evidence</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Shared client WABAs retrieved by the Tech Provider</h2>
                <code className="mt-4 block break-all text-sm text-cyan-200">{data.sharedClientWabas.endpoint}</code>

                {data.sharedClientWabas.ok ? (
                  data.sharedClientWabas.data.length ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {data.sharedClientWabas.data.map((waba) => {
                        const isMatch = data.sharedWabaMatch.waba?.id === waba.id
                        return (
                          <div key={waba.id} className={`rounded-xl border p-4 ${isMatch ? "border-emerald-300/30 bg-emerald-300/[0.08]" : "border-white/10 bg-black/20"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">{waba.name || "Client WABA"}</p>
                                <p className="mt-1 text-sm text-slate-400">WABA ID: {waba.id}</p>
                              </div>
                              {isMatch ? <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">Matches Embedded Signup</span> : null}
                            </div>
                            {waba.owner_business_info?.id ? (
                              <p className="mt-3 text-xs text-slate-400">Owner Business: {waba.owner_business_info.name || "Customer Business"} · {waba.owner_business_info.id}</p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
                      The Graph API call completed, but no client WABA is currently shared with the Tech Provider. Do not submit the App Review screencast in this state; complete Embedded Signup with a client WABA first.
                    </div>
                  )
                ) : <p className="mt-4 text-sm text-amber-200">{data.sharedClientWabas.error}</p>}

                {data.sharedWabaMatch.requestedWabaId && !data.sharedWabaMatch.matched ? (
                  <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
                    The WABA authorized in Step 1 ({data.sharedWabaMatch.requestedWabaId}) was not found in the Tech Provider's shared client WABA list. The end-to-end review is not complete yet.
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Supporting server-to-server evidence</p>
                <div className="mt-2 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Proxy Technology · Tech Provider business</p>
                    <p className="mt-1 text-sm text-slate-400">Business ID: {data.techProviderBusiness.id}</p>
                    <code className="mt-3 block break-all text-xs text-cyan-200">{data.techProviderBusiness.endpoint}</code>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Tech Provider System Users</p>
                    <code className="mt-2 block break-all text-xs text-cyan-200">{data.systemUsers.endpoint}</code>
                    {data.systemUsers.ok ? (
                      <div className="mt-3 space-y-2">
                        {data.systemUsers.data.length ? data.systemUsers.data.map((user) => (
                          <div key={user.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <p className="font-medium text-white">{user.name || "System User"}</p>
                            <p className="mt-1 text-xs text-slate-400">ID: {user.id}{user.role ? ` · Role: ${user.role}` : ""}</p>
                          </div>
                        )) : <p className="text-sm text-slate-400">The request completed successfully; no System Users were returned.</p>}
                      </div>
                    ) : <p className="mt-3 text-sm text-amber-200">{data.systemUsers.error}</p>}
                  </div>
                </div>
              </section>

              <section className={`rounded-2xl border p-6 ${endToEndComplete ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${endToEndComplete ? "text-emerald-300" : "text-amber-300"}`}>End-to-end review status</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{endToEndComplete ? "Complete business_management use case demonstrated" : "Additional review evidence is still required"}</h2>
                <ul className="mt-5 space-y-3 text-sm leading-6">
                  <CheckItem complete={Boolean(reviewSession?.metaLoginCompleted)}>Meta Login authorization completed by the business administrator.</CheckItem>
                  <CheckItem complete={Boolean(reviewSession?.embeddedSignupCompleted)}>WhatsApp Embedded Signup completed and authorization evidence returned by Meta.</CheckItem>
                  <CheckItem complete={data.verification.customerBusinessResolved}>The customer Business Portfolio was resolved from the authorized WABA.</CheckItem>
                  <CheckItem complete={data.verification.sharedClientWabaRetrieved}>The same WABA authorized during Embedded Signup was retrieved from the Tech Provider's shared client WABA list.</CheckItem>
                  <CheckItem complete={data.verification.serverToServerBusinessManagementCompleted}>Server-to-server business_management Graph API operations completed.</CheckItem>
                  <CheckItem complete={!data.verification.tokenVisibleToBrowser}>The System User Access Token remained server-side and was not exposed to the browser.</CheckItem>
                </ul>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={restartReviewFlow}
                    className="min-h-11 rounded-xl border border-white/15 px-4 font-semibold text-white transition hover:bg-white/5"
                  >
                    Restart review flow
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  )
}
