"use client"

import { useState } from "react"

type ReviewStatus = {
  ok: true
  graphVersion: string
  identifiers: {
    businessId: string
    wabaId: string
    phoneNumberId: string
    recipient: string
  }
  evidence: {
    businessManagement: {
      endpoint: string
      selectedBusiness: { id: string; name?: string } | null
      businesses: Array<{ id: string; name?: string }>
    }
    whatsappBusinessManagement: {
      phoneNumbersEndpoint: string
      templatesEndpoint: string
      phoneNumbers: Array<{
        id: string
        display_phone_number?: string
        verified_name?: string
        quality_rating?: string
        platform_type?: string
      }>
      templates: Array<{
        id?: string
        name?: string
        status?: string
        category?: string
        language?: string
      }>
    }
    whatsappBusinessMessaging: {
      endpoint: string
      template: string
      recipient: string
    }
  }
}

type ActionResult = {
  ok?: boolean
  error?: string
  reused?: boolean
  recipient?: string
  waId?: string
  messageId?: string
  messageStatus?: string
  template?: {
    id?: string
    name?: string
    status?: string
    category?: string
    language?: string
  }
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-300" />
      {children}
    </span>
  )
}

function PermissionCard({
  title,
  permission,
  children,
}: {
  title: string
  permission: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Permission evidence
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
          <code className="mt-2 block text-sm text-cyan-200">{permission}</code>
        </div>
        <StatusBadge>Graph API pronta</StatusBadge>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  )
}

export default function MetaReviewPage() {
  const [reviewKey, setReviewKey] = useState("")
  const [recipient, setRecipient] = useState("")
  const [status, setStatus] = useState<ReviewStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [templateResult, setTemplateResult] = useState<ActionResult | null>(null)
  const [messageResult, setMessageResult] = useState<ActionResult | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function apiRequest(init?: RequestInit) {
    const response = await fetch("/api/meta/review", {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-review-key": reviewKey,
        ...(init?.headers || {}),
      },
    })

    const payload = (await response.json()) as ReviewStatus | ActionResult
    if (!response.ok) {
      const failure = payload as ActionResult
      throw new Error(failure.error || `Falha HTTP ${response.status}`)
    }

    return payload
  }

  async function loadEvidence() {
    setLoading(true)
    setError("")
    try {
      const payload = (await apiRequest()) as ReviewStatus
      setStatus(payload)
    } catch (cause) {
      setStatus(null)
      setError(cause instanceof Error ? cause.message : "Falha ao carregar evidências.")
    } finally {
      setLoading(false)
    }
  }

  async function createTemplate() {
    setActionLoading("template")
    setError("")
    try {
      const payload = (await apiRequest({
        method: "POST",
        body: JSON.stringify({ action: "create_template" }),
      })) as ActionResult
      setTemplateResult(payload)
      await loadEvidence()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao criar template.")
    } finally {
      setActionLoading(null)
    }
  }

  async function sendMessage() {
    setActionLoading("message")
    setError("")
    try {
      const payload = (await apiRequest({
        method: "POST",
        body: JSON.stringify({ action: "send_message", recipient }),
      })) as ActionResult
      setMessageResult(payload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao enviar mensagem.")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-7 shadow-2xl shadow-black/20 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Proxy Technology
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Meta App Review Console
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Ambiente controlado para demonstrar, de ponta a ponta, como a Proxy
            utiliza as permissões solicitadas à Meta para operar a WhatsApp
            Business Platform.
          </p>

          <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Chave de revisão</span>
              <input
                type="password"
                value={reviewKey}
                onChange={(event) => setReviewKey(event.target.value)}
                placeholder="Informe a chave configurada para a revisão"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              />
            </label>
            <button
              type="button"
              onClick={loadEvidence}
              disabled={!reviewKey || loading}
              className="min-h-12 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Consultando Graph API..." : "Carregar evidências"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </div>

        {status ? (
          <div className="mt-7 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Graph API", status.graphVersion],
                ["Business ID", status.identifiers.businessId],
                ["WABA ID", status.identifiers.wabaId],
                ["Phone Number ID", status.identifiers.phoneNumberId],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-2 break-all text-sm font-medium text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            <PermissionCard
              title="Contexto do portfólio empresarial"
              permission="business_management"
            >
              <p className="text-sm leading-6 text-slate-300">
                A aplicação consulta o contexto empresarial autorizado e identifica
                o negócio usado na operação. Endpoint demonstrado:{" "}
                <code className="text-cyan-200">
                  {status.evidence.businessManagement.endpoint}
                </code>
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Negócio selecionado</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {status.evidence.businessManagement.selectedBusiness?.name || "Proxy Technology"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {status.evidence.businessManagement.selectedBusiness?.id || status.identifiers.businessId}
                </p>
              </div>
            </PermissionCard>

            <PermissionCard
              title="Gestão da conta do WhatsApp Business"
              permission="whatsapp_business_management"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Números associados</p>
                  <div className="mt-3 space-y-3">
                    {status.evidence.whatsappBusinessManagement.phoneNumbers.map((phone) => (
                      <div key={phone.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold text-white">
                          {phone.verified_name || "WhatsApp Business"}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">{phone.display_phone_number || phone.id}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {phone.platform_type || "Cloud API"} · qualidade {phone.quality_rating || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Templates</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {status.evidence.whatsappBusinessManagement.templates.length} template(s) retornado(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={createTemplate}
                      disabled={actionLoading === "template"}
                      className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-50"
                    >
                      {actionLoading === "template" ? "Criando..." : "Criar template demo"}
                    </button>
                  </div>
                  <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
                    {status.evidence.whatsappBusinessManagement.templates.map((template) => (
                      <div key={template.id || `${template.name}-${template.language}`} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-200">{template.name}</span>
                          <span className="text-xs text-slate-400">{template.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {template.category} · {template.language}
                        </p>
                      </div>
                    ))}
                  </div>
                  {templateResult?.template ? (
                    <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                      Template {templateResult.template.name} {templateResult.reused ? "já existente" : "criado"}. Status: {templateResult.template.status || "PENDING"}.
                    </div>
                  ) : null}
                </div>
              </div>
            </PermissionCard>

            <PermissionCard
              title="Envio real de mensagem de teste"
              permission="whatsapp_business_messaging"
            >
              <p className="text-sm leading-6 text-slate-300">
                A aplicação envia o template pré-aprovado <code className="text-cyan-200">hello_world</code> pelo endpoint{" "}
                <code className="text-cyan-200">{status.evidence.whatsappBusinessMessaging.endpoint}</code>.
                O token permanece exclusivamente no servidor.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Destinatário de teste</span>
                  <input
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder={`Configurado: ${status.identifiers.recipient}`}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                  />
                </label>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={actionLoading === "message"}
                  className="min-h-12 rounded-xl bg-cyan-300 px-5 font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-50"
                >
                  {actionLoading === "message" ? "Enviando..." : "Enviar hello_world"}
                </button>
              </div>
              {messageResult?.messageId ? (
                <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  <p className="font-semibold">Mensagem aceita pela Cloud API.</p>
                  <p className="mt-2 break-all text-xs text-emerald-200/80">Message ID: {messageResult.messageId}</p>
                  <p className="mt-1 text-xs text-emerald-200/80">Destinatário: {messageResult.recipient}</p>
                </div>
              ) : null}
            </PermissionCard>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-5 text-sm leading-6 text-amber-100">
              Esta console usa apenas ativos de teste/configurados para a revisão. Nenhum número de cliente é migrado ou registrado por esta página.
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
