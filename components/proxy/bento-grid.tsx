"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Heart, Mic, BookOpen, Headphones } from "lucide-react"

const ecosystemItems = [
  {
    id: "healthcare",
    title: "Saúde com mais presença",
    subtitle: "ScribMed & ScribPsi",
    description:
      "Médicos e terapeutas que usam nossas ferramentas passam menos tempo digitando e mais tempo com quem importa — o paciente.",
    icon: Heart,
    className: "md:col-span-2 md:row-span-2",
    accent: "from-sky-500/10 to-transparent",
    orb: "bg-sky-500",
    iconColor: "text-sky-400",
    tag: "Healthcare AI",
  },
  {
    id: "creative",
    title: "Conteúdo que escala",
    subtitle: "Redakt & StudioVox",
    description:
      "Escreva livros, produza áudios e crie treinamentos com IA — sem abrir mão da sua voz e do seu estilo.",
    icon: BookOpen,
    className: "md:col-span-1 md:row-span-2",
    accent: "from-violet-500/10 to-transparent",
    orb: "bg-violet-500",
    iconColor: "text-violet-400",
    tag: "Creative AI",
  },
  {
    id: "conversational",
    title: "Vendas mais inteligentes",
    subtitle: "FalaAI",
    description:
      "Um copiloto que ouve suas conversas de venda, analisa o momento e sugere o próximo passo certo.",
    icon: Mic,
    className: "md:col-span-2 md:row-span-1",
    accent: "from-amber-500/10 to-transparent",
    orb: "bg-amber-500",
    iconColor: "text-amber-400",
    tag: "Sales Copilot",
  },
  {
    id: "publishing",
    title: "O Spotify dos livros",
    subtitle: "Bukool — Set/2026",
    description:
      "Audiobooks e resumos inteligentes para quem quer continuar aprendendo sem parar o dia.",
    icon: Headphones,
    className: "md:col-span-1 md:row-span-1",
    accent: "from-amber-900/20 to-transparent",
    orb: "bg-amber-400",
    iconColor: "text-amber-300",
    tag: "Audiobook App",
  },
]

function BentoCard({ item, index }: { item: typeof ecosystemItems[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })
  const Icon = item.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
      className={`
        group relative overflow-hidden rounded-sm
        border border-white/[0.07] bg-[#0c0c0c]
        hover:border-white/[0.14] transition-colors duration-500
        ${item.className}
      `}
    >
      {/* Orb de cor — sutil, aparece mais no hover */}
      <div
        className={`
          absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl
          opacity-10 group-hover:opacity-20 transition-opacity duration-700
          ${item.orb}
        `}
      />

      {/* Gradiente direcional suave */}
      <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-60`} />

      {/* Conteúdo */}
      <div className="relative z-10 h-full flex flex-col justify-between p-7 md:p-8">
        <div>
          {/* Tag + Ícone */}
          <div className="flex items-start justify-between mb-6">
            <span className={`
              text-[10px] uppercase tracking-[0.2em] font-medium
              ${item.iconColor} opacity-70
            `}>
              {item.tag}
            </span>
            <div className={`${item.iconColor} opacity-50 group-hover:opacity-80 transition-opacity duration-300`}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl md:text-2xl font-bold text-white leading-snug mb-2">
            {item.title}
          </h3>

          {/* Subtitle — produtos */}
          <p className={`text-xs font-medium mb-4 ${item.iconColor} opacity-60`}>
            {item.subtitle}
          </p>

          {/* Descrição */}
          <p className="text-sm text-white/45 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Rodapé — seta discreta que aparece no hover */}
        <div className="mt-8 flex items-center justify-end">
          <span className={`
            text-xs transition-all duration-300
            opacity-0 translate-x-1 group-hover:opacity-60 group-hover:translate-x-0
            ${item.iconColor}
          `}>
            Saiba mais →
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function BentoGrid() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" })

  return (
    <section className="relative py-24 md:py-32 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 md:mb-16"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-medium">
            VISÃO GERAL
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-white leading-tight">
            Quatro frentes.<br />
            <span className="text-white/40">Um ecossistema.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/40 max-w-lg leading-relaxed">
            Nossas soluções cobrem saúde, criação, vendas e aprendizado —
            cada uma independente, todas conectadas.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {ecosystemItems.map((item, index) => (
            <BentoCard key={item.id} item={item} index={index} />
          ))}
        </div>

      </div>
    </section>
  )
}