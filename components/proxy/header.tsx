"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Link from "next/link"

const navLinks = [
  { href: "#ecosystem", label: "Soluções" },
  { href: "#manifesto", label: "Manifesto" },
  { href: "#connect", label: "Parceiros" },
  { href: "#roadmap", label: "Roadmap" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07] bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-7 w-7 border border-cyan-400/40 flex items-center justify-center
            group-hover:border-cyan-400/70 transition-colors duration-300">
            <div className="h-3.5 w-3.5 bg-cyan-400" />
          </div>
          <span className="text-lg font-bold tracking-tight">PROXY</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-widest text-white/50
                hover:text-white transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#connect"
            className="px-5 py-2 text-xs font-medium border border-white/15
              text-white/60 hover:border-cyan-400/50 hover:text-white
              transition-all duration-300 rounded-sm"
          >
            Fale conosco
          </a>
          <a
            href="https://scribmed.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-xs font-medium bg-cyan-500 text-black
              hover:bg-cyan-400 transition-colors duration-300 rounded-sm"
          >
            ScribMed →
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-white/[0.07] bg-black overflow-hidden"
          >
            <nav className="flex flex-col p-6 gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/[0.07] flex flex-col gap-3">
                <a
                  href="#connect"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Fale conosco
                </a>
                <a
                  href="https://scribmed.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ScribMed →
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}