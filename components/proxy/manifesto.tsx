"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const beliefs = [
  "IA não substitui pessoas. IA libera o melhor das pessoas.",
  "Cada solução que construímos tem nome, rosto e propósito.",
  "Do marketing ao audiobook, do consultório ao código — tudo conectado.",
]

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative min-h-screen bg-black overflow-hidden">

      {/* Orb decorativo — suave, orgânico, sem geometria militar */}
      <div className="absolute bottom-[-120px] right-[-120px] w-[600px] h-[600px] rounded-full bg-cyan-500/8 blur-[140px] pointer-events-none" />
      <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[100px] pointer-events-none" />

      {/* Content */}
      <div ref={ref} className="relative z-10 max-w-5xl mx-auto px-6 py-32 lg:py-40">

        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-cyan-400/80 text-[10px] uppercase tracking-[0.3em] font-medium mb-8"
        >
          Nosso Manifesto
        </motion.p>

        {/* Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-12 max-w-4xl"
        >
          Tecnologia que amplifica.
          <br />
          <span className="text-white/50">Pessoas que decidem.</span>
        </motion.h2>

        {/* Body Text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mb-20"
        >
          Vivemos em um momento em que a inteligência artificial deixou de ser promessa
          e se tornou alavanca. Na Proxy Technology, não construímos ferramentas —
          construímos ecossistemas inteligentes que colocam o ser humano no centro
          das decisões, e a tecnologia a serviço do que realmente importa:
          crescimento, conexão e impacto real.
        </motion.p>

        {/* Belief Statements */}
        <div className="space-y-8">
          {beliefs.map((belief, index) => (
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.15 }}
              className="relative pl-6 border-l-2 border-cyan-500/60"
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-white/85 leading-snug">
                "{belief}"
              </p>
            </motion.blockquote>
          ))}
        </div>

        {/* Linha de fechamento — gradiente suave, sem conotação técnica */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: 1 }}
          className="mt-24 h-px bg-gradient-to-r from-cyan-500/30 via-white/10 to-transparent origin-left max-w-xl"
        />
      </div>

      {/* Label lateral — tipografia normal, sem mono */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block">
        <p className="text-[10px] text-white/20 tracking-widest uppercase -rotate-90 whitespace-nowrap">
          Proxy Technology — 2026
        </p>
      </div>

    </section>
  )
}