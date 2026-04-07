"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

interface Product {
  id: string
  name: string
  command: string
  category: string
  description: string
  href?: string
  isLive: boolean
  releaseDate?: string
  version: string
  status: string
  metrics?: {
    uptime?: string
    latency?: string
    requests?: string
  }
}

const products: Product[] = [
  {
    id: "ichthus-marketing",
    name: "Ichthus Marketing",
    command: "proxy init --service=ichthus-mkt",
    category: "MARKETING",
    description: "Gestão de Marketing Digital com análise preditiva e automação de campanhas.",
    href: "https://ichthusmkt.com.br",
    isLive: true,
    version: "v2.4.1",
    status: "OPERATIONAL",
    metrics: { uptime: "99.9%", latency: "45ms", requests: "1.2M/day" },
  },
  {
    id: "editora-ichthus",
    name: "Editora Ichthus",
    command: "proxy init --service=editora",
    category: "PUBLISHING",
    description: "Editora & Livraria com sistema integrado de e-commerce e gestão editorial.",
    href: "https://editoraichthus.com.br",
    isLive: true,
    version: "v3.1.0",
    status: "OPERATIONAL",
    metrics: { uptime: "99.8%", latency: "52ms", requests: "450K/day" },
  },
  {
    id: "scribmed",
    name: "ScribMed",
    command: "proxy init --service=scribmed --ai=true",
    category: "HEALTHCARE AI",
    description: "SaaS IA para transcrição e documentação de consultas médicas em tempo real.",
    href: "https://scribmed.app",
    isLive: true,
    version: "v1.8.3",
    status: "OPERATIONAL",
    metrics: { uptime: "99.95%", latency: "120ms", requests: "890K/day" },
  },
  {
    id: "studiovox",
    name: "StudioVox",
    command: "proxy init --service=studiovox --ai=audio",
    category: "AUDIO AI",
    description: "Geração de áudio com IA: vozes, música e efeitos sonoros de alta fidelidade.",
    href: "https://studiovox.app",
    isLive: true,
    version: "v2.0.0",
    status: "OPERATIONAL",
    metrics: { uptime: "99.7%", latency: "200ms", requests: "320K/day" },
  },
  {
    id: "scribpsi",
    name: "ScribPsi",
    command: "proxy init --service=scribpsi --ai=true",
    category: "HEALTHCARE AI",
    description: "SaaS IA especializado em documentação de sessões terapêuticas e psicológicas.",
    isLive: false,
    releaseDate: "ABR/2026",
    version: "v0.9.2-beta",
    status: "IN_DEVELOPMENT",
  },
  {
    id: "falaai",
    name: "FalaAI",
    command: "proxy init --service=falaai --ai=sales",
    category: "SALES AI",
    description: "Copiloto de vendas com IA: análise de calls, coaching e automação de follow-ups.",
    isLive: false,
    releaseDate: "MAR/2026",
    version: "v0.8.0-alpha",
    status: "IN_DEVELOPMENT",
  },
  {
    id: "redakt",
    name: "Redakt",
    command: "proxy init --service=redakt --ai=writing",
    category: "WRITING AI",
    description: "Plataforma de escrita assistida por IA para criação de livros e conteúdo longo.",
    isLive: false,
    releaseDate: "MAI/2026",
    version: "v0.7.1-alpha",
    status: "IN_DEVELOPMENT",
  },
  {
    id: "redakt-pro",
    name: "Redakt Pro",
    command: "proxy init --service=redakt-pro --enterprise",
    category: "ENTERPRISE",
    description: "Versão enterprise do Redakt para equipes e produção de conteúdo corporativo.",
    isLive: false,
    releaseDate: "JUL/2026",
    version: "v0.3.0-dev",
    status: "PLANNING",
  },
  {
    id: "bukool",
    name: "Bukool",
    command: "proxy init --service=bukool --mobile",
    category: "AUDIO APP",
    description: "Aplicativo de audiobooks e resumos de livros com narração por IA.",
    isLive: false,
    releaseDate: "SET/2026",
    version: "v0.5.0-beta",
    status: "IN_DEVELOPMENT",
  },
]

