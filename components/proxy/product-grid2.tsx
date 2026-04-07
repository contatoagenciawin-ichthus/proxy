"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface Product {
  name: string
  category: string
  description: string
  status: "live" | "coming-soon"
  releaseDate?: string
  url?: string
  gradient: string
  isHero?: boolean
  isLaunch?: boolean
}

const products: Product[] = [
  {
    name: "ScribMed",
    category: "HEALTHCARE AI",
    description:
      "O médico ouve o paciente. A IA cuida da documentação. Mais presença, menos burocracia.",
    status: "live",
    url: "https://scribmed.app",
    gradient: "from-sky-950/40 via-black to-black",
    isHero: true,
  },
  {
    name: "FalaAI",
    category: "SALES COPILOT",
    description:
      "Seu copiloto de vendas. Ouve, analisa e sugere o próximo passo certo na hora certa.",
    status: "coming-soon",
    releaseDate: "MAR/2026",
    gradient: "from-amber-950/25 via-black to-black",
    isLaunch: true,
  },
  {
    name: "StudioVox",
    category: "VOICE SYNTHESIS",
    description:
      "Transforme texto em voz humana. Ideal para audiobooks, treinamentos e qualquer conteúdo que precisa ser ouvido.",
    status: "live",
    url: "https://studiovox.app",
    gradient: "from-violet-950/30 via-black to-black",
  },
  {
    name: "ScribPsi",
    category: "MENTAL HEALTH AI",
    description:
      "Para terapeutas que querem estar presentes na sessão — não digitando notas.",
    status: "coming-soon",
    releaseDate: "ABR/2026",
    gradient: "from-rose-950/25 via-black to-black",
  },
  {
    name: "Redakt",
    category: "AI WRITING",
    description:
      "Escreva um livro completo em horas, não meses. Formatado para e-pub e gráfica.",
    status: "coming-soon",
    releaseDate: "JUN/2026",
    gradient: "from-orange-950/25 via-black to-black",
  },
  {
    name: "Redakt Pró",
    category: "ENTERPRISE CONTENT",
    description:
      "Produção de conteúdo corporativo em escala — manuais, normas e treinamentos com IA.",
    status: "coming-soon",
    releaseDate: "AGO/2026",
    gradient: "from-red-950/20 via-black to-black",
  },
  {
    name: "Bukool",
    category: "AUDIOBOOK APP",
    description:
      "Seu app de audiobooks e resumos. O Spotify dos livros, feito para quem não tem tempo mas não quer parar de aprender.",
    status: "coming-soon",
    releaseDate: "SET/2026",
    gradient: "from-amber-900/20 via-amber-950/10 to-black",
  },
]

