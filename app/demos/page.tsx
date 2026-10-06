import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  Building2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Demonstrações | Proxy Technology",
  description:
    "Explore a plataforma de relacionamento da Proxy e teste a experiência de atendimento conversacional com IA.",
}

const platformDemoUrl =
  process.env.NEXT_PUBLIC_PROXY_PLATFORM_DEMO_URL ||
  "https://proxy-relationship-demo.vercel.app/demo"

const conversationalDemoUrl =
  process.env.NEXT_PUBLIC_PROXY_CONVERSATIONAL_DEMO_URL ||
  "https://proxy-relationship-demo.vercel.app/conversational"

export default function DemosPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-cyan-400/50">
              <span className="h-3.5 w-3.5 bg-cyan-400" />
            </span>
            <span className="text-lg font-bold tracking-tight">PROXY</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-24 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(34,211,238,0.11),transparent_30%),linear-gradient(to_bottom,#050505,#000)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/75">
            Proxy Technology · Ambientes demonstrativos
          </p>
          <h1 className="mt-5 max-w-5xl text-5xl font-bold leading-[0.96] tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
            Não queremos apenas explicar. Experimente.
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/52 lg:text-xl">
            Escolha entre uma visão ampla da plataforma ou uma experiência direta de
            atendimento conversacional. Os ambientes usam dados fictícios e foram
            preparados para exploração pública.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-px bg-white/10 lg:grid-cols-2">
          <article className="flex min-h-[36rem] flex-col bg-black p-8 lg:p-10">
            <div className="flex items-start justify-between gap-5">
              <span className="flex h-12 w-12 items-center justify-center border border-cyan-300/30 bg-cyan-300/[0.05]">
                <Building2 className="h-6 w-6 text-cyan-300/80" strokeWidth={1.5} />
              </span>
              <span className="font-mono text-xs text-white/22">01</span>
            </div>

            <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/60">
              Platform Demo
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Explore a operação.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/48">
              Veja CRM, contatos, e-mail, WhatsApp, inteligência, sinais comerciais,
              radar de mercado e conteúdo trabalhando em uma mesma superfície.
            </p>

            <div className="mt-10 grid gap-3 text-sm text-white/42">
              {[
                "Base própria e histórico de relacionamento",
                "Campanhas e comunicação multicanal",
                "WhatsApp + camada de inteligência",
                "Radar e oportunidades de conteúdo",
                "Command Center com dados demonstrativos",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 border-t border-white/8 pt-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-cyan-300/60" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <a
              href={platformDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex min-h-13 items-center justify-between bg-cyan-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Abrir demo da plataforma
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>

          <article className="flex min-h-[36rem] flex-col bg-[#07100d] p-8 lg:p-10">
            <div className="flex items-start justify-between gap-5">
              <span className="flex h-12 w-12 items-center justify-center border border-emerald-200/20 bg-emerald-200/[0.04]">
                <MessageSquareText className="h-6 w-6 text-emerald-200/75" strokeWidth={1.5} />
              </span>
              <span className="font-mono text-xs text-white/22">02</span>
            </div>

            <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-200/60">
              Conversational Demo
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Experimente o atendimento.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/48">
              Converse como um cliente, paciente ou familiar conversaria. Teste contexto,
              paciência, recuperação de frustração e acesso humano sem precisar entender
              um painel.
            </p>

            <div className="mt-10 grid gap-3 text-sm text-white/42">
              {[
                "Linguagem natural, sem menus rígidos",
                "Continuidade e memória de contexto",
                "Pedido humano sem criar barreiras",
                "Limites claros para situações sensíveis",
                "Ambiente público sem dados reais",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 border-t border-white/8 pt-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-emerald-200/60" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <a
              href={conversationalDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex min-h-13 items-center justify-between border border-emerald-200/30 bg-emerald-200/[0.08] px-5 py-4 text-sm font-semibold text-emerald-50 transition hover:border-emerald-200/60 hover:bg-emerald-200/[0.12]"
            >
              Conversar com o atendente
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b0b0b] px-6 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <BrainCircuit className="h-6 w-6 text-cyan-300/70" strokeWidth={1.5} />
            <h2 className="mt-5 text-2xl font-bold tracking-tight">
              Uma plataforma, duas formas de entender.
            </h2>
          </div>

          <div className="lg:col-span-2 grid gap-px bg-white/10 sm:grid-cols-2">
            <div className="bg-[#0b0b0b] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Para gestores e TI
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/48">
                A Platform Demo mostra arquitetura de operação, integração entre canais,
                dados e a camada de inteligência.
              </p>
            </div>

            <div className="bg-[#0b0b0b] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Para quem vive o atendimento
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/48">
                A Conversational Demo permite avaliar diretamente o comportamento do
                atendente e a experiência de quem está do outro lado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-start gap-4 border border-white/10 p-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300/70" strokeWidth={1.6} />
          <div>
            <h2 className="text-sm font-semibold">Ambientes públicos, ações controladas.</h2>
            <p className="mt-2 max-w-4xl text-xs leading-relaxed text-white/38">
              As demonstrações públicas usam dados fictícios e não liberam disparos reais
              arbitrários. O teste por WhatsApp real permanece restrito a números
              previamente autorizados pela Proxy.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
