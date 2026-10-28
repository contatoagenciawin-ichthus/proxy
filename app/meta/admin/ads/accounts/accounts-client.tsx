"use client"

import { useEffect, useMemo, useState } from "react"

const REVIEW_SESSION_KEY = "proxy_meta_ads_read_review"

type Insights = {
  spend?: string
  impressions?: string
  reach?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  frequency?: string
  date_start?: string
  date_stop?: string
}

type Account = {
  id: string
  name?: string
  currency?: string
  timezone_name?: string
  insights?: Insights | null
  insightsError?: string | null
}

type ReviewSession = {
  completedAt?: string
  primaryAccountId?: string | null
  adAccounts?: Account[]
  campaignInsightsByAccount?: Record<string, { data: unknown[]; error: string | null }>
}

type RefreshResponse = ReviewSession & {
  ok?: boolean
  error?: string
  stats?: {
    attempted: number
    succeeded: number
    failed: number
    errorRatePercent: number
  }
}

function money(value?: string, currency = "BRL") {
  const parsed = Number(value || 0)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(parsed) ? parsed : 0)
}

function integer(value?: string) {
  const parsed = Number(value || 0)
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0)
}

export function MetaAdAccountsClient() {
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [query, setQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState("")

  useEffect(() => {
    const stored = window.sessionStorage.getItem(REVIEW_SESSION_KEY)
    if (!stored) return
    try {
      setSession(JSON.parse(stored) as ReviewSession)
    } catch {
      setSession(null)
    }
  }, [])

  async function refreshMetaData() {
    setRefreshing(true)
    setRefreshMessage("Atualizando dados diretamente da Meta...")

    try {
      const response = await fetch("/api/meta/admin/ads/refresh", {
        method: "POST",
        cache: "no-store",
      })
      const payload = (await response.json()) as RefreshResponse

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Falha HTTP ${response.status}`)
      }

      const next: ReviewSession = {
        completedAt: payload.completedAt,
        primaryAccountId: payload.primaryAccountId || null,
        adAccounts: payload.adAccounts || [],
        campaignInsightsByAccount: payload.campaignInsightsByAccount || {},
      }

      window.sessionStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next))
      setSession(next)

      const stats = payload.stats
      setRefreshMessage(
        stats
          ? `Atualização concluída: ${stats.succeeded}/${stats.attempted} chamadas bem-sucedidas · erros ${stats.errorRatePercent}%.`
          : "Atualização concluída com dados reais da Meta.",
      )
    } catch (error) {
      setRefreshMessage(
        error instanceof Error
          ? `Não foi possível atualizar: ${error.message}`
          : "Não foi possível atualizar os dados da Meta.",
      )
    } finally {
      setRefreshing(false)
    }
  }

  const accounts = useMemo(() => {
    const list = session?.adAccounts || []
    const normalized = query.trim().toLowerCase()
    if (!normalized) return list
    return list.filter((account) =>
      [account.name, account.id, account.currency, account.timezone_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    )
  }, [session, query])

  if (!session?.adAccounts?.length) {
    return (
      <section className="pa-note">
        <h2>Nenhum snapshot de anúncios carregado</h2>
        <p>
          Tente carregar os dados diretamente da Meta usando a credencial segura do
          backend. Se a credencial ainda não possuir ads_read, o painel informará o erro.
        </p>
        <div className="pa-report-state-actions">
          <button
            type="button"
            className="pa-button"
            onClick={refreshMetaData}
            disabled={refreshing}
          >
            {refreshing ? "Consultando a Meta..." : "Carregar dados da Meta"}
          </button>
          <a className="pa-detail-link" href="/meta/review/ads-read/login">
            Autorizar novamente ↗
          </a>
        </div>
        {refreshMessage ? <p className="pa-refresh-status">{refreshMessage}</p> : null}
      </section>
    )
  }

  return (
    <>
      <section className="pa-metrics" aria-label="Resumo das contas de anúncios">
        <div>
          <span>Contas acessíveis</span>
          <strong>{String(session.adAccounts.length).padStart(2, "0")}</strong>
        </div>
        <div>
          <span>Com Insights</span>
          <strong>{String(session.adAccounts.filter((a) => a.insights).length).padStart(2, "0")}</strong>
        </div>
        <div>
          <span>Conta principal</span>
          <strong className="pa-metric-id">{session.primaryAccountId || "—"}</strong>
        </div>
        <div>
          <span>Última leitura</span>
          <strong className="pa-metric-date">
            {session.completedAt
              ? new Date(session.completedAt).toLocaleString("pt-BR")
              : "Nesta sessão"}
          </strong>
        </div>
      </section>

      <div className="pa-section-title">
        <h2>Contas de anúncios</h2>
        <span>{accounts.length} exibidas</span>
      </div>

      <div className="pa-account-toolbar">
        <label>
          <span>Buscar conta</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, ID, moeda ou fuso"
          />
        </label>
        <div className="pa-account-refresh">
          <button
            type="button"
            className="pa-detail-link pa-detail-button"
            onClick={refreshMetaData}
            disabled={refreshing}
          >
            {refreshing ? "Atualizando..." : "Atualizar dados da Meta ↻"}
          </button>
          {refreshMessage ? <small className="pa-refresh-status">{refreshMessage}</small> : null}
        </div>
      </div>

      <div className="pa-table-wrap">
        <table>
          <caption className="pa-sr">
            Contas de anúncios acessíveis pela sessão Meta autorizada
          </caption>
          <thead>
            <tr>
              <th>Conta</th>
              <th>ID</th>
              <th>Investimento</th>
              <th>Alcance</th>
              <th>Cliques</th>
              <th>Situação</th>
              <th><span className="pa-sr">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <strong>{account.name || "Conta sem nome"}</strong>
                  <small>{account.currency || "Moeda não informada"}</small>
                </td>
                <td><span>{account.id}</span></td>
                <td>{account.insights ? money(account.insights.spend, account.currency || "BRL") : "—"}</td>
                <td>{account.insights ? integer(account.insights.reach) : "—"}</td>
                <td>{account.insights ? integer(account.insights.clicks) : "—"}</td>
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
    </>
  )
}