function ProductCard({
  product,
  size = "medium",
  className = "",
}: {
  product: Product
  size?: "hero" | "large" | "medium" | "small"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const isLive = product.status === "live"
  const isBukool = product.name === "Bukool"
  const isHero = product.isHero
  const isLaunch = product.isLaunch

  const sizeClasses = {
    hero: "min-h-[380px] md:min-h-[460px]",
    large: "min-h-[280px] md:min-h-[340px]",
    medium: "min-h-[240px] md:min-h-[280px]",
    small: "min-h-[200px] md:min-h-[240px]",
  }

  const titleSizes = {
    hero: "text-4xl md:text-6xl",
    large: "text-2xl md:text-4xl",
    medium: "text-xl md:text-2xl",
    small: "text-lg md:text-xl",
  }

  const CardWrapper = isLive ? motion.a : motion.div

  return (
    <CardWrapper
      ref={ref}
      href={isLive ? product.url : undefined}
      target={isLive ? "_blank" : undefined}
      rel={isLive ? "noopener noreferrer" : undefined}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`
        group relative overflow-hidden rounded-sm border border-white/10
        bg-gradient-to-br ${product.gradient}
        ${sizeClasses[size]}
        ${isLive ? "cursor-pointer" : "cursor-default"}
        ${isBukool ? "bg-gradient-to-br from-amber-900/15 via-amber-950/5 to-black border-amber-500/20" : ""}
        ${isHero ? "border-sky-500/20" : ""}
        ${className}
      `}
    >
      {/* Gradient Orb — maior no hero */}
      <div
        className={`
          absolute rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-40
          ${isHero
            ? "-right-24 -top-24 h-96 w-96 opacity-25 bg-sky-500"
            : isBukool
            ? "-right-20 -top-20 h-64 w-64 opacity-20 bg-amber-500"
            : isLaunch
            ? "-right-20 -top-20 h-64 w-64 opacity-20 bg-amber-400"
            : "-right-20 -top-20 h-64 w-64 opacity-20 bg-cyan-500"
          }
        `}
      />

      {/* Badge: CARRO-CHEFE (hero only) */}
      {isHero && (
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/20 font-medium">
            CARRO-CHEFE
          </span>
        </div>
      )}

      {/* Badge: LANÇAMENTO (FalaAI) */}
      {isLaunch && (
        <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400 font-medium">
            Lançamento
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className={`
          relative z-10 flex h-full flex-col justify-between
          ${isHero ? "p-8 md:p-12 pt-16 md:pt-16" : "p-6 md:p-8"}
        `}
      >
        {/* Top */}
        <div>
          {/* Category Tag */}
          <span
            className={`
              inline-block text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium mb-4
              ${isBukool ? "text-amber-400/80" : isLaunch ? "text-amber-400/80" : "text-cyan-400/80"}
            `}
          >
            {product.category}
          </span>

          {/* Product Name */}
          <h3
            className={`
              ${titleSizes[size]} font-bold text-white leading-tight mb-3
              transition-all duration-300
              group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4
              ${isBukool
                ? "group-hover:decoration-amber-400"
                : isLaunch
                ? "group-hover:decoration-amber-400"
                : "group-hover:decoration-cyan-400"
              }
            `}
          >
            {product.name}
          </h3>

          {/* Description */}
          <p
            className={`
              text-white/55 leading-relaxed
              ${isHero ? "text-base md:text-lg max-w-lg" : "text-sm md:text-[15px] max-w-md"}
            `}
          >
            {product.description}
          </p>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between mt-6">
          {/* Status */}
          {isLive ? (
            <span className="flex items-center gap-2 text-xs text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Disponível
            </span>
          ) : (
            <span
              className={`text-xs ${
                isBukool || isLaunch ? "text-amber-400/70" : "text-cyan-400/60"
              }`}
            >
              Em breve — {product.releaseDate}
            </span>
          )}

          {/* CTA */}
          <span
            className={`
              text-xs font-medium transition-all duration-300
              opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0
              ${isLive
                ? isBukool ? "text-amber-400" : "text-cyan-400"
                : isLaunch ? "text-amber-400/60" : "text-white/40"
              }
            `}
          >
            {isLive ? "Conheça →" : "Em breve"}
          </span>
        </div>
      </div>

      {/* Hover Overlay */}
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
          bg-gradient-to-t from-transparent via-transparent
          ${isBukool || isLaunch ? "to-amber-500/5" : "to-cyan-500/5"}
        `}
      />
    </CardWrapper>
  )
}

export function ProductGrid2() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" })

  return (
    <section className="relative bg-black py-24 md:py-32">
      {/* Section Header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-7xl px-6 md:px-8 mb-16 md:mb-20"
      >
        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-cyan-400/80 font-medium">
          OUR ECOSYSTEM
        </span>
        <h2 className="mt-4 text-4xl md:text-[56px] font-bold text-white leading-[1.1]">
          Soluções que resolvem<br />problemas reais.
        </h2>
        <p className="mt-5 text-base md:text-lg text-white/50 max-w-xl leading-relaxed">
          Cada produto nasceu de uma dor específica. Cada um foi construído
          para devolver tempo, clareza e resultado para quem usa.
        </p>
      </motion.div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-6 md:px-8 space-y-4 md:space-y-6">

        {/* Row 1 — ScribMed: full-width hero */}
        <ProductCard product={products[0]} size="hero" />

        {/* Row 2 — FalaAI + StudioVox: 50/50 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <ProductCard product={products[1]} size="large" />
          <ProductCard product={products[2]} size="large" />
        </div>

        {/* Row 3 — ScribPsi + Redakt + Redakt Pró: três colunas iguais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <ProductCard product={products[3]} size="medium" />
          <ProductCard product={products[4]} size="medium" />
          <ProductCard product={products[5]} size="medium" />
        </div>

        {/* Row 4 — Bukool: full-width, tom quente */}
        <ProductCard product={products[6]} size="hero" />

      </div>
    </section>
  )
}