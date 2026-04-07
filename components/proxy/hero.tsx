"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ChevronDown } from "lucide-react"

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  return (
    <section ref={ref} className="relative h-screen overflow-hidden">
      {/* Video Background */}
      <motion.div style={{ scale, opacity }} className="absolute inset-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        {/* Video Placeholder - simulating muted video effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black">
          {/* Animated encoding effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
                style={{ top: `${i * 5}%` }}
                animate={{
                  x: ["-100%", "100%"],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "linear",
                }}
              />
            ))}
          </div>
          {/* Grid overlay */}
          <div className="absolute inset-0 tech-grid opacity-50" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-6">
        <motion.div
          style={{ y }}
          className="max-w-5xl text-center"
        >
          {/* Technical Label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-8 inline-flex items-center gap-3 border border-white/10 px-4 py-2"
          >
            <span className="h-2 w-2 bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              System Active — v2.0.26
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6"
          >
            <span className="block text-white">ENGINEERING THE</span>
            <span className="block text-cyan-400">PROXY LAYER</span>
            <span className="block text-white">FOR GLOBAL INNOVATION</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="font-mono text-sm text-white/40 max-w-2xl mx-auto mb-12"
          >
            Desenvolvendo soluções de IA de ponta para Healthcare, Creative Industries e Conversational Intelligence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button className="group relative overflow-hidden border border-cyan-400 bg-cyan-400 px-8 py-3 font-mono text-xs uppercase tracking-widest text-black transition-all hover:bg-transparent hover:text-cyan-400">
              <span className="relative z-10">Explorar Ecossistema</span>
            </button>
            <button className="border border-white/20 px-8 py-3 font-mono text-xs uppercase tracking-widest text-white/80 transition-all hover:border-cyan-400 hover:text-cyan-400">
              Ver Roadmap
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="h-5 w-5 text-white/30" />
          </motion.div>
        </motion.div>
      </div>

      {/* Corner Technical Details */}
      <div className="absolute bottom-8 left-8 z-20 hidden lg:block">
        <div className="font-mono text-[10px] text-white/30 space-y-1">
          <p>LAT: -23.5505</p>
          <p>LONG: -46.6333</p>
          <p>NODE: BR-SP-01</p>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-20 hidden lg:block">
        <div className="font-mono text-[10px] text-white/30 text-right space-y-1">
          <p>ENCODING: H.265</p>
          <p>BITRATE: 4K/60</p>
          <p>STATUS: STREAMING</p>
        </div>
      </div>
    </section>
  )
}
