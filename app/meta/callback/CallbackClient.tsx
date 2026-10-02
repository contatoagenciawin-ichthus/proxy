"use client"

import { useEffect, useMemo } from "react"

const OAUTH_CALLBACK_STORAGE_KEY = "proxy_meta_oauth_callback"

export default function CallbackClient() {
  const result = useMemo(() => {
    if (typeof window === "undefined") {
      return { code: "", state: "", error: "", errorDescription: "" }
    }

    const params = new URLSearchParams(window.location.search)
    return {
      code: params.get("code") || "",
      state: params.get("state") || "",
      error: params.get("error") || "",
      errorDescription: params.get("error_description") || "",
    }
  }, [])

  useEffect(() => {
    const payload = {
      type: "PROXY_META_OAUTH_CALLBACK",
      code: result.code || undefined,
      state: result.state || undefined,
      error: result.error || undefined,
      errorDescription: result.errorDescription || undefined,
      deliveredAt: Date.now(),
    }

    try {
      window.localStorage.setItem(
        OAUTH_CALLBACK_STORAGE_KEY,
        JSON.stringify(payload),
      )
    } catch {
      // The opener path below remains available as a fallback.
    }

    if (window.opener) {
      window.opener.postMessage(payload, window.location.origin)
    }
  }, [result])

  const success = Boolean(result.code) && !result.error

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Proxy Technology · Meta App Review
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          {success ? "Meta authorization returned" : "Meta authorization did not complete"}
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          {success
            ? "The authorization code was returned to Proxy and sent back to the review tab. You can close this tab and continue the review flow."
            : result.errorDescription || result.error || "No authorization code was returned by Meta."}
        </p>
        <button
          type="button"
          onClick={() => window.close()}
          className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
        >
          Close this window
        </button>
      </div>
    </main>
  )
}
