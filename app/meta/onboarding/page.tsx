"use client"

import { useEffect, useState } from "react"

const appId = "1952034255371331"
const configId = "1474502514488126"

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
}

export default function MetaOnboardingPage() {
  const [sdkReady, setSdkReady] = useState(false)
  const [status, setStatus] = useState("Carregando conexão com a Meta...")

  useEffect(() => {
    const handleEmbeddedSignupMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return

      try {
        const payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data
        const data = payload as EmbeddedSignupEvent

        if (data?.type !== "WA_EMBEDDED_SIGNUP") return

        if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
          setStatus("Cadastro incorporado concluído pela Meta.")
          return
        }

        if (data.event === "CANCEL") {
          setStatus("Cadastro cancelado antes da conclusão.")
          return
        }

        if (data.event === "ERROR") {
          setStatus("A Meta retornou um erro durante o cadastro incorporado.")
          return
        }

        setStatus("Etapa do cadastro incorporado recebida da Meta.")
      } catch {
        // O SDK também publica mensagens internas que não pertencem ao
        // WhatsApp Embedded Signup. Elas podem ser ignoradas com segurança.
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
      setStatus("Pronto para iniciar o cadastro incorporado.")
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
      window.removeEventListener("message", handleEmbeddedSignupMessage)
    }
  }, [])

  function startSignup() {
    if (!window.FB) {
      setStatus("O SDK da Meta ainda não terminou de carregar.")
      return
    }

    setStatus("Abrindo o cadastro da Meta...")

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          setStatus(
            "Autorização recebida da Meta. A integração será validada no servidor.",
          )
          return
        }

        setStatus(
          response.status === "connected"
            ? "Login concluído; aguardando os dados do cadastro incorporado."
            : "A autorização da Meta não foi concluída.",
        )
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Proxy Technology
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Conectar WhatsApp Business
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          Este ambiente é utilizado para autorizar, de forma segura, a conexão de
          uma conta do WhatsApp Business à infraestrutura da Proxy Technology.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
          <strong className="text-white">Status:</strong> {status}
        </div>

        <button
          type="button"
          onClick={startSignup}
          disabled={!sdkReady}
          className="mt-8 min-h-12 rounded-lg bg-white px-6 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Iniciar conexão com a Meta
        </button>
      </div>
    </main>
  )
}
