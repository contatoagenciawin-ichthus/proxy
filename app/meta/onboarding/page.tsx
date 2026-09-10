"use client"

import { useEffect, useState } from "react"

const appId = "1952034255371331"
const configId = "1474502514488126"
const REVIEW_SESSION_KEY = "proxy_meta_business_management_review"

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void
      login: (
        callback: (response: MetaLoginResponse) => void,
        options: Record<string, unknown>,
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

type MetaLoginResponse = {
  authResponse?: {
    code?: string
  }
  status?: string
}

type EmbeddedSignupEvent = {
  type?: string
  event?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

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

function normalizeMetaId(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
    if (typeof value === "string" && /^\d+$/.test(value)) return value
  }
  return ""
}

function isFacebookOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname
    return hostname === "facebook.com" || hostname.endsWith(".facebook.com")
  } catch {
    return false
  }
}

export default function MetaOnboardingPage() {
  const [sdkReady, setSdkReady] = useState(false)
  const [status, setStatus] = useState("Loading Meta Embedded Signup...")
  const [reviewSession, setReviewSession] = useState<ReviewSession>({})

  function saveReviewSession(patch: Partial<ReviewSession>) {
    setReviewSession((current) => {
      const next = { ...current, ...patch }
      window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (stored) {
      try {
        setReviewSession(JSON.parse(stored) as ReviewSession)
      } catch {
        window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
      }
    }

    const handleEmbeddedSignupMessage = (event: MessageEvent) => {
      if (!isFacebookOrigin(event.origin)) return

      try {
        const payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data
        const message = payload as EmbeddedSignupEvent

        if (message?.type !== "WA_EMBEDDED_SIGNUP") return

        const eventData = message.data || {}

        if (message.event === "FINISH" || message.event === "FINISH_ONLY_WABA") {
          const wabaId = normalizeMetaId(
            eventData.waba_id,
            eventData.wabaId,
            message.waba_id,
          )
          const phoneNumberId = normalizeMetaId(
            eventData.phone_number_id,
            eventData.phoneNumberId,
            message.phone_number_id,
          )
          const businessId = normalizeMetaId(
            eventData.business_id,
            eventData.businessId,
            message.business_id,
          )

          saveReviewSession({
            embeddedSignupCompleted: true,
            embeddedSignupEvent: message.event,
            completedAt: new Date().toISOString(),
            ...(wabaId ? { wabaId } : {}),
            ...(phoneNumberId ? { phoneNumberId } : {}),
            ...(businessId ? { businessId } : {}),
          })
          setStatus(
            "Meta Embedded Signup completed. The authorized business assets are ready for server-side verification.",
          )
          return
        }

        if (message.event === "CANCEL") {
          setStatus("Meta Embedded Signup was cancelled before completion.")
          return
        }

        if (message.event === "ERROR") {
          setStatus("Meta returned an error during Embedded Signup.")
          return
        }

        setStatus("Meta Embedded Signup is in progress.")
      } catch {
        // The Meta SDK also emits internal messages unrelated to Embedded Signup.
      }
    }

    window.addEventListener("message", handleEmbeddedSignupMessage)

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v26.0",
      })
      setSdkReady(true)
      setStatus("Ready to start Meta Embedded Signup.")
    }

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script")
      script.id = "facebook-jssdk"
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"
      script.src = "https://connect.facebook.net/en_US/sdk.js"
      document.body.appendChild(script)
    }

    return () => {
      window.removeEventListener("message", handleEmbeddedSignupMessage)
    }
  }, [])

  function startSignup() {
    if (!window.FB) {
      setStatus("The Meta SDK has not finished loading yet.")
      return
    }

    const freshSession: ReviewSession = {
      startedAt: new Date().toISOString(),
      metaLoginCompleted: false,
      embeddedSignupCompleted: false,
    }
    window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(freshSession))
    setReviewSession(freshSession)
    setStatus("Opening Meta Login and Embedded Signup...")

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          saveReviewSession({ metaLoginCompleted: true })
          setStatus(
            "Meta Login authorization received. Complete the remaining Embedded Signup steps in the Meta window.",
          )
          return
        }

        if (response.status === "connected") {
          saveReviewSession({ metaLoginCompleted: true })
          setStatus(
            "Meta Login completed. Waiting for the Embedded Signup authorization result.",
          )
          return
        }

        setStatus("Meta authorization was not completed.")
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: "3",
          version: "v4",
          featureType: "whatsapp_business_app_onboarding",
          features: null,
        },
      },
    )
  }

  function restartReview() {
    window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
    setReviewSession({})
    setStatus("Ready to start Meta Embedded Signup.")
  }

  const completed = Boolean(reviewSession.embeddedSignupCompleted)

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Proxy Technology · Meta App Review
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            WhatsApp Business onboarding
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            This page demonstrates the customer authorization portion of Proxy Whapp Platform's
            <code className="mx-1 text-cyan-200">business_management</code> use case. An authorized business administrator completes Meta Login and Meta's official WhatsApp Embedded Signup flow.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">What the reviewer should observe</p>
            <p className="mt-2 text-cyan-100/85">
              Meta Login is shown in full. The business administrator selects and explicitly authorizes the Business Portfolio and WhatsApp Business assets in Meta's Embedded Signup. After authorization, Proxy verifies the shared business assets server-to-server using a System User Access Token stored only in the backend.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Customer authorization in Meta</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Start the official Meta flow and complete every screen through the final authorization confirmation. Proxy does not recreate or simulate Meta authorization screens.
              </p>
            </div>
            <button
              type="button"
              onClick={startSignup}
              disabled={!sdkReady}
              className="min-h-12 shrink-0 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start Meta Embedded Signup
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <strong className="text-white">Status:</strong> {status}
          </div>
        </section>

        {completed ? (
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Authorization completed</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Meta authorization completed successfully</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50">
              Proxy received the Embedded Signup completion event. The identifiers below are authorization evidence returned by Meta and are used only to verify the business assets shared with Proxy.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Business Portfolio</p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {reviewSession.businessId || "Resolved server-side from the authorized WABA"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">WhatsApp Business Account</p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {reviewSession.wabaId || "Returned by Meta after WABA-only onboarding"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Phone Number ID</p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {reviewSession.phoneNumberId || "Not returned in this Embedded Signup variant"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="/meta/review/business-management"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-200 px-5 font-semibold text-slate-950 transition hover:bg-emerald-100"
              >
                Continue to server-side verification
              </a>
              <button
                type="button"
                onClick={restartReview}
                className="min-h-12 rounded-xl border border-white/15 px-5 font-semibold text-white transition hover:bg-white/5"
              >
                Restart review flow
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
          <p className="font-semibold text-slate-200">Security note</p>
          <p className="mt-2">
            The authorization code and access tokens are never displayed or stored in browser review data. Only non-secret business asset identifiers returned by the Embedded Signup completion event are retained in this browser session for the review walkthrough.
          </p>
        </section>
      </div>
    </main>
  )
}
