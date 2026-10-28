"use client"

import { useEffect, useState } from "react"

const APP_ID = "1952034255371331"
const REVIEW_SESSION_KEY = "proxy_meta_ads_read_review"
const REVIEW_ACCESS_KEY = "proxy_meta_ads_read_review_key"
const OAUTH_STATE_KEY = "proxy_meta_ads_read_oauth_state"
const OAUTH_CALLBACK_STORAGE_KEY = "proxy_meta_oauth_callback"
const OAUTH_CALLBACK_SESSION_KEY = "proxy_meta_oauth_callback_session"
const OAUTH_RETURN_URL_KEY = "proxy_meta_oauth_return_url"

type Insights = {
  spend?: string
  impressions?: string
  reach?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  frequency?: string
}

type ReviewSession = {
  startedAt?: string
  completedAt?: string
  metaLoginCompleted?: boolean
  serverExchangeCompleted?: boolean
  adsReadGranted?: boolean
  tokenValid?: boolean
  adAccountsRetrieved?: boolean
  accountInsightsRetrieved?: boolean
  campaignInsightsRetrieved?: boolean
  grantedScopes?: string[]
  primaryAccountId?: string | null
  adAccounts?: Array<{
    id: string
    name?: string
    account_status?: number
    currency?: string
    timezone_name?: string
    insights?: Insights | null
    insightsError?: string | null
  }>
  campaignInsights?: Array<{
    campaign_id?: string
    campaign_name?: string
    spend?: string
    impressions?: string
    reach?: string
    clicks?: string
    ctr?: string
    cpc?: string
    cpm?: string
    frequency?: string
    actions?: Array<{ action_type?: string; value?: string }>
    cost_per_action_type?: Array<{ action_type?: string; value?: string }>
  }>
  campaignInsightsError?: string | null
  campaignInsightsByAccount?: Record<
    string,
    {
      data: Array<{
        campaign_id?: string
        campaign_name?: string
        spend?: string
        impressions?: string
        reach?: string
        clicks?: string
        ctr?: string
        cpc?: string
        cpm?: string
        frequency?: string
        actions?: Array<{ action_type?: string; value?: string }>
        cost_per_action_type?: Array<{ action_type?: string; value?: string }>
      }>
      error: string | null
    }
  >
  requestedAccountId?: string
  requestedAccountProbe?: {
    requested: string | null
    accessible: boolean
    error: string | null
  }
  exchangeError?: string
}

type ExchangePayload = {
  ok: boolean
  error?: string
  grantedScopes?: string[]
  primaryAccountId?: string | null
  adAccounts?: ReviewSession["adAccounts"]
  campaignInsights?: ReviewSession["campaignInsights"]
  campaignInsightsError?: string | null
  campaignInsightsByAccount?: ReviewSession["campaignInsightsByAccount"]
  requestedAccountProbe?: {
    requested: string | null
    accessible: boolean
    error: string | null
  }
  verification?: {
    adsReadGranted: boolean
    tokenValid: boolean
    adAccountsRetrieved: boolean
    accountInsightsRetrieved: boolean
    campaignInsightsRetrieved: boolean
    tokenVisibleToBrowser: boolean
    tokenPersistedByReviewFlow: boolean
  }
}

