"use client"

import { useEffect, useMemo, useState } from "react"

const REVIEW_SESSION_KEY = "proxy_meta_ads_read_review"

type ActionMetric = {
  action_type?: string
  value?: string
}

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

type CampaignInsights = Insights & {
  campaign_id?: string
  campaign_name?: string
  actions?: ActionMetric[]
  cost_per_action_type?: ActionMetric[]
}

type ReviewSession = {
  primaryAccountId?: string | null
  adAccounts?: Array<{
    id: string
    name?: string
    currency?: string
    insights?: Insights | null
  }>
  campaignInsightsByAccount?: Record<
    string,
    { data: CampaignInsights[]; error: string | null }
  >
}

function n(value?: string) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: number | string | undefined, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(typeof value === "number" ? value : n(value))
}

function integer(value: number | string | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(typeof value === "number" ? value : n(value))
}

function decimal(value: number | string | undefined, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(typeof value === "number" ? value : n(value))
}

function labelForAction(type: string) {
  const normalized = type.toLowerCase()

  if (
    normalized.includes("messaging_conversation_started") ||
    normalized.includes("messaging_conversation")
  ) {
    return "Conversas iniciadas por mensagem"
  }
  if (normalized.includes("messaging_first_reply")) {
    return "Primeiras respostas por mensagem"
  }
  if (normalized.includes("lead")) {
    return "Leads"
  }
  if (normalized.includes("link_click")) {
    return "Cliques no link"
  }
  if (normalized.includes("landing_page_view")) {
    return "Visualizações de página"
  }
  if (normalized.includes("contact")) {
    return "Contatos"
  }
  if (normalized.includes("post_engagement")) {
    return "Engajamentos"
  }
  if (normalized.includes("video_view")) {
    return "Visualizações de vídeo"
  }

  return type
}

function isBusinessAction(type: string) {
  const normalized = type.toLowerCase()
  return (
    normalized.includes("messaging") ||
    normalized.includes("whatsapp") ||
    normalized.includes("lead") ||
    normalized.includes("contact")
  )
}

