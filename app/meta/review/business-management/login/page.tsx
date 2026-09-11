"use client"

import { useEffect, useState } from "react"

const APP_ID = "1952034255371331"
const CONFIG_ID = "1741838130384076"
const REVIEW_SESSION_KEY = "proxy_meta_business_management_direct_review"
const REVIEW_ACCESS_KEY = "proxy_meta_business_management_review_key"
const OAUTH_STATE_KEY = "proxy_meta_business_management_direct_oauth_state"

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

type ExchangePayload = {
  ok: boolean
  error?: string
  tokenExchange?: {
    completed: boolean
    tokenType: string
    tokenVisibleToBrowser: boolean
  }
  integrationSystemUser?: {
    id: string
    name: string
    endpoint: string
  }
  clientBusiness?: {
    id: string
    name: string
    endpoint: string
  } | null
  grantedScopes?: string[]
  verification?: {
    tokenExchangeCompleted: boolean
    businessManagementGranted: boolean
    clientBusinessIdReturned: boolean
    clientBusinessResolved: boolean
    tokenValid: boolean
    tokenVisibleToBrowser: boolean
  }
}

export default function BusinessManagementLoginReviewPage() {
  const [status, setStatus] = useState("Ready to start Facebook Login for Business.")
  const [session, setSession] = useState<ReviewSession>({})
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    const stored = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (stored) {
      try {
        setSession(JSON.parse(stored) as ReviewSession)
      } catch {
        window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
      }
    }

    async function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return

      const payload = event.data as {
        type?: string
        code?: string
        state?: string
        error?: string
        errorDescription?: string
      }

      if (payload?.type !== "PROXY_META_OAUTH_CALLBACK") return

      const expectedState = window.sessionStorage.getItem(OAUTH_STATE_KEY)
      if (!expectedState || payload.state !== expectedState) {
        setStatus("Meta returned an OAuth response with an invalid state value.")
        return
      }

      window.sessionStorage.removeItem(OAUTH_STATE_KEY)

      if (payload.error || !payload.code) {
        setStatus(payload.errorDescription || payload.error || "Meta authorization did not complete.")
        return
      }

      const reviewKey = window.sessionStorage.getItem(REVIEW_ACCESS_KEY) || ""
      if (!reviewKey) {
        setStatus("The review access key is missing. Return to the review console and start again.")
        return
      }

      setExchanging(true)
      setStatus("Meta authorization returned. Exchanging the code and resolving the authorized client business server-side...")

      try {
        const redirectUri = `${window.location.origin}/meta/callback`
        const response = await fetch("/api/meta/review/business-management/exchange", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-review-key": reviewKey,
          },
          body: JSON.stringify({
            code: payload.code,
            redirectUri,
          }),
        })
        const exchange = (await response.json()) as ExchangePayload

        if (!response.ok || !exchange.ok || !exchange.verification) {
          throw new Error(exchange.error || `HTTP ${response.status}`)
        }

        const next: ReviewSession = {
          startedAt: session.startedAt,
          metaLoginCompleted: true,
          serverExchangeCompleted: exchange.verification.tokenExchangeCompleted,
          businessManagementGranted: exchange.verification.businessManagementGranted,
          clientBusinessResolved: exchange.verification.clientBusinessResolved,
          clientBusinessId: exchange.clientBusiness?.id,
          clientBusinessName: exchange.clientBusiness?.name,
          clientBusinessEndpoint: exchange.clientBusiness?.endpoint,
          integrationSystemUserId: exchange.integrationSystemUser?.id,
          integrationSystemUserName: exchange.integrationSystemUser?.name,
          integrationSystemUserEndpoint: exchange.integrationSystemUser?.endpoint,
          grantedScopes: exchange.grantedScopes || [],
          tokenType: exchange.tokenExchange?.tokenType,
          tokenValid: exchange.verification.tokenValid,
          completedAt: new Date().toISOString(),
        }

        window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next))
        setSession(next)

        if (
          next.serverExchangeCompleted &&
          next.businessManagementGranted &&
          next.clientBusinessResolved
        ) {
          setStatus(
            `Authorization linked successfully to ${next.clientBusinessName || "the client Business Portfolio"}.`,
          )
        } else {
          setStatus(
            "Meta authorization returned, but the client business context is incomplete. Do not record the final review video yet.",
          )
        }
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Authorization exchange failed."
        const next: ReviewSession = {
          startedAt: session.startedAt,
          metaLoginCompleted: true,
          serverExchangeCompleted: false,
          businessManagementGranted: false,
          clientBusinessResolved: false,
          exchangeError: message,
          completedAt: new Date().toISOString(),
        }
        window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next))
        setSession(next)
        setStatus(message)
      } finally {
        setExchanging(false)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [session.startedAt])

  function startAuthorization() {
    const fresh: ReviewSession = {
      startedAt: new Date().toISOString(),
      metaLoginCompleted: false,
      serverExchangeCompleted: false,
      businessManagementGranted: false,
      clientBusinessResolved: false,
    }
    window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(fresh))
    setSession(fresh)

    const state = crypto.randomUUID()
    window.sessionStorage.setItem(OAUTH_STATE_KEY, state)

    const redirectUri = `${window.location.origin}/meta/callback`
    const params = new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: redirectUri,
      config_id: CONFIG_ID,
      response_type: "code",
      override_default_response_type: "true",
      state,
      display: "popup",
    })

    const popup = window.open(
      `https://www.facebook.com/v26.0/dialog/oauth?${params.toString()}`,
      "proxy-business-management-review",
      "width=620,height=780,resizable=yes,scrollbars=yes",
    )

    if (!popup) {
      setStatus("The browser blocked the Meta popup. Allow popups for this site and try again.")
      return
    }

    popup.focus()
    setStatus("Opening Facebook Login for Business with the dedicated business_management review configuration...")
  }

  function restart() {
    window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
    window.sessionStorage.removeItem(OAUTH_STATE_KEY)
    setSession({})
    setStatus("Ready to start Facebook Login for Business.")
  }

  const completed = Boolean(
    session.metaLoginCompleted &&
      session.serverExchangeCompleted &&
      session.businessManagementGranted &&
      session.clientBusinessResolved,
  )

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Proxy Technology · Meta App Review
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            business_management authorization
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            This review flow isolates the <code className="text-cyan-200">business_management</code> permission from WhatsApp Embedded Signup. The business administrator completes Facebook Login for Business, explicitly delegates the required business asset, and Proxy securely resolves the authorized client Business Portfolio on its backend.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Dedicated review configuration</p>
            <p className="mt-2 text-cyan-100/85">
              Login variation: General · Token type: System User Access Token · Required asset: Facebook Page · Permission requested: business_management only. The authorization code is exchanged only on the server; the issued access token is never returned to the browser.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Authorize business_management in Meta</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            In the Meta dialog, continue with the business administrator account, select the Business Portfolio and required Page, review the requested access, and complete the authorization.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startAuthorization}
              disabled={exchanging}
              className="min-h-12 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exchanging ? "Resolving client business..." : "Start business_management authorization"}
            </button>
            <button
              type="button"
              onClick={restart}
              disabled={exchanging}
              className="min-h-12 rounded-xl border border-white/15 px-5 font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Restart authorization
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <strong className="text-white">Status:</strong> {status}
          </div>
        </section>

        {session.metaLoginCompleted ? (
          <section className={`rounded-2xl border p-6 md:p-7 ${completed ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${completed ? "text-emerald-300" : "text-amber-300"}`}>
              {completed ? "Authorization and client binding completed" : "Authorization returned · backend binding pending"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {completed ? "Meta authorization is linked to the client Business Portfolio" : "Additional backend evidence is required"}
            </h2>

            {completed ? (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Authorized client Business Portfolio</p>
                    <p className="mt-2 text-lg font-semibold text-white">{session.clientBusinessName || "Client Business"}</p>
                    <p className="mt-1 text-sm text-slate-400">Business ID: {session.clientBusinessId}</p>
                    {session.clientBusinessEndpoint ? <code className="mt-3 block break-all text-xs text-cyan-200">{session.clientBusinessEndpoint}</code> : null}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Business Integration System User</p>
                    <p className="mt-2 text-lg font-semibold text-white">{session.integrationSystemUserName || "Integration System User"}</p>
                    <p className="mt-1 text-sm text-slate-400">ID: {session.integrationSystemUserId}</p>
                    {session.integrationSystemUserEndpoint ? <code className="mt-3 block break-all text-xs text-cyan-200">{session.integrationSystemUserEndpoint}</code> : null}
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-emerald-50">
                  The issued token was validated server-side and includes <code className="text-emerald-200">business_management</code>. The token itself was not returned to the browser.
                </p>
                <a
                  href="/meta/review/business-management"
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-200 px-5 font-semibold text-slate-950 transition hover:bg-emerald-100"
                >
                  Continue to server-side verification
                </a>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-amber-300/20 bg-black/20 p-4 text-sm leading-6 text-amber-100">
                {session.exchangeError || "The Meta login succeeded, but Proxy has not yet resolved the client business context. Do not record the final App Review screencast in this state."}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
