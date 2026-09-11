"use client"

import { useEffect, useState } from "react"

const APP_ID = "1952034255371331"
const CONFIG_ID = "1741838130384076"
const REVIEW_SESSION_KEY = "proxy_meta_business_management_direct_review"
const OAUTH_STATE_KEY = "proxy_meta_business_management_direct_oauth_state"

type ReviewSession = {
  startedAt?: string
  completedAt?: string
  metaLoginCompleted?: boolean
}

export default function BusinessManagementLoginReviewPage() {
  const [status, setStatus] = useState("Ready to start Facebook Login for Business.")
  const [session, setSession] = useState<ReviewSession>({})

  useEffect(() => {
    const stored = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (stored) {
      try {
        setSession(JSON.parse(stored) as ReviewSession)
      } catch {
        window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
      }
    }

    function handleMessage(event: MessageEvent) {
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

      const next: ReviewSession = {
        ...session,
        metaLoginCompleted: true,
        completedAt: new Date().toISOString(),
      }
      window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next))
      setSession(next)
      setStatus("business_management authorization returned successfully from Meta.")
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [session])

  function startAuthorization() {
    const fresh: ReviewSession = {
      startedAt: new Date().toISOString(),
      metaLoginCompleted: false,
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

  const completed = Boolean(session.metaLoginCompleted)

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
            This review flow isolates the <code className="text-cyan-200">business_management</code> permission from WhatsApp Embedded Signup. The business administrator completes Facebook Login for Business and explicitly delegates access to a required business asset.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Dedicated review configuration</p>
            <p className="mt-2 text-cyan-100/85">
              Login variation: General · Token type: System User Access Token · Required asset: Facebook Page · Permission requested: business_management only.
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
              className="min-h-12 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Start business_management authorization
            </button>
            <button
              type="button"
              onClick={restart}
              className="min-h-12 rounded-xl border border-white/15 px-5 font-semibold text-white transition hover:bg-white/5"
            >
              Restart authorization
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <strong className="text-white">Status:</strong> {status}
          </div>
        </section>

        {completed ? (
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Authorization completed</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Meta returned the authorization successfully</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50">
              The reviewer has now seen the complete Meta authorization step for business_management. Continue to the server-side verification to demonstrate how Proxy uses the permission in its backend.
            </p>
            <a
              href="/meta/review/business-management"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-200 px-5 font-semibold text-slate-950 transition hover:bg-emerald-100"
            >
              Continue to server-side verification
            </a>
          </section>
        ) : null}
      </div>
    </main>
  )
}
