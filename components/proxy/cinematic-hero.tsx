"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const phrases = [
  "O futuro dos sistemas autônomos.",
  "Tecnologia que amplifica pessoas.",
  "Do consultório ao código — tudo conectado.",
  "Inteligência aplicada à vida real.",
]

export function CinematicHero() {
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-screen overflow-hidden bg-black">

      {/* Vídeo com cor — sem grayscale, overlay leve */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay loop muted playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/proxy.mp4" type="video/mp4" />
        </video>

        {/* Overlay gradiente — escurece bordas, preserva cor no centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.75)_100%)] z-10" />

        {/* Toque de cor — gradiente cyan/violeta suave sobre o vídeo */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-transparent to-violet-950/20 z-10" />
      </div>

      {/* Conteúdo */}
      <div
        ref={ref}
        className="relative z-20 flex flex-col h-full items-center justify-center px-6 text-center text-white"
      >

        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/70 font-medium mb-8"
        >
          Proxy Technology
        </motion.p>

        {/* Headline animada */}
        <div className="min-h-[160px] md:min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentPhrase}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl"
            >
              {phrases[currentPhrase]}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Subtítulo fixo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-base md:text-lg text-white/45 max-w-xl leading-relaxed"
        >
          Um ecossistema de soluções com IA que colocam o ser humano
          no centro — e a tecnologia a serviço do que realmente importa.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="#ecosystem"
            className="px-8 py-3.5 bg-cyan-500 text-black text-sm font-semibold rounded-sm hover:bg-cyan-400 transition-colors duration-300"
          >
            Conheça o ecossistema
          </a>
          <a
            href="#connect"
            className="px-8 py-3.5 border border-white/20 text-white/70 text-sm font-medium rounded-sm hover:border-white/40 hover:text-white transition-all duration-300"
          >
            Fale conosco
          </a>
        </motion.div>

        {/* Indicador de frase — dots */}
        <div className="mt-16 flex items-center gap-2">
          {phrases.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhrase(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentPhrase
                  ? "w-5 h-1.5 bg-cyan-400"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

      </div>

      {/* Rodapé discreto — só copyright, sem coordenadas */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
        <p className="text-[10px] text-white/20 tracking-widest uppercase">
          © 2026 Proxy Technology
        </p>
      </div>

    </section>
  )
}