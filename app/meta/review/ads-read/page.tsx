"use client"

import { useEffect, useMemo, useState } from "react"

const REVIEW_SESSION_KEY = "proxy_meta_ads_read_review"
const REVIEW_ACCESS_KEY = "proxy_meta_ads_read_review_key"

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

type CampanhaInsights = Insights & {
  campaign_id?: string
  campaign_name?: string
  actions?: Array<{ action_type?: string; value?: string }>
  cost_per_action_type?: Array<{ action_type?: string; value?: string }>
}

type ReviewSession = {
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
  campaignInsights?: CampanhaInsights[]
  campaignInsightsError?: string | null
  campaignInsightsByAccount?: Record<string, { data: CampanhaInsights[]; error: string | null }>
  exchangeError?: string
}

function number(value?: string) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value?: string, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(number(value))
}

function integer(value?: string) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(number(value))
}

function decimal(value?: string, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(number(value))
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
      <span className={complete ? "text-emerald-50" : "text-amber-100"}>
        {children}
      </span>
    </li>
  )
}

export default function AdsReadReviewPage() {
  const [reviewKey, setReviewKey] = useState("")
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [keyStatus, setKeyStatus] = useState("")
  const [checkingKey, setCheckingKey] = useState(false)
  const [targetAccountId, setTargetAccountId] = useState("")

  useEffect(() => {
    const target =
      new URLSearchParams(window.location.search).get("account_id") || ""
    setTargetAccountId(target)

    const storedKey = window.sessionStorage.getItem(REVIEW_ACCESS_KEY)
    if (storedKey) setReviewKey(storedKey)

    const storedSession = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession) as ReviewSession
        setSession(parsed)
        setSelectedAccountId(
          parsed.primaryAccountId || parsed.adAccounts?.[0]?.id || "",
        )
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

  async function startAuthorization() {
    if (!reviewKey) return

    setCheckingKey(true)
    setKeyStatus("Validating review access key against this deployment...")

    try {
      const response = await fetch("/api/meta/review/key-check", {
        method: "POST",
        cache: "no-store",
        headers: { "x-review-key": reviewKey },
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        setKeyStatus(
          `Review key rejected by ${payload.environment || "current"} deployment. Configured fingerprint: ${payload.configuredFingerprint || "unknown"} · provided fingerprint: ${payload.providedFingerprint || "unknown"}.`,
        )
        return
      }

      window.sessionStorage.setItem(REVIEW_ACCESS_KEY, reviewKey)
      setKeyStatus(
        `Review key validated in ${payload.environment || "current"} deployment. Opening Meta authorization...`,
      )
      const suffix = targetAccountId
        ? `?account_id=${encodeURIComponent(targetAccountId)}`
        : ""
      window.location.assign(`/meta/review/ads-read/login${suffix}`)
    } catch (cause) {
      setKeyStatus(
        cause instanceof Error
          ? cause.message
          : "Review key validation failed before Meta authorization.",
      )
    } finally {
      setCheckingKey(false)
    }
  }

  function restartReview() {
    window.sessionStorage.removeItem(REVIEW_SESSION_KEY)
    setSession(null)
    setSelectedAccountId("")
    const suffix = targetAccountId
      ? `?account_id=${encodeURIComponent(targetAccountId)}`
      : ""
    window.location.assign(`/meta/review/ads-read/login${suffix}`)
  }

  const selectedAccount =
    session?.adAccounts?.find((account) => account.id === selectedAccountId) ||
    session?.adAccounts?.find(
      (account) => account.id === session?.primaryAccountId,
    ) ||
    session?.adAccounts?.[0] ||
    null

  const selectedCampanhaInsights = selectedAccount
    ? session?.campaignInsightsByAccount?.[selectedAccount.id]?.data ||
      (selectedAccount.id === session?.primaryAccountId ? session?.campaignInsights || [] : [])
    : []

  const selectedCampanhaInsightsError = selectedAccount
    ? session?.campaignInsightsByAccount?.[selectedAccount.id]?.error ||
      (selectedAccount.id === session?.primaryAccountId ? session?.campaignInsightsError || null : null)
    : null

  const report = useMemo(() => {
    if (!selectedAccount?.insights) return null

    const insights = selectedAccount.insights
    const spend = number(insights.spend)
    const clicks = number(insights.clicks)
    const ctr = number(insights.ctr)
    const frequency = number(insights.frequency)
    const cpc = number(insights.cpc)

    const observations: string[] = []

    observations.push(
      `The account spent ${money(insights.spend, selectedAccount.currency || "BRL")} during the last 30 days and generated ${integer(insights.clicks)} clicks from ${integer(insights.impressions)} impressions.`,
    )

    if (ctr > 0) {
      observations.push(
        `The reported click-through rate is ${decimal(insights.ctr)}%, with an average CPC of ${money(insights.cpc, selectedAccount.currency || "BRL")}.`,
      )
    }

    if (frequency >= 3) {
      observations.push(
        `Frequência is ${decimal(insights.frequency)}, which is surfaced as a monitoring point for possible audience or creative saturation.`,
      )
    } else if (frequency > 0) {
      observations.push(
        `Frequência is ${decimal(insights.frequency)}, indicating the average number of impressions per reached person in the period.`,
      )
    }

    if (spend > 0 && clicks === 0) {
      observations.push(
        "The account recorded spend without clicks in the selected period, which is highlighted for review.",
      )
    } else if (cpc > 0) {
      observations.push(
        "Proxy converts the raw Marketing API response into a concise read-only performance report; no campaign mutations are performed.",
      )
    }

    return observations
  }, [selectedAccount])

  const complete = Boolean(
    session?.metaLoginCompleted &&
      session?.serverExchangeCompleted &&
      session?.adsReadGranted &&
      session?.tokenValid &&
      session?.adAccountsRetrieved &&
      session?.accountInsightsRetrieved,
  )

  return (
    <main className="pa-main pa-ads-review">
      <div>
        <header className="pa-heading pa-ads-heading">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            META ADS · MARKETING API
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Autorização e dados de tráfego
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            A Proxy utiliza a permissão{" "}
            <code className="text-cyan-200">ads_read</code>: an authorized
            business user grants read access, Proxy retrieves advertising
            insights through the Meta Marketing API, and the application turns
            those metrics into a reporting view and concise performance
            analysis.
          </p>

          {targetAccountId ? (
            <div className="mt-6 border border-emerald-300/30 bg-emerald-300/[0.08] p-5 text-sm leading-6 text-emerald-50">
              <p className="font-semibold">Targeted ad account test</p>
              <p className="mt-2">
                After the review key is validated, this flow will authorize
                Meta and directly probe{" "}
                <code className="text-emerald-200">{targetAccountId}</code>.
              </p>
            </div>
          ) : null}

          <div className="mt-6 border border-cyan-300/20 bg-cyan-300/[0.07] p-5 text-sm leading-6 text-cyan-50">
            <p className="font-semibold">Escopo da integração</p>
            <p className="mt-2 text-cyan-100/85">
              Read only. This flow does not request ads_management and does not
              create, edit, pause, delete, or otherwise modify advertising
              campaigns. Access tokens are exchanged on the server and are not
              returned to browser JavaScript.
            </p>
          </div>

          <div className="mt-7 grid gap-4 border border-white/10 bg-transparent p-5 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="text-sm font-medium text-slate-300">
                Chave de acesso da integração
              </span>
              <input
                type="password"
                value={reviewKey}
                onChange={(event) => storeReviewKey(event.target.value)}
                className="mt-2 w-full border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                placeholder="Informe a chave de acesso"
              />
            </label>
            <button
              type="button"
              onClick={startAuthorization}
              disabled={!reviewKey || checkingKey}
              className="min-h-12 bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkingKey
                ? "Validando acesso..."
                : session?.metaLoginCompleted
                  ? "Autorizar novamente com a Meta"
                  : "Autorizar com a Meta"}
            </button>
          </div>

          {keyStatus ? (
            <div className="mt-4 border border-white/10 bg-transparent px-4 py-3 text-sm text-slate-300">
              <strong className="text-white">Status:</strong> {keyStatus}
            </div>
          ) : null}
        </header>

        <section
          className={`border p-6 ${
            complete
              ? "border-emerald-300/20 bg-emerald-300/[0.06]"
              : "border-amber-300/20 bg-amber-300/[0.06]"
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-[0.18em] ${
              complete ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            INTEGRAÇÃO
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Verificação da autorização e dos dados
          </h2>

          <ul className="mt-5 space-y-3 text-sm leading-6">
            <CheckItem complete={Boolean(session?.metaLoginCompleted)}>
              Autorização Meta concluída.
            </CheckItem>
            <CheckItem complete={Boolean(session?.serverExchangeCompleted)}>
              Código de autorização processado no servidor.
            </CheckItem>
            <CheckItem complete={Boolean(session?.adsReadGranted)}>
              A permissão ads_read foi concedida.
            </CheckItem>
            <CheckItem complete={Boolean(session?.tokenValid)}>
              O token foi validado pela Meta.
            </CheckItem>
            <CheckItem complete={Boolean(session?.adAccountsRetrieved)}>
              As contas de anúncios acessíveis foram recuperadas.
            </CheckItem>
            <CheckItem complete={Boolean(session?.accountInsightsRetrieved)}>
              Os Insights dos últimos 30 dias foram recuperados.
            </CheckItem>
          </ul>

          {session?.exchangeError ? (
            <div className="mt-5 border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {session.exchangeError}
            </div>
          ) : null}
        </section>

        {complete && session?.adAccounts?.length ? (
          <>
            <section className="border border-white/10 bg-transparent p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    CONTA DE ANÚNCIOS
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Desempenho da conta selecionada
                  </h2>
                </div>

                <label className="min-w-72">
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Conta disponível
                  </span>
                  <select
                    value={selectedAccount?.id || ""}
                    onChange={(event) =>
                      setSelectedAccountId(event.target.value)
                    }
                    className="mt-2 w-full border border-white/10 bg-slate-900 px-4 py-3 text-white"
                  >
                    {session.adAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name ? `${account.name} · ${account.id}` : account.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedAccount?.insights ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Investimento"
                    value={money(
                      selectedAccount.insights.spend,
                      selectedAccount.currency || "BRL",
                    )}
                  />
                  <Metric
                    label="Alcance"
                    value={integer(selectedAccount.insights.reach)}
                  />
                  <Metric
                    label="Impressões"
                    value={integer(selectedAccount.insights.impressions)}
                  />
                  <Metric
                    label="Cliques"
                    value={integer(selectedAccount.insights.clicks)}
                  />
                  <Metric
                    label="CTR"
                    value={`${decimal(selectedAccount.insights.ctr)}%`}
                  />
                  <Metric
                    label="CPC"
                    value={money(
                      selectedAccount.insights.cpc,
                      selectedAccount.currency || "BRL",
                    )}
                  />
                  <Metric
                    label="CPM"
                    value={money(
                      selectedAccount.insights.cpm,
                      selectedAccount.currency || "BRL",
                    )}
                  />
                  <Metric
                    label="Frequência"
                    value={decimal(selectedAccount.insights.frequency)}
                  />
                </div>
              ) : (
                <p className="mt-6 border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
                  {selectedAccount?.insightsError ||
                    "No account-level Insights were returned for this account."}
                </p>
              )}
            </section>

            <section className="border border-white/10 bg-transparent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                LEITURA DA PROXY
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Análise gerada a partir dos Insights da Meta
              </h2>

              {report ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                  {report.map((item) => (
                    <li
                      key={item}
                      className="border border-white/10 bg-transparent p-4"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-slate-400">
                  Select an account with available Insights to generate the
                  reporting summary.
                </p>
              )}
            </section>

            <section className="border border-white/10 bg-transparent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                CAMPANHAS
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Desempenho por campanha
              </h2>

              {selectedCampanhaInsights.length ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[840px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-3">Campanha</th>
                        <th className="px-3 py-3">Investimento</th>
                        <th className="px-3 py-3">Alcance</th>
                        <th className="px-3 py-3">Impressões</th>
                        <th className="px-3 py-3">Cliques</th>
                        <th className="px-3 py-3">CTR</th>
                        <th className="px-3 py-3">CPC</th>
                        <th className="px-3 py-3">Frequência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCampanhaInsights.map((campaign, index) => (
                        <tr
                          key={campaign.campaign_id || `campaign-${index}`}
                          className="border-b border-white/5 text-slate-300"
                        >
                          <td className="px-3 py-4 font-medium text-white">
                            {campaign.campaign_name ||
                              campaign.campaign_id ||
                              "Campanha"}
                          </td>
                          <td className="px-3 py-4">
                            {money(
                              campaign.spend,
                              selectedAccount?.currency || "BRL",
                            )}
                          </td>
                          <td className="px-3 py-4">
                            {integer(campaign.reach)}
                          </td>
                          <td className="px-3 py-4">
                            {integer(campaign.impressions)}
                          </td>
                          <td className="px-3 py-4">
                            {integer(campaign.clicks)}
                          </td>
                          <td className="px-3 py-4">
                            {decimal(campaign.ctr)}%
                          </td>
                          <td className="px-3 py-4">
                            {money(
                              campaign.cpc,
                              selectedAccount?.currency || "BRL",
                            )}
                          </td>
                          <td className="px-3 py-4">
                            {decimal(campaign.frequency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-5 border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
                  {selectedCampanhaInsightsError ||
                    "No campaign-level rows were returned for the selected account. Account-level reporting above still demonstrates ads_read successfully."}
                </p>
              )}
            </section>

            <section className="border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                RELATÓRIO PARA CLIENTE
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {selectedAccount?.name || "Conta selecionada"} · relatório em português
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50/90">
                Abre uma visão preparada para apresentação ao cliente usando exatamente os Insights da conta selecionada nesta sessão.
              </p>
              {selectedAccount ? (
                <a
                  href={`/meta/review/ads-read/client-report?account_id=${encodeURIComponent(selectedAccount.id)}`}
                  className="mt-5 inline-flex min-h-11 items-center justify-center bg-cyan-200 px-4 font-semibold text-slate-950 transition hover:bg-cyan-100"
                >
                  Abrir relatório {selectedAccount.name || selectedAccount.id}
                </a>
              ) : null}
            </section>

            <section className="border border-emerald-300/20 bg-emerald-300/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                STATUS DA INTEGRAÇÃO
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Fluxo ads_read concluído
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50">
                Proxy received explicit Meta authorization, validated ads_read,
                retrieved authorized advertising accounts and Insights, and
                rendered a read-only performance report. No advertising object
                was modified.
              </p>

              <button
                type="button"
                onClick={restartReview}
                className="mt-6 min-h-11 border border-white/15 px-4 font-semibold text-white transition hover:bg-white/5"
              >
                Reiniciar autorização
              </button>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-transparent p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}