function TerminalCard({ product, index }: { product: Product; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const handleHover = (hovering: boolean) => {
    if (hovering) {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 800)
    }
    setIsExpanded(hovering)
  }

  const statusColor = product.isLive 
    ? "text-emerald-400" 
    : product.status === "PLANNING" 
      ? "text-amber-400" 
      : "text-cyan-400"

  const statusBg = product.isLive 
    ? "bg-emerald-400/10 border-emerald-400/30" 
    : product.status === "PLANNING" 
      ? "bg-amber-400/10 border-amber-400/30" 
      : "bg-cyan-400/10 border-cyan-400/30"

  const CardElement = product.isLive ? motion.a : motion.div

  return (
    <CardElement
      href={product.isLive ? product.href : undefined}
      target={product.isLive ? "_blank" : undefined}
      rel={product.isLive ? "noopener noreferrer" : undefined}
      className={`
        relative bg-[#0c0c0c] border border-white/[0.06] rounded-sm overflow-hidden
        ${product.isLive ? "cursor-pointer" : "cursor-default"}
        group
      `}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      onHoverStart={() => handleHover(true)}
      onHoverEnd={() => handleHover(false)}
    >
      {/* Scanline Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 2px,
            rgba(0, 255, 255, 0.03) 4px
          )`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {/* Terminal Dots */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[10px] font-mono text-white/30 ml-2">
            {product.id}.proxy.sh
          </span>
        </div>
        
        {/* Status Badge */}
        <div className={`px-2 py-0.5 rounded-sm border text-[9px] font-mono tracking-wider ${statusBg} ${statusColor}`}>
          {product.status}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono">
        {/* Category & Version Line */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-cyan-400/70 tracking-[0.2em]">
            [{product.category}]
          </span>
          <span className="text-[10px] text-white/30">
            {product.version}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
          {product.name}
        </h3>

        {/* Command Line */}
        <div className="flex items-center gap-2 mb-3 bg-black/50 rounded-sm px-3 py-2 border border-white/[0.04]">
          <span className="text-emerald-400 text-xs">$</span>
          <span className="text-white/60 text-xs overflow-hidden">
            {isTyping ? (
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                className="inline-block overflow-hidden whitespace-nowrap"
              >
                {product.command}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-cyan-400"
                >
                  _
                </motion.span>
              </motion.span>
            ) : (
              <span className="text-white/40">{product.command}</span>
            )}
          </span>
        </div>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Description */}
              <div className="border-l-2 border-cyan-500/30 pl-3 mb-4">
                <p className="text-xs text-white/50 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Metrics (for live products) */}
              {product.isLive && product.metrics && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm p-2 text-center">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Uptime</div>
                    <div className="text-xs text-emerald-400 font-medium">{product.metrics.uptime}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm p-2 text-center">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Latency</div>
                    <div className="text-xs text-cyan-400 font-medium">{product.metrics.latency}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm p-2 text-center">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Requests</div>
                    <div className="text-xs text-white/60 font-medium">{product.metrics.requests}</div>
                  </div>
                </div>
              )}

              {/* Release Date (for coming soon) */}
              {!product.isLive && product.releaseDate && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/30">Expected Release:</span>
                  <span className="text-cyan-400 font-medium">{product.releaseDate}</span>
                </div>
              )}

              {/* CTA for live products */}
              {product.isLive && (
                <div className="flex items-center gap-2 mt-3 text-xs text-cyan-400">
                  <span>Access Service</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Indicator Pulse */}
      {product.isLive && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
        </div>
      )}

      {/* Hover Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-sm pointer-events-none"
        animate={{
          boxShadow: isExpanded
            ? "inset 0 0 0 1px rgba(34, 211, 238, 0.2), 0 0 20px rgba(34, 211, 238, 0.05)"
            : "inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
        }}
        transition={{ duration: 0.3 }}
      />
    </CardElement>
  )
}

export function ProductGrid() {
  return (
    <section className="relative py-32 bg-black">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Section Header */}
      <div className="relative max-w-6xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Terminal Style Header */}
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <span className="text-emerald-400 text-sm font-mono">$</span>
            <span className="text-white/60 font-mono text-sm">proxy list --all</span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-cyan-400 font-mono"
            >
              _
            </motion.span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Product <span className="text-cyan-400">Ecosystem</span>
          </h2>

          <p className="text-white/40 font-mono text-sm max-w-xl mx-auto">
            // Unified platform of AI-powered solutions transforming industries
          </p>
        </motion.div>
      </div>

      {/* Products Grid */}
      <div className="relative max-w-6xl mx-auto px-6">
        {/* Featured Product */}
        <div className="mb-4">
          <TerminalCard product={products[0]} index={0} />
        </div>

        {/* Main Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.slice(1).map((product, index) => (
            <TerminalCard key={product.id} product={product} index={index + 1} />
          ))}
        </div>
      </div>

      {/* Bottom System Info */}
      <div className="relative max-w-6xl mx-auto px-6 mt-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-8 text-[10px] font-mono text-white/20"
        >
          <span>SERVICES: {products.length}</span>
          <span className="w-px h-3 bg-white/10" />
          <span>LIVE: {products.filter(p => p.isLive).length}</span>
          <span className="w-px h-3 bg-white/10" />
          <span>IN_DEV: {products.filter(p => !p.isLive).length}</span>
          <span className="w-px h-3 bg-white/10" />
          <span>STATUS: <span className="text-emerald-400">ALL_SYSTEMS_GO</span></span>
        </motion.div>
      </div>
    </section>
  )
}
