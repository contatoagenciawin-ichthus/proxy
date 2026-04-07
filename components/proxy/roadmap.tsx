"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const releases = [
  {
    date: "Março 2026",
    product: "FalaAI",
    description:
      "Copiloto de vendas e atendimento. Ouve conversas, analisa o momento e sugere o próximo passo certo — em tempo real.",
    status: "launch",
    category: "Sales Copilot",
  },
  {
    date: "Abril 2026",
    product: "ScribPsi",
    description:
      "Para terapeutas que querem estar presentes na sessão — não digitando notas. Transcrição e suporte documental com IA.",
    status: "upcoming",
    category: "Mental Health AI",
  },
  {
    date: "Junho 2026",
    product: "Redakt",
    description:
      "Escreva um livro completo em horas, não meses. Entregue formatado para e-pub e gráfica, pronto para publicar.",
    status: "planned",
    category: "AI Writing",
  },
  {
    date: "Agosto 2026",
    product: "Redakt Pró",
    description:
      "Produção de conteúdo corporativo em escala — manuais, normas técnicas e treinamentos com IA.",
    status: "planned",
    category: "Enterprise Content",
  },
  {
    date: "Setembro 2026",
    product: "Bukool",
    description:
      "O Spotify dos livros. Audiobooks e resumos inteligentes para quem quer continuar aprendendo sem parar o dia.",
    status: "roadmap",
    category: "Audiobook App",
  },
]

const statusLabel: Record<string, { label: string; color: string }> = {
  launch:   { label: "Lançamento",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  upcoming: { label: "Em breve",     color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  planned:  { label: "Planejado",    color: "text-white/40 bg-white/[0.04] border-white/10" },
  roadmap:  { label: "No horizonte", color: "text-amber-400/70 bg-amber-400/[0.07] border-amber-400/15" },
}

function RoadmapItem({ item, index }: { item: typeof releases[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const { label, color } = statusLabel[item.status]
  const isLaunch = item.status === "launch"

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
      className="relative grid grid-cols-[1px_1fr] md:grid-cols-[180px_1px_1fr] gap-x-8 items-start"
    >
      {/* Data — visível só em desktop */}
      <div className="hidden md:flex flex-col items-end pt-1 pr-2">
        <span className="text-sm font-medium text-white/30">{item.date}</span>
      </div>

      {/* Linha vertical + nó */}
      <div className="flex flex-col items-center">
        <div className={`
          w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border
          ${isLaunch
            ? "bg-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
            : "bg-black border-white/20"
          }
        `} />
        {index < releases.length - 1 && (
          <div className="w-px flex-1 min-h-[80px] bg-white/[0.06] mt-2" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="pb-12 pl-6 md:pl-8">
        {/* Data — visível só em mobile */}
        <p className="md:hidden text-xs text-white/30 mb-2">{item.date}</p>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Status badge */}
          <span className={`text-[10px] uppercase tracking-[0.15em] font-medium px-2.5 py-1 rounded-full border ${color}`}>
            {label}
          </span>
          {/* Category */}
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/20">
            {item.category}
          </span>
        </div>

        <h3 className={`text-2xl md:text-3xl font-bold mb-3 leading-tight ${
          isLaunch ? "text-white" : "text-white/70"
        }`}>
          {item.product}
        </h3>

        <p className="text-sm md:text-[15px] text-white/40 leading-relaxed max-w-lg">
          {item.description}
        </p>
      </div>
    </motion.div>
  )
}

export function Roadmap() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" })

  return (
    <section className="relative py-24 md:py-32 bg-black overflow-hidden">

      {/* Orb decorativo suave */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 md:px-8">

        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-medium">
            O QUE VEM POR AÍ
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-white leading-tight">
            2026 —<br />
            <span className="text-white/35">Um ano de lançamentos.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/35 max-w-md leading-relaxed">
            Cada produto no seu tempo certo. Cada lançamento com propósito.
          </p>
        </motion.div>

        {/* Timeline */}
        <div>
          {releases.map((item, index) => (
            <RoadmapItem key={item.product} item={item} index={index} />
          ))}
        </div>

      </div>
    </section>
  )
}