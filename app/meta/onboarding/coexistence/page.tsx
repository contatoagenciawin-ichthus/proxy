"use client"

import { useEffect, useRef, useState } from "react"

const appId = "1952034255371331"
const configId = "3237839906603757"
const SESSION_KEY = "proxy_meta_whatsapp_coexistence"

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
  version?: number | string
  [key: string]: unknown
}

type ExchangeResponse = {
  ok?: boolean
  error?: string
  tokenExchangeCompleted?: boolean
  tokenStored?: boolean
  tokenVisibleToBrowser?: boolean
  tokenFingerprint?: string
  expiresAt?: string | null
  grantedScopes?: string[]
  asset?: {
    wabaId?: string
    phoneNumberId?: string
    displayPhoneNumber?: string | null
    verifiedName?: string | null
    status?: string | null
    platformType?: string | null
  }
}

type CoexistenceSession = {
  startedAt?: string
  completedAt?: string
  loginCodeReceived?: boolean
  embeddedSignupCompleted?: boolean
  embeddedSignupEvent?: string
  wabaId?: string
  phoneNumberId?: string
  businessId?: string
  tokenExchangeCompleted?: boolean
  tokenStored?: boolean
  tokenFingerprint?: string
  tokenExpiresAt?: string | null
  credentialError?: string
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

export default function WhatsAppCoexistenceOnboardingPage() {
  const [sdkReady, setSdkReady] = useState(false)
  const [status, setStatus] = useState(
    "Pronto para iniciar o onboarding de coexistência do WhatsApp Business App.",
  )
  const [session, setSession] = useState<CoexistenceSession>({})
  const [authorizationCode, setAuthorizationCode] = useState("")
  const exchangeInFlight = useRef(false)

  function saveSession(patch: Partial<CoexistenceSession>) {
    setSession((current) => {
      const next = { ...current, ...patch }
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return next
    })
  }

  function startFreshSession() {
    const fresh: CoexistenceSession = {
      startedAt: new Date().toISOString(),
      loginCodeReceived: false,
      embeddedSignupCompleted: false,
      tokenExchangeCompleted: false,
      tokenStored: false,
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh))
    setSession(fresh)
    setAuthorizationCode("")
    exchangeInFlight.current = false
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        setSession(JSON.parse(stored) as CoexistenceSession)
      } catch {
        window.sessionStorage.removeItem(SESSION_KEY)
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (!isFacebookOrigin(event.origin)) return

      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data
        const message = payload as EmbeddedSignupEvent

        if (message?.type !== "WA_EMBEDDED_SIGNUP") return

        const eventData = message.data || {}
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

        if (message.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
          saveSession({
            embeddedSignupCompleted: true,
            embeddedSignupEvent: message.event,
            completedAt: new Date().toISOString(),
            ...(wabaId ? { wabaId } : {}),
            ...(phoneNumberId ? { phoneNumberId } : {}),
            ...(businessId ? { businessId } : {}),
          })
          setStatus(
            "Coexistência concluída pela Meta. Finalizando a credencial operacional no backend da Proxy...",
          )
          return
        }

        if (message.event === "FINISH" || message.event === "FINISH_ONLY_WABA") {
          saveSession({
            embeddedSignupCompleted: true,
            embeddedSignupEvent: message.event,
            completedAt: new Date().toISOString(),
            ...(wabaId ? { wabaId } : {}),
            ...(phoneNumberId ? { phoneNumberId } : {}),
            ...(businessId ? { businessId } : {}),
          })
          setStatus(
            `A Meta concluiu o Embedded Signup com o evento ${message.event}. Finalizando a credencial operacional no backend...`,
          )
          return
        }

        if (message.event === "CANCEL") {
          setStatus("O onboarding foi cancelado antes da conclusão.")
          return
        }

        if (message.event === "ERROR") {
          setStatus("A Meta informou um erro durante o onboarding de coexistência.")
          return
        }

        setStatus("Onboarding de coexistência em andamento na janela da Meta.")
      } catch {
        // A Meta emite outras mensagens internas no mesmo canal.
      }
    }

    window.addEventListener("message", handleMessage)

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v26.0",
      })
      setSdkReady(true)
    }

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script")
      script.id = "facebook-jssdk"
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"
      script.src = "https://connect.facebook.net/pt_BR/sdk.js"
      document.body.appendChild(script)
    }

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  useEffect(() => {
    if (
      !authorizationCode ||
      !session.embeddedSignupCompleted ||
      session.tokenStored ||
      exchangeInFlight.current
    ) {
      return
    }

    exchangeInFlight.current = true
    setStatus(
      "Onboarding concluído. Trocando o código de autorização por uma credencial server-side e armazenando-a de forma cifrada...",
    )

    void (async () => {
      try {
        const response = await fetch("/api/meta/onboarding/exchange", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code: authorizationCode,
            wabaId: session.wabaId || undefined,
            phoneNumberId: session.phoneNumberId || undefined,
            businessId: session.businessId || undefined,
          }),
        })
        const result = (await response.json()) as ExchangeResponse

        if (!response.ok || result.ok !== true || result.tokenStored !== true) {
          throw new Error(result.error || "A Meta não concluiu a troca da credencial.")
        }

        saveSession({
          tokenExchangeCompleted: true,
          tokenStored: true,
          tokenFingerprint: result.tokenFingerprint || undefined,
          tokenExpiresAt: result.expiresAt || null,
          credentialError: undefined,
          ...(result.asset?.wabaId ? { wabaId: result.asset.wabaId } : {}),
          ...(result.asset?.phoneNumberId
            ? { phoneNumberId: result.asset.phoneNumberId }
            : {}),
        })
        setAuthorizationCode("")
        setStatus(
          "Integração concluída. A credencial operacional foi validada e armazenada de forma cifrada sem ser exposta ao navegador.",
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Falha ao finalizar a credencial Meta."
        saveSession({ credentialError: message })
        setStatus(
          `A coexistência foi concluída, mas a credencial operacional ainda não foi armazenada: ${message}`,
        )
        exchangeInFlight.current = false
      }
    })()
  }, [
    authorizationCode,
    session.embeddedSignupCompleted,
    session.tokenStored,
    session.wabaId,
    session.phoneNumberId,
    session.businessId,
  ])

  function launchCoexistenceSignup() {
    if (!window.FB) {
      setStatus("O SDK da Meta ainda não terminou de carregar. Aguarde alguns segundos e tente novamente.")
      return
    }

    startFreshSession()
    setStatus("Abrindo o fluxo oficial da Meta para conectar o WhatsApp Business App à Cloud API...")

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code?.trim() || ""
        if (code) {
          setAuthorizationCode(code)
          saveSession({
            loginCodeReceived: true,
            embeddedSignupCompleted: true,
            embeddedSignupEvent: "AUTHORIZATION_CODE",
            completedAt: new Date().toISOString(),
          })
          setStatus(
            "Autorização concluída pela Meta. Finalizando a credencial operacional no backend da Proxy...",
          )
          return
        }

        if (response.status === "connected") {
          saveSession({ loginCodeReceived: true })
          setStatus("Login concluído. Aguardando a conclusão do onboarding de coexistência.")
          return
        }

        setStatus("A autorização da Meta não foi concluída.")
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
        },
      },
    )
  }

  function restart() {
    window.sessionStorage.removeItem(SESSION_KEY)
    setSession({})
    setAuthorizationCode("")
    exchangeInFlight.current = false
    setStatus("Pronto para iniciar o onboarding de coexistência do WhatsApp Business App.")
  }

  const completed = Boolean(session.embeddedSignupCompleted)
  const credentialReady = Boolean(session.tokenStored)

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Proxy Technology · WhatsApp Business Platform
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Conectar WhatsApp Business App em coexistência
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Este fluxo usa o Embedded Signup oficial da Meta com o seletor específico para
            WhatsApp Business App. O objetivo é conectar um número já usado no aplicativo à
            Cloud API sem iniciar o fluxo comum de migração do número.
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6 md:p-7">
          <h2 className="text-xl font-semibold text-white">Antes de começar</h2>
          <div className="mt-4 space-y-2 text-sm leading-6 text-emerald-50/90">
            <p>Mantenha o WhatsApp Business App do número aberto e atualizado no celular.</p>
            <p>Use a conta Meta administradora do portfólio empresarial do cliente.</p>
            <p>Se a Meta apresentar QR code ou confirmação no celular, conclua essa etapa no aparelho do número.</p>
            <p>Não escolha opções que peçam para excluir ou migrar o número para fora do WhatsApp Business App.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Etapa 1</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Abrir onboarding da Meta</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                O botão abaixo chama o Embedded Signup v4 com
                <code className="mx-1 text-emerald-200">whatsapp_business_app_onboarding</code>
                para solicitar o caminho de coexistência.
              </p>
            </div>
            <button
              type="button"
              onClick={launchCoexistenceSignup}
              disabled={!sdkReady}
              className="min-h-12 shrink-0 rounded-xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sdkReady ? "Conectar WhatsApp Business App" : "Carregando Meta SDK..."}
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <strong className="text-white">Status:</strong> {status}
          </div>
        </section>

        {completed ? (
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Retorno da Meta
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Onboarding finalizado</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-50/90">
              O código de autorização é trocado exclusivamente no backend. A credencial emitida
              pela Meta não é gravada no navegador nem exibida nesta página.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Evento</p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {session.embeddedSignupEvent || "Concluído"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">WABA ID</p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {session.wabaId || "Resolvido no backend"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Phone Number ID</p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {session.phoneNumberId || "Resolvido no backend"}
                </p>
              </div>
            </div>

            <div
              className={`mt-5 rounded-xl border p-4 text-sm ${
                credentialReady
                  ? "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-50"
                  : session.credentialError
                    ? "border-amber-300/30 bg-amber-300/[0.08] text-amber-50"
                    : "border-white/10 bg-black/20 text-slate-300"
              }`}
            >
              <p className="font-semibold text-white">Credencial operacional</p>
              <p className="mt-2 leading-6">
                {credentialReady
                  ? "Validada pela Meta e armazenada de forma cifrada no backend do cliente."
                  : session.credentialError
                    ? "A coexistência está ativa, mas o armazenamento da credencial precisa ser repetido em uma nova sessão de onboarding."
                    : "Aguardando a troca server-side do código de autorização."}
              </p>
              {credentialReady && session.tokenFingerprint ? (
                <p className="mt-2 text-xs text-emerald-100/70">
                  Fingerprint técnica: {session.tokenFingerprint}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={restart}
              className="mt-6 min-h-11 rounded-xl border border-white/15 px-5 font-semibold text-white transition hover:bg-white/5"
            >
              Reiniciar somente esta sessão
            </button>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
          <p className="font-semibold text-slate-200">Segurança</p>
          <p className="mt-2">
            O código de autorização existe apenas em memória até a troca server-side. O access
            token não é devolvido ao navegador: a Proxy valida o ativo, assina o handoff e o
            backend do cliente cifra a credencial antes de persistir.
          </p>
        </section>
      </div>
    </main>
  )
}