"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Linkedin, Instagram } from "lucide-react"

const footerLinks = {
  solucoes: [
    { label: "ScribMed", href: "https://scribmed.app" },
    { label: "StudioVox", href: "https://studiovox.app" },
    { label: "ScribPsi", href: "#" },
    { label: "FalaAI", href: "#" },
    { label: "Redakt", href: "#" },
    { label: "Bukool", href: "#" },
  ],
  grupo: [
    { label: "Ichthus Marketing", href: "https://ichthusmkt.com.br" },
    { label: "Editora Ichthus", href: "https://editoraichthus.com.br" },
  ],
  empresa: [
    { label: "Manifesto", href: "#manifesto" },
    { label: "Parceiros", href: "#connect" },
    { label: "Roadmap", href: "#roadmap" },
    { label: "Contato", href: "mailto:contato@proxytechnology.com.br" },
  ],
}

export function Footer() {
  return (
    <footer className="relative pt-24 pb-8 px-6 overflow-hidden bg-black border-t border-white/[0.06]">

      {/* PROXY em tipografia gigante — decorativo, suave */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden pb-4">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="text-[22vw] font-bold tracking-tighter text-white/[0.025] select-none leading-none"
        >
          PROXY
        </motion.span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Conteúdo principal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16"
        >
          {/* Marca */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5 group w-fit">
              <div className="h-7 w-7 border border-cyan-400/40 flex items-center justify-center
                group-hover:border-cyan-400/70 transition-colors duration-300">
                <div className="h-3.5 w-3.5 bg-cyan-400" />
              </div>
              <span className="text-lg font-bold tracking-tight">PROXY</span>
            </Link>

            <p className="text-sm text-white/35 max-w-xs mb-6 leading-relaxed">
              Um ecossistema de soluções com IA que colocam o ser humano no centro
              — e a tecnologia a serviço do que realmente importa.
            </p>

            {/* Redes sociais */}
            <div className="flex gap-3">
              {[
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Instagram, href: "#", label: "Instagram" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 border border-white/10 flex items-center justify-center
                    text-white/30 hover:text-cyan-400 hover:border-cyan-400/40
                    transition-all duration-300 rounded-sm"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Soluções */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-4">
              Soluções
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.solucoes.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-white/35 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Grupo */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-4">
              Grupo
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.grupo.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/35 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/35 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Rodapé */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row
            items-center justify-between gap-4"
        >
          <p className="text-xs text-white/20">
            © 2026 Proxy Technology. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-white/20 hover:text-white/50 transition-colors">
              Privacidade
            </a>
            <a href="#" className="text-xs text-white/20 hover:text-white/50 transition-colors">
              Termos de uso
            </a>
          </div>
        </motion.div>

      </div>
    </footer>
  )
}