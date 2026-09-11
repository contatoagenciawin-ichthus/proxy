"use client"

import { useEffect, useState } from "react"

const REVIEW_SESSION_KEY = "proxy_meta_business_management_direct_review"
const REVIEW_ACCESS_KEY = "proxy_meta_business_management_review_key"

type ReviewSession = {
  startedAt?: string
  completedAt?: string
  metaLoginCompleted?: boolean
  serverExchangeCompleted?: boolean
  businessManagementGranted?: boolean
  clientBusinessResolved?: boolean
  clientBusinessId?: string
  clientBusinessName?: string
  clientBusinessEndpoint?: string
  integrationSystemUserId?: string
  integrationSystemUserName?: string
  integrationSystemUserEndpoint?: string
  grantedScopes?: string[]
  tokenType?: string
  tokenValid?: boolean
  exchangeError?: string
}

type ReviewPayload = {
  ok: true
  permission: string
  authentication: {
    customerAuthorization: string
    providerBackendCredential: string
    tokenVisibleToBrowser: boolean
  }
  providerTokenIdentity: {
    ok: boolean
    data: { id: string; name?: string } | null
    error?: string
  }
  techProviderBusiness: {
    endpoint: string
    ok: boolean
    data: { id: string; name?: string } | null
    error?: string
  }
  systemUsers: {
    endpoint: string
    ok: boolean
    data: Array<{ id: string; name?: string; role?: string }>
    error?: string
  }
  verification: {
    providerBusinessResolved: boolean
    providerBusinessManagementReadCompleted: boolean
    systemUserReadCompleted: boolean
    tokenVisibleToBrowser: boolean
  }
}

