"use client"

import { useState } from "react"

type ReviewPayload = {
  ok: true
  permission: string
  authentication: {
    model: string
    credential: string
    userLoginRequired: boolean
    tokenVisibleToBrowser: boolean
  }
  business: {
    id: string
    name: string
    endpoint: string
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
    data: Array<{ id: string; name?: string; currency?: string; timezone_id?: string }>
    error?: string
  }
  productionFlow: string[]
}

export default function BusinessManagementReviewPage() {
  const [reviewKey, setReviewKey] = useState("")
  const [data, setData] = useState<ReviewPayload | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function runReviewFlow() {
    setLoading(true)
    setError("")
    setData(null)

    try {
      const response = await fetch("/api/meta/review/business-management", {
        headers: { "x-review-key": reviewKey },
        cache: "no-store",
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`)
      setData(payload as ReviewPayload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review flow failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Proxy Technology</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            business_management App Review
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            End-to-end server-to-server demonstration of how Proxy Technology uses the
            <code className="mx-1 text-cyan-200">business_management</code> permission for WhatsApp Embedded Signup operations.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Important authentication note for the reviewer</p>
            <p className="mt-2 text-cyan-100/85">
              This permission is used server-to-server with a System User Access Token stored only in Proxy's backend.
              There is no end-user Meta Login screen for these backend calls, and no access token is exposed in the browser.
            </p>
          </div>

          <div className="mt-7 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="text-sm font-medium text-slate-300">Review access key</span>
              <input
                type="password"
                value={reviewKey}
                onChange={(event) => setReviewKey(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                placeholder="Enter review key"
              />
            </label>
            <button
              type="button"
              onClick={runReviewFlow}
              disabled={!reviewKey || loading}
              className="min-h-12 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Running Graph API flow..." : "Run business_management review flow"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}
        </header>

        {data ? (
          <div className="mt-7 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Authorized Tech Provider business context</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                The backend identifies the authorized business context using <code className="text-cyan-200">business_management</code>.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-lg font-semibold text-white">{data.business.name}</p>
                <p className="mt-1 text-sm text-slate-400">Business ID: {data.business.id}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">Graph API endpoint</p>
                <code className="mt-1 block break-all text-sm text-cyan-200">{data.business.endpoint}</code>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 2</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Tech Provider System Users</h2>
              <code className="mt-4 block break-all text-sm text-cyan-200">{data.systemUsers.endpoint}</code>
              {data.systemUsers.ok ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {data.systemUsers.data.length ? data.systemUsers.data.map((user) => (
                    <div key={user.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="font-semibold text-white">{user.name || "System User"}</p>
                      <p className="mt-1 text-sm text-slate-400">ID: {user.id}</p>
                      {user.role ? <p className="mt-1 text-sm text-slate-400">Role: {user.role}</p> : null}
                    </div>
                  )) : <p className="text-sm text-slate-400">Graph API request completed successfully. No System Users were returned.</p>}
                </div>
              ) : <p className="mt-4 text-sm text-amber-200">{data.systemUsers.error}</p>}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 3</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Client WABAs shared after Embedded Signup</h2>
              <code className="mt-4 block break-all text-sm text-cyan-200">{data.sharedClientWabas.endpoint}</code>
              {data.sharedClientWabas.ok ? (
                data.sharedClientWabas.data.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {data.sharedClientWabas.data.map((waba) => (
                      <div key={waba.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="font-semibold text-white">{waba.name || "Client WABA"}</p>
                        <p className="mt-1 text-sm text-slate-400">WABA ID: {waba.id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4 text-sm text-emerald-100">
                    Graph API request completed successfully. No external client WABA is shared in this review environment yet.
                  </div>
                )
              ) : <p className="mt-4 text-sm text-amber-200">{data.sharedClientWabas.error}</p>}
            </section>

            <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Complete production use case</p>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-emerald-50">
                {data.productionFlow.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="font-semibold text-emerald-300">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  )
}