export default function PetEndoscopiaMetaReportPage() {
  const [session, setSession] = useState<ReviewSession | null>(null)

  useEffect(() => {
    const stored = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (!stored) return

    try {
      setSession(JSON.parse(stored) as ReviewSession)
    } catch {
      setSession(null)
    }
  }, [])

  const report = useMemo(() => {
    if (!session?.adAccounts?.length) return null

    const account =
      session.adAccounts.find(
        (item) =>
          item.name?.toLowerCase().includes("pet endoscopia") ||
          item.id === session.primaryAccountId,
      ) || session.adAccounts[0]

    const campaigns =
      session.campaignInsightsByAccount?.[account.id]?.data || []

    const totals = new Map<string, number>()
    for (const campaign of campaigns) {
      for (const action of campaign.actions || []) {
        const type = action.action_type || "unknown"
        totals.set(type, (totals.get(type) || 0) + n(action.value))
      }
    }

    const actions = Array.from(totals.entries())
      .map(([type, value]) => ({
        type,
        label: labelForAction(type),
        value,
        business: isBusinessAction(type),
      }))
      .sort((a, b) => {
        if (a.business !== b.business) return a.business ? -1 : 1
        return b.value - a.value
      })

    const spend = n(account.insights?.spend)

    const businessActions = actions
      .filter((action) => action.business && action.value > 0)
      .map((action) => ({
        ...action,
        calculatedCost: action.value > 0 ? spend / action.value : 0,
      }))

    return {
      account,
      campaigns,
      actions,
      businessActions,
      spend,
    }
  }, [session])

  if (!session) {
    return (
      <main className="min-h-screen bg-[#f3f1ec] px-5 py-10 text-[#17343c]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5a777e]">
            Proxy Technology · Meta Ads
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Relatório Pet Endoscopia
          </h1>
          <p className="mt-4 leading-7 text-[#5f7075]">
            Não encontrei a sessão autorizada da Meta neste navegador. Volte
            para o fluxo ads_read, conclua a autorização e abra este relatório
            novamente.
          </p>
          <a
            href="/meta/review/ads-read"
            className="mt-6 inline-flex rounded-xl bg-[#173f49] px-5 py-3 font-semibold text-white"
          >
            Voltar para ads_read
          </a>
        </div>
      </main>
    )
  }

  if (!report?.account?.insights) {
    return (
      <main className="min-h-screen bg-[#f3f1ec] px-5 py-10 text-[#17343c]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-8">
          <h1 className="text-3xl font-semibold">Relatório Pet Endoscopia</h1>
          <p className="mt-4 text-[#5f7075]">
            A sessão existe, mas não contém Insights da conta Pet Endoscopia.
          </p>
        </div>
      </main>
    )
  }

  const { account, campaigns, actions, businessActions } = report
  const insights = account.insights
  const currency = account.currency || "BRL"

  return (
    <main className="min-h-screen bg-[#f3f1ec] px-4 py-8 text-[#17343c] md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-black/10 bg-white p-7 md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4f777f]">
            Pet Endoscopia · Relatório de tráfego Meta
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Desempenho dos últimos 30 dias
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#63767a] md:text-base">
            Dados obtidos diretamente da Meta Marketing API, em modo somente
            leitura, a partir da conta de anúncios autorizada.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Investimento" value={money(insights.spend, currency)} />
          <Metric label="Alcance" value={integer(insights.reach)} />
          <Metric label="Impressões" value={integer(insights.impressions)} />
          <Metric label="Cliques" value={integer(insights.clicks)} />
          <Metric label="CTR" value={decimal(insights.ctr) + "%"} />
          <Metric label="CPC médio" value={money(insights.cpc, currency)} />
          <Metric label="CPM" value={money(insights.cpm, currency)} />
          <Metric label="Frequência" value={decimal(insights.frequency)} />
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#698087]">
            Resultado de negócio
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Ações atribuídas pela Meta
          </h2>

          {businessActions.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {businessActions.map((action) => (
                <div
                  key={action.type}
                  className="rounded-2xl border border-[#dce5e6] bg-[#f8faf9] p-5"
                >
                  <p className="text-sm font-semibold text-[#345861]">
                    {action.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {integer(action.value)}
                  </p>
                  <p className="mt-2 text-sm text-[#6b7c80]">
                    Custo calculado: {money(action.calculatedCost, currency)}
                  </p>
                  <p className="mt-2 break-all text-xs text-[#8a999c]">
                    Meta action_type: {action.type}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              A API retornou dados de tráfego, mas não há nesta sessão uma ação
              de mensagem, contato ou lead claramente atribuída. O relatório
              pode ser enviado com métricas de tráfego, mas não deve afirmar
              conversas ou leads sem evidência da Meta.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#698087]">
            Campanhas
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Desempenho por público
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase tracking-[0.11em] text-[#72858a]">
                <tr>
                  <th className="px-3 py-3">Campanha</th>
                  <th className="px-3 py-3">Invest.</th>
                  <th className="px-3 py-3">Alcance</th>
                  <th className="px-3 py-3">Impressões</th>
                  <th className="px-3 py-3">Cliques</th>
                  <th className="px-3 py-3">CTR</th>
                  <th className="px-3 py-3">CPC</th>
                  <th className="px-3 py-3">Freq.</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, index) => (
                  <tr
                    key={campaign.campaign_id || index}
                    className="border-b border-black/5"
                  >
                    <td className="px-3 py-4 font-medium">
                      {campaign.campaign_name || campaign.campaign_id}
                    </td>
                    <td className="px-3 py-4">
                      {money(campaign.spend, currency)}
                    </td>
                    <td className="px-3 py-4">{integer(campaign.reach)}</td>
                    <td className="px-3 py-4">
                      {integer(campaign.impressions)}
                    </td>
                    <td className="px-3 py-4">{integer(campaign.clicks)}</td>
                    <td className="px-3 py-4">{decimal(campaign.ctr)}%</td>
                    <td className="px-3 py-4">
                      {money(campaign.cpc, currency)}
                    </td>
                    <td className="px-3 py-4">
                      {decimal(campaign.frequency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#698087]">
            Leitura estratégica
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            O que os dados mostram
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[#5d7075]">
            <p>
              A conta investiu {money(insights.spend, currency)} nos últimos 30
              dias, alcançou {integer(insights.reach)} pessoas e gerou{" "}
              {integer(insights.clicks)} cliques.
            </p>
            <p>
              O CTR foi de {decimal(insights.ctr)}% e o CPC médio de{" "}
              {money(insights.cpc, currency)}.
            </p>
            <p>
              A frequência média foi de {decimal(insights.frequency)}, sem
              indicação, por esse indicador isolado, de saturação relevante de
              exposição no período.
            </p>
          </div>
        </section>

        <details className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <summary className="cursor-pointer font-semibold">
            Diagnóstico técnico: todas as actions devolvidas pela Meta
          </summary>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase tracking-[0.11em] text-[#72858a]">
                <tr>
                  <th className="px-3 py-3">Action type</th>
                  <th className="px-3 py-3">Rótulo</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.type} className="border-b border-black/5">
                    <td className="px-3 py-4 font-mono text-xs">
                      {action.type}
                    </td>
                    <td className="px-3 py-4">{action.label}</td>
                    <td className="px-3 py-4">{integer(action.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71868b]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