function CheckItem({ complete, children }: { complete: boolean; children: React.ReactNode }) {
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

  function startAuthorization() {
    if (reviewKey) window.sessionStorage.setItem(REVIEW_ACCESS_KEY, reviewKey)
    window.location.assign("/meta/review/business-management/login")
  }

  function restartReview() {
    window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
    setReviewSession(null)
    setData(null)
    setError("")
    window.location.assign("/meta/review/business-management/login")
  }

  async function runServerVerification() {
    setLoading(true)
    setError("")
    setData(null)

    try {
      const response = await fetch("/api/meta/review/business-management/direct", {
        headers: { "x-review-key": reviewKey },
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

  const metaAuthorizationReturned = Boolean(reviewSession?.metaLoginCompleted)
  const clientAuthorizationComplete = Boolean(
    reviewSession?.metaLoginCompleted &&
      reviewSession?.serverExchangeCompleted &&
      reviewSession?.businessManagementGranted &&
      reviewSession?.clientBusinessResolved &&
      reviewSession?.tokenValid,
  )

  const endToEndComplete = Boolean(
    clientAuthorizationComplete &&
      data?.verification.providerBusinessResolved &&
      data?.verification.providerBusinessManagementReadCompleted &&
      data?.verification.systemUserReadCompleted,
  )

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Proxy Technology · Meta App Review
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            business_management end-to-end review
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            This walkthrough links the business administrator's Facebook Login for Business authorization directly to the client Business Portfolio returned by Meta, then shows the Tech Provider's separate server-to-server Business Manager operations.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Review configuration</p>
            <p className="mt-2 text-cyan-100/85">
              General Facebook Login for Business · Business Integration System User Access Token · Required asset: Facebook Page · Permission: business_management only. Authorization codes are exchanged on the backend, and access tokens are never displayed in the browser.
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
              onClick={startAuthorization}
              disabled={!reviewKey}
              className="min-h-12 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {metaAuthorizationReturned ? "Run Meta authorization again" : "Start business_management authorization"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}
        </header>

        <section className={`rounded-2xl border p-6 ${clientAuthorizationComplete ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${clientAuthorizationComplete ? "text-emerald-300" : "text-amber-300"}`}>Step 1 · Customer authorization and binding</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Facebook Login for Business → authorized client Business</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                The business administrator selects the Business Portfolio and required Page. Proxy then exchanges Meta's authorization code on the server, validates the issued token, confirms the business_management scope, and resolves the returned client_business_id.
              </p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${clientAuthorizationComplete ? "bg-emerald-300/15 text-emerald-200" : "bg-amber-300/15 text-amber-200"}`}>
              {clientAuthorizationComplete ? "Completed" : "Required"}
            </span>
          </div>

          {clientAuthorizationComplete ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Authorized client Business Portfolio</p>
                <p className="mt-2 text-lg font-semibold text-white">{reviewSession?.clientBusinessName || "Client Business"}</p>
                <p className="mt-1 text-sm text-slate-400">Business ID: {reviewSession?.clientBusinessId}</p>
                {reviewSession?.clientBusinessEndpoint ? <code className="mt-3 block break-all text-xs text-cyan-200">{reviewSession.clientBusinessEndpoint}</code> : null}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Business Integration System User</p>
                <p className="mt-2 text-lg font-semibold text-white">{reviewSession?.integrationSystemUserName || "Integration System User"}</p>
                <p className="mt-1 text-sm text-slate-400">ID: {reviewSession?.integrationSystemUserId}</p>
                {reviewSession?.integrationSystemUserEndpoint ? <code className="mt-3 block break-all text-xs text-cyan-200">{reviewSession.integrationSystemUserEndpoint}</code> : null}
                <p className="mt-3 text-xs text-emerald-200">Granted scope: business_management</p>
              </div>
            </div>
          ) : metaAuthorizationReturned ? (
            <div className="mt-5 rounded-xl border border-amber-300/20 bg-black/20 p-4 text-sm leading-6 text-amber-100">
              {reviewSession?.exchangeError || "Meta authorization returned, but the client Business Portfolio has not been resolved server-side. Do not record the final review video in this state."}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 2 · Tech Provider server-side verification</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Demonstrate provider-side business_management usage</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                After the client authorization is linked successfully, Proxy separately verifies its Tech Provider Business and System Users with the provider's backend System User Access Token.
              </p>
            </div>
            <button
              type="button"
              onClick={runServerVerification}
              disabled={!reviewKey || !clientAuthorizationComplete || loading}
              className="min-h-12 shrink-0 rounded-xl bg-cyan-200 px-5 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Running Graph API verification..." : "Run server-side verification"}
            </button>
          </div>
        </section>

        {data ? (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 3 · Tech Provider evidence</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Proxy Technology server-side business context</h2>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tech Provider Business</p>
                  {data.techProviderBusiness.ok && data.techProviderBusiness.data ? (
                    <>
                      <p className="mt-2 text-lg font-semibold text-white">{data.techProviderBusiness.data.name || "Proxy Technology"}</p>
                      <p className="mt-1 text-sm text-slate-400">Business ID: {data.techProviderBusiness.data.id}</p>
                      <code className="mt-3 block break-all text-xs text-cyan-200">{data.techProviderBusiness.endpoint}</code>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-amber-200">{data.techProviderBusiness.error || "Tech Provider business could not be resolved."}</p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tech Provider System Users</p>
                  <code className="mt-2 block break-all text-xs text-cyan-200">{data.systemUsers.endpoint}</code>
                  {data.systemUsers.ok ? (
                    <div className="mt-3 space-y-2">
                      {data.systemUsers.data.length ? data.systemUsers.data.map((user) => (
                        <div key={user.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="font-medium text-white">{user.name || "System User"}</p>
                          <p className="mt-1 text-xs text-slate-400">ID: {user.id}{user.role ? ` · Role: ${user.role}` : ""}</p>
                        </div>
                      )) : <p className="text-sm text-amber-200">No Tech Provider System Users were returned.</p>}
                    </div>
                  ) : <p className="mt-3 text-sm text-amber-200">{data.systemUsers.error}</p>}
                </div>
              </div>
            </section>

            <section className={`rounded-2xl border p-6 ${endToEndComplete ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${endToEndComplete ? "text-emerald-300" : "text-amber-300"}`}>End-to-end review status</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {endToEndComplete ? "Complete business_management use case demonstrated" : "Additional review evidence is still required"}
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                <CheckItem complete={Boolean(reviewSession?.metaLoginCompleted)}>The business administrator completed Facebook Login for Business.</CheckItem>
                <CheckItem complete={Boolean(reviewSession?.serverExchangeCompleted)}>Meta's authorization code was exchanged server-side for a Business Integration System User token.</CheckItem>
                <CheckItem complete={Boolean(reviewSession?.businessManagementGranted)}>The issued token was validated with the business_management scope.</CheckItem>
                <CheckItem complete={Boolean(reviewSession?.clientBusinessResolved)}>The client_business_id was resolved to {reviewSession?.clientBusinessName || "the authorized client Business Portfolio"}.</CheckItem>
                <CheckItem complete={data.verification.providerBusinessResolved}>Proxy Technology was resolved separately as the Tech Provider Business.</CheckItem>
                <CheckItem complete={data.verification.providerBusinessManagementReadCompleted && data.verification.systemUserReadCompleted}>Provider-side Business Manager reads completed server-to-server.</CheckItem>
                <CheckItem complete={!data.verification.tokenVisibleToBrowser}>Neither the client integration token nor the Tech Provider token was exposed in the browser.</CheckItem>
              </ul>

              <button
                type="button"
                onClick={restartReview}
                className="mt-6 min-h-11 rounded-xl border border-white/15 px-4 font-semibold text-white transition hover:bg-white/5"
              >
                Restart review flow
              </button>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}
