"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Cpu, Lightbulb, Plug, TrendingUp } from "lucide-react"

const connectPaths = [
  {
    id: "automation",
    icon: Cpu,
    title: "Automatize com propósito",
    description:
      "Quer transformar processos do seu negócio com IA humanizada e eficiente? Vamos mapear suas dores e construir a solução certa para você.",
    cta: "Quero Automatizar",
    href: "#contact",
    accent: "cyan",
  },
  {
    id: "codev",
    icon: Lightbulb,
    title: "Tem uma ideia. Falta o time.",
    description:
      "Se você tem uma visão clara e precisa de um time técnico experiente para tirar do papel, a Proxy pode ser o seu parceiro de construção.",
    cta: "Vamos Construir Juntos",
    href: "#contact",
    accent: "cyan",
  },
  {
    id: "integration",
    icon: Plug,
    title: "Conecte nossas soluções ao seu negócio",
    description:
      "ScribMed, StudioVox, FalaAI, Redakt — nossas aplicações podem ser integradas ao seu fluxo de trabalho ou revendidas como parte da sua oferta.",
    cta: "Ver Soluções",
    href: "#ecosystem",
    accent: "cyan",
  },
  {
    id: "investors",
    icon: TrendingUp,
    title: "Invista no ecossistema",
    description:
      "Vários dos nossos produtos estão em fase pré-seed com alto potencial de crescimento. Se você busca oportunidades reais em tech brasileiro, queremos conversar.",
    cta: "Quero Investir",
    href: "#contact",
    accent: "amber",
  },
]

function ConnectCard({
  path,
  index,
}: {
  path: (typeof connectPaths)[0]
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const isInvestor = path.accent === "amber"
  const Icon = path.icon

  return (
    <motion.a
      ref={ref}
      href={path.href}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.09, ease: "easeOut" }}
      className={`
        group relative flex flex-col p-8 rounded-sm border
        transition-all duration-400 overflow-hidden
        ${isInvestor
          ? "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-400/40 hover:bg-amber-500/[0.06]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
        }
      `}
    >
      {/* Orb de cor suave */}
      <div className={`
        absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
        ${isInvestor ? "bg-amber-500/10" : "bg-cyan-500/8"}
      `} />

      {/* Ícone */}
      <div className={`
        mb-6 w-10 h-10 flex items-center justify-center rounded-sm
        transition-colors duration-300
        ${isInvestor
          ? "text-amber-400/60 group-hover:text-amber-400"
          : "text-cyan-400/50 group-hover:text-cyan-400"
        }
      `}>
        <Icon size={22} strokeWidth={1.5} />
      </div>

      {/* Título */}
      <h3 className="text-lg md:text-xl font-bold text-white mb-3 leading-snug">
        {path.title}
      </h3>

      {/* Descrição */}
      <p className="text-sm text-white/45 leading-relaxed mb-8 flex-grow">
        {path.description}
      </p>

      {/* CTA */}
      <div className={`
        flex items-center gap-2 text-sm font-medium
        transition-all duration-300
        ${isInvestor
          ? "text-amber-400/70 group-hover:text-amber-400"
          : "text-white/40 group-hover:text-cyan-400"
        }
      `}>
        <span>{path.cta}</span>
        <motion.span
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          →
        </motion.span>
      </div>
    </motion.a>
  )
}

export function Connect() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section id="connect" className="relative py-24 md:py-32 bg-black">

      {/* Orb decorativo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8">

        {/* Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 md:mb-16"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-medium">
            FAÇA PARTE
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-white leading-tight max-w-2xl">
            Como você quer se conectar à Proxy?
          </h2>
          <p className="mt-4 text-base text-white/40 max-w-xl leading-relaxed">
            Seja como parceiro, cliente, co-fundador ou investidor —
            há um caminho para você aqui.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-12">
          {connectPaths.map((path, index) => (
            <ConnectCard key={path.id} path={path} index={index} />
          ))}
        </div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="mailto:contato@proxytechnology.com.br"
            className="group inline-flex items-center gap-3 px-8 py-4 border border-white/15
              bg-white/[0.02] hover:border-cyan-400/40 hover:bg-white/[0.04]
              transition-all duration-300 rounded-sm text-white font-medium text-sm"
          >
            Agende uma conversa
            <span className="text-cyan-400 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
          <p className="text-xs text-white/25">
            Respondemos em até 24 horas úteis
          </p>
        </motion.div>

      </div>
    </section>
  )
}