"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface GroupCompany {
  name: string
  category: string
  description: string
  url: string
  detail: string
}

const companies: GroupCompany[] = [
  {
    name: "Ichthus Marketing",
    category: "DIGITAL GROWTH",
    description:
      "Gestão completa de marketing digital — tráfego pago, redes sociais, sites, infoprodutos e funis de venda.",
    detail: "O braço de crescimento do grupo. Atende marcas que querem resultados concretos no digital.",
    url: "https://ichthusmkt.com.br",
  },
  {
    name: "Editora Ichthus",
    category: "PUBLISHING",
    description:
      "Editora e livraria com vendas diretas e na Amazon. Publica coletâneas, autores independentes e livros institucionais.",
    detail: "De onde veio a Proxy. A editora que transformou conteúdo em negócio — e continua crescendo.",
    url: "https://editoraichthus.com.br",
  },
]

export function Group() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="relative bg-[#0f0f0f] py-16 md:py-20 border-y border-white/[0.06]">
      <div
        ref={ref}
        className="mx-auto max-w-7xl px-6 md:px-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-12"
        >
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-medium">
              GRUPO PROXY
            </span>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-tight">
              Serviços que complementam<br className="hidden md:block" /> o ecossistema.
            </h2>
          </div>
          <p className="text-sm text-white/35 max-w-xs leading-relaxed md:text-right">
            Empresas consolidadas que operam junto às soluções de IA da Proxy.
          </p>
        </motion.div>

        {/* Horizontal Line of Companies */}
        <div className="flex flex-col md:flex-row gap-px bg-white/[0.06] rounded-sm overflow-hidden">
          {companies.map((company, index) => (
            <motion.a
              key={company.name}
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="
                group relative flex-1 bg-[#0f0f0f] p-7 md:p-8
                hover:bg-white/[0.03] transition-colors duration-300
                cursor-pointer
              "
            >
              {/* Top row: category + arrow */}
              <div className="flex items-start justify-between mb-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-medium">
                  {company.category}
                </span>
                <span className="
                  text-white/20 text-sm transition-all duration-300
                  group-hover:text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                ">
                  ↗
                </span>
              </div>

              {/* Name */}
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight
                group-hover:underline decoration-white/20 decoration-1 underline-offset-4
                transition-all duration-300"
              >
                {company.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/45 leading-relaxed mb-4">
                {company.description}
              </p>

              {/* Detail — subtle, appears more on hover */}
              <p className="text-xs text-white/25 leading-relaxed
                transition-all duration-300 group-hover:text-white/40"
              >
                {company.detail}
              </p>

              {/* Bottom: live indicator */}
              <div className="flex items-center gap-2 mt-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400/70">Disponível</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}