export default function AdsReadLoginReviewPage() {
  const [status, setStatus] = useState(
    "Ready to start Meta authorization for ads_read.",
  )
  const [session, setSession] = useState<ReviewSession>({})
  const [exchanging, setExchanging] = useState(false)
  const [targetAccountId, setTargetAccountId] = useState("")

  useEffect(() => {
    const target =
      new URLSearchParams(window.location.search).get("account_id") || ""
    setTargetAccountId(target)

    const stored = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ReviewSession
        if (target && parsed.requestedAccountId !== target) {
          window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
          setSession({})
          setStatus(
            `Target account ${target} detected. Previous review session cleared; start a fresh authorization.`,
          )
        } else {
          setSession(parsed)
        }
      } catch {
        window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
      }
    } else if (target) {
      setStatus(
        `Target account ${target} detected. Ready for a fresh Autorização Meta.`,
      )
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
        setStatus(
          payload.errorDescription ||
            payload.error ||
            "Meta authorization did not complete.",
        )
        return
      }

      const reviewKey =
        window.sessionStorage.getItem(REVIEW_ACCESS_KEY) || ""
      if (!reviewKey) {
        setStatus(
          "The review access key is missing. Return to the ads_read review page and start again.",
        )
        return
      }

      setExchanging(true)
      setStatus(
        "Meta authorization returned. Exchanging the code server-side and retrieving authorized advertising insights...",
      )

      try {
        const redirectUri = `${window.location.origin}/meta/callback`
        const requestedAccountId =
          new URLSearchParams(window.location.search).get("account_id") || ""
        const response = await fetch("/api/meta/review/ads-read/exchange", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-review-key": reviewKey,
          },
          body: JSON.stringify({
            code: payload.code,
            redirectUri,
            requestedAccountId,
          }),
        })

        const exchange = (await response.json()) as ExchangePayload

        if (!response.ok || !exchange.ok || !exchange.verification) {
          throw new Error(exchange.error || `HTTP ${response.status}`)
        }

        const next: ReviewSession = {
          startedAt: session.startedAt,
          metaLoginCompleted: true,
          serverExchangeCompleted: true,
          adsReadGranted: exchange.verification.adsReadGranted,
          tokenValid: exchange.verification.tokenValid,
          adAccountsRetrieved: exchange.verification.adAccountsRetrieved,
          accountInsightsRetrieved:
            exchange.verification.accountInsightsRetrieved,
          campaignInsightsRetrieved:
            exchange.verification.campaignInsightsRetrieved,
          grantedScopes: exchange.grantedScopes || [],
          primaryAccountId: exchange.primaryAccountId || null,
          adAccounts: exchange.adAccounts || [],
          campaignInsights: exchange.campaignInsights || [],
          campaignInsightsError: exchange.campaignInsightsError || null,
          campaignInsightsByAccount: exchange.campaignInsightsByAccount || {},
          requestedAccountId: requestedAccountId || undefined,
          requestedAccountProbe: exchange.requestedAccountProbe,
          completedAt: new Date().toISOString(),
        }

        window.sessionStorage.setItem(
          REVIEW_SESSION_KEY,
          JSON.stringify(next),
        )
        setSession(next)

        if (
          next.adsReadGranted &&
          next.tokenValid &&
          next.adAccountsRetrieved &&
          next.accountInsightsRetrieved
        ) {
          setStatus(
            exchange.requestedAccountProbe?.requested
              ? exchange.requestedAccountProbe.accessible
                ? `Autorização Meta succeeded. Requested account ${exchange.requestedAccountProbe.requested} was also resolved directly and added to the report.`
                : `Autorização Meta succeeded, but requested account ${exchange.requestedAccountProbe.requested} could not be resolved directly: ${exchange.requestedAccountProbe.error || "unknown error"}`
              : "Autorização Meta succeeded and read-only advertising insights were retrieved.",
          )
        } else {
          setStatus(
            "Meta authorization returned, but the full ads_read review evidence is incomplete. Do not record the final App Review screencast in this state.",
          )
        }
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Authorization exchange failed."

        const next: ReviewSession = {
          startedAt: session.startedAt,
          metaLoginCompleted: true,
          serverExchangeCompleted: false,
          adsReadGranted: false,
          tokenValid: false,
          adAccountsRetrieved: false,
          accountInsightsRetrieved: false,
          campaignInsightsRetrieved: false,
          requestedAccountId:
            new URLSearchParams(window.location.search).get("account_id") ||
            undefined,
          exchangeError: message,
          completedAt: new Date().toISOString(),
        }

        window.sessionStorage.setItem(
          REVIEW_SESSION_KEY,
          JSON.stringify(next),
        )
        setSession(next)
        setStatus(message)
      } finally {
        setExchanging(false)
      }
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key !== OAUTH_CALLBACK_STORAGE_KEY ||
        !event.newValue
      ) {
        return
      }

      try {
        const payload = JSON.parse(event.newValue)
        void handleMessage({
          origin: window.location.origin,
          data: payload,
        } as MessageEvent)
      } catch {
        setStatus("Meta callback was received, but the cross-tab payload was invalid.")
      }
    }

    const storedCallback =
      window.sessionStorage.getItem(OAUTH_CALLBACK_SESSION_KEY)
    if (storedCallback) {
      window.sessionStorage.removeItem(OAUTH_CALLBACK_SESSION_KEY)
      try {
        const payload = JSON.parse(storedCallback)
        void handleMessage({
          origin: window.location.origin,
          data: payload,
        } as MessageEvent)
      } catch {
        setStatus(
          "Meta callback returned to Proxy, but the stored callback payload was invalid.",
        )
      }
    }

    window.addEventListener("message", handleMessage)
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("message", handleMessage)
      window.removeEventListener("storage", handleStorage)
    }
  }, [session.startedAt])

  function startAuthorization() {
    const requestedAccountId =
      new URLSearchParams(window.location.search).get("account_id") || ""

    const fresh: ReviewSession = {
      startedAt: new Date().toISOString(),
      metaLoginCompleted: false,
      serverExchangeCompleted: false,
      adsReadGranted: false,
      tokenValid: false,
      adAccountsRetrieved: false,
      accountInsightsRetrieved: false,
      campaignInsightsRetrieved: false,
      requestedAccountId: requestedAccountId || undefined,
    }

    window.sessionStorage.setItem(
      REVIEW_SESSION_KEY,
      JSON.stringify(fresh),
    )
    setSession(fresh)

    const state = crypto.randomUUID()
    window.sessionStorage.setItem(OAUTH_STATE_KEY, state)

    const redirectUri = `${window.location.origin}/meta/callback`
    const params = new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "ads_read",
      auth_type: "rerequest",
      state,
      display: "popup",
    })

    const returnUrl = `${window.location.pathname}${window.location.search}`
    window.sessionStorage.setItem(OAUTH_RETURN_URL_KEY, returnUrl)
    window.sessionStorage.removeItem(OAUTH_CALLBACK_SESSION_KEY)

    setStatus(
      requestedAccountId
        ? `Opening Meta authorization for ads_read. After authorization Proxy will return here and directly probe ${requestedAccountId}.`
        : "Opening Meta authorization and returning to this page after approval...",
    )

    window.location.assign(
      `https://www.facebook.com/v26.0/dialog/oauth?${params.toString()}`,
    )
  }

  function restart() {
    window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
    window.sessionStorage.removeItem(OAUTH_STATE_KEY)
    setSession({})
    setStatus(
      targetAccountId
        ? `Target account ${targetAccountId} detected. Ready for a fresh Autorização Meta.`
        : "Ready to start Meta authorization for ads_read.",
    )
  }

  const completed = Boolean(
    session.metaLoginCompleted &&
      session.serverExchangeCompleted &&
      session.adsReadGranted &&
      session.tokenValid &&
      session.adAccountsRetrieved &&
      session.accountInsightsRetrieved,
  )

  return (
    <main className="pa-main pa-ads-review">
      <div>
        <header className="border border-white/10 bg-transparent p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            META ADS · MARKETING API
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Autorização Meta
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Este fluxo solicita somente{" "}
            <code className="text-cyan-200">ads_read</code>, exchanges the
            authorization code on the server, validates the granted scope, and
            retrieves read-only advertising performance data from accounts the
            authorized Meta user can access.
          </p>

          {targetAccountId ? (
            <div className="mt-6 border border-emerald-300/30 bg-emerald-300/[0.08] p-5 text-sm leading-6 text-emerald-50">
              <p className="font-semibold">Targeted ad account test</p>
              <p className="mt-2">
                This authorization will directly test{" "}
                <code className="text-emerald-200">{targetAccountId}</code>{" "}
                after Meta login, even if it is absent from /me/adaccounts.
              </p>
            </div>
          ) : null}

          <div className="mt-6 border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Comportamento somente leitura</p>
            <p className="mt-2 text-cyan-100/85">
              Proxy does not create, edit, pause, delete, or otherwise manage
              campaigns in this flow. The access token is used only on the
              backend during this review request, is never returned to
              JavaScript, and is not persisted by the review flow.
            </p>
          </div>
        </header>

        {!completed ? (
          <section className="border border-white/10 bg-transparent p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              AUTORIZAÇÃO
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Autorizar acesso aos dados de anúncios
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Continue com uma conta Meta que tenha acesso às contas de anúncios
              que serão consultadas e conclua a autorização.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startAuthorization}
                disabled={exchanging}
                className="min-h-12 bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exchanging
                  ? "Carregando dados de anúncios..."
                  : "Autorizar com a Meta"}
              </button>
              <button
                type="button"
                onClick={restart}
                disabled={exchanging}
                className="min-h-12 border border-white/15 px-5 font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reiniciar autorização
              </button>
            </div>

            <div className="mt-6 border border-white/10 bg-transparent p-4 text-sm text-slate-300">
              <strong className="text-white">Status:</strong> {status}
            </div>
          </section>
        ) : (
          <section className="pa-session-valid border border-emerald-300/20 bg-transparent p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  SESSÃO META ATIVA
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Autorização concluída
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  A sessão ads_read já foi validada e os dados das contas estão disponíveis abaixo.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#relatorios-individuais"
                  className="inline-flex min-h-11 items-center justify-center bg-emerald-200 px-4 font-semibold text-slate-950"
                >
                  Ir para os relatórios
                </a>
                <button
                  type="button"
                  onClick={restart}
                  className="min-h-11 border border-white/15 px-4 font-semibold text-white transition hover:bg-white/5"
                >
                  Trocar autorização
                </button>
              </div>
            </div>
          </section>
        )}

        {session.metaLoginCompleted ? (
          <section
            className={`border p-6 md:p-7 ${
              completed
                ? "border-emerald-300/20 bg-emerald-300/[0.06]"
                : "border-amber-300/20 bg-amber-300/[0.06]"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                completed ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {completed
                ? "Authorization and Insights retrieval completed"
                : "Authorization returned · evidence incomplete"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {completed
                ? "Meta ads_read is producing real read-only advertising data"
                : "Additional review evidence is required"}
            </h2>

            {completed ? (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="border border-white/10 bg-transparent p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Contas de anúncios acessíveis
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {session.adAccounts?.length || 0}
                    </p>
                    <p className="mt-2 text-xs text-emerald-200">
                      ads_read granted and validated server-side
                    </p>
                  </div>
                  <div className="border border-white/10 bg-transparent p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Período do relatório
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Últimos 30 dias
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Account summaries plus campaign-level insights for the
                      primary accessible account
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="pa-section-title">
                    <h2>Relatórios individuais</h2>
                    <span>{session.adAccounts?.length || 0} contas disponíveis</span>
                  </div>
                  <div className="pa-table-wrap">
                    <table>
                      <caption className="pa-sr">
                        Contas de anúncios autorizadas e seus relatórios
                      </caption>
                      <thead>
                        <tr>
                          <th>Conta de anúncios</th>
                          <th>ID</th>
                          <th>Dados</th>
                          <th><span className="pa-sr">Relatório</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.adAccounts?.map((account) => (
                          <tr key={account.id}>
                            <td>
                              <strong>{account.name || "Conta sem nome"}</strong>
                              <small>{account.currency || "Moeda não informada"}</small>
                            </td>
                            <td><span>{account.id}</span></td>
                            <td>
                              <span className={account.insights ? "pa-badge" : "pa-badge pa-badge-pending"}>
                                {account.insights ? "Insights disponíveis" : "Sem Insights"}
                              </span>
                            </td>
                            <td>
                              {account.insights ? (
                                <a
                                  className="pa-detail-link"
                                  href={`/meta/review/ads-read/client-report?account_id=${encodeURIComponent(account.id)}`}
                                >
                                  Ver relatório <span aria-hidden="true">↗</span>
                                </a>
                              ) : (
                                <span className="pa-muted">Indisponível</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <a
                  href="/meta/review/ads-read"
                  className="mt-6 inline-flex min-h-12 items-center justify-center bg-emerald-200 px-5 font-semibold text-slate-950 transition hover:bg-emerald-100"
                >
                  Ver análise geral da sessão
                </a>
              </>
            ) : (
              <div className="mt-5 border border-amber-300/20 bg-transparent p-4 text-sm leading-6 text-amber-100">
                {session.exchangeError ||
                  "The Meta login succeeded, but Proxy has not yet produced the required read-only advertising evidence. Do not record the final App Review screencast in this state."}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
