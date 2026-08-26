"use client"

import { useEffect, useState } from "react"

const appId = "1952034255371331"
const configId = "1416361170675761"

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void
      login: (
        callback: (response: unknown) => void,
        options: Record<string, unknown>,
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

export default function MetaOnboardingPage() {
  const [sdkReady, setSdkReady] = useState(false)
  const [status, setStatus] = useState("Carregando conexão com a Meta...")

  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: false,
        version: "v26.0",
      })
      setSdkReady(true)
      setStatus("Pronto para iniciar o cadastro incorporado.")
    }

    if (document.getElementById("facebook-jssdk")) return

    const script = document.createElement("script")
    script.id = "facebook-jssdk"
    script.async = true
    script.defer = true
    script.crossOrigin = "anonymous"
    script.src = "https://connect.facebook.net/pt_BR/sdk.js"
    document.body.appendChild(script)
  }, [])

  function startSignup() {
    if (!window.FB) {
      setStatus("O SDK da Meta ainda não terminou de carregar.")
      return
    }

    setStatus("Abrindo o cadastro da Meta...")
    window.FB.login(
      (response) => {
        console.info("Meta Embedded Signup callback", response)
        setStatus("Etapa da Meta concluída. A integração será validada no servidor.")
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          version: "v4",
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
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
          Este ambiente é utilizado para autorizar, de forma segura, a conexão de uma conta do WhatsApp Business à infraestrutura da Proxy Technology.
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
