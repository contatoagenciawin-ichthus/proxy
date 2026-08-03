"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  ChevronRight,
  FileSearch,
  Layers3,
  Linkedin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"

const navigation = [
  { label: "O que fazemos", href: "#capacidades" },
  { label: "Como trabalhamos", href: "#modelo" },
  { label: "Trabalho real", href: "#portfolio" },
  { label: "Em desenvolvimento", href: "#desenvolvimento" },
  { label: "Ecossistema", href: "#ecossistema" },
]

const whatsappUrl = "https://wa.me/5519998056642?text=Ol%C3%A1%2C%20Marcos.%20Vim%20pelo%20site%20da%20Proxy%20Labs%20e%20gostaria%20de%20conversar%20sobre%20um%20projeto."

const capabilities = [
  {
    icon: BrainCircuit,
    title: "IA aplicada",
    text: "Inteligência artificial incorporada a fluxos reais, com contexto, validação humana e responsabilidade.",
  },
  {
    icon: MessageCircle,
    title: "Sistemas conversacionais",
    text: "Atendimento que reconhece pessoas, preserva histórico e transforma conversas em próximos passos.",
  },
  {
    icon: Layers3,
    title: "Operação sob medida",
    text: "Plataformas, painéis e automações desenhados para a rotina de cada negócio — não o contrário.",
  },
  {
    icon: ShieldCheck,
    title: "Decisão assistida",
    text: "Tecnologia que organiza evidências e pontos de atenção, mantendo o profissional no controle.",
  },
]

const work = [
  {
    eyebrow: "PRODUTO PRÓPRIO · EM OPERAÇÃO",
    name: "ScribMed",
    description:
      "Assistente clínico que transforma a conversa da consulta em documentação organizada, devolvendo presença ao médico.",
    detail: "IA clínica · documentação · organização de consulta",
    href: "https://scribmed.app",
    featured: true,
  },
  {
    eyebrow: "SISTEMA OPERACIONAL · EM OPERAÇÃO",
    name: "Creative Hub",
    description:
      "Central de solicitações, materiais e entregas criada para organizar a operação criativa de mentorados e equipe.",
    detail: "Fluxos · arquivos · gestão de demandas",
    href: "https://hub.ichthusmkt.com.br",
  },
  {
    eyebrow: "PLATAFORMA EDITORIAL · ENTREGUE",
    name: "Eduardo Brasil",
    description:
      "Estúdio editorial, aquisição de contatos, newsletter e painel próprio reunidos em uma operação integrada.",
    detail: "Sanity · Brevo · dashboard · automação",
  },
  {
    eyebrow: "INFRAESTRUTURA DIGITAL",
    name: "Sistemas que sustentam crescimento",
    description:
      "Sites, landing pages, funis, painéis e integrações construídos para projetos reais do ecossistema Ichthus.",
    detail: "Produto digital · integrações · dados",
  },
]

const veterinary = [
  {
    name: "Peludinhos",
    status: "Projeto contratado · em definição",
    description:
      "Atendimento pelo WhatsApp com memória de tutor e pet, identificação de prioridades e apoio ao agendamento.",
    features: ["Memória de relacionamento", "Triagem operacional", "Agenda integrada"],
    icon: CalendarCheck,
  },
  {
    name: "Pet Endoscopia",
    status: "Projeto em desenvolvimento",
    description:
      "Uma evolução da mesma base para apoiar o veterinário na consulta, organizar exames, sinalizar pontos de atenção e preservar o histórico documental.",
    features: ["Organização de exames", "Apoio à leitura profissional", "Arquivo e rastreabilidade"],
    icon: FileSearch,
  },
]

function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center border border-cyan-300/40 bg-cyan-300/[0.04]">
        <span className="h-3.5 w-3.5 bg-cyan-300" />
      </span>
      <span className="text-sm font-semibold tracking-[0.18em] text-white">
        PROXY <span className="text-white/45">LABS</span>
      </span>
    </span>
  )
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-[#030506] text-white selection:bg-cyan-300 selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#030506]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <a href="#inicio" aria-label="Proxy Labs — início"><BrandMark /></a>
          <nav className="hidden items-center gap-7 md:flex">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="text-xs text-white/45 transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hidden border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-cyan-300/50 hover:text-white md:inline-flex">
            Conversar sobre um projeto
          </a>
          <button className="p-2 text-white/70 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.07] bg-black md:hidden">
              <div className="flex flex-col gap-5 px-6 py-6">
                {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="text-sm text-white/60">{item.label}</a>)}
                <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)} className="text-sm text-cyan-300">Conversar sobre um projeto →</a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section id="inicio" className="relative flex min-h-[92vh] items-center border-b border-white/[0.07] pt-16">
        <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover object-center opacity-45" aria-hidden="true">
          <source src="/proxy.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_45%,rgba(34,211,238,.08),transparent_38%),linear-gradient(90deg,#030506_4%,rgba(3,5,6,.88)_42%,rgba(3,5,6,.38)_76%,rgba(3,5,6,.62)_100%)]" />
        <div className="tech-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto w-full max-w-7xl px-6 py-28 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="max-w-4xl">
            <p className="mb-7 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[.28em] text-cyan-300/75">
              <span className="h-px w-10 bg-cyan-300/60" /> Tecnologia e produtos digitais do ecossistema Ichthus
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-6xl lg:text-[86px]">
              Sistemas que lembram, organizam e <span className="text-white/40">apoiam decisões.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/52 sm:text-lg">
              Criamos produtos e sistemas sob medida para operações em que contexto, dados e experiência humana precisam trabalhar juntos.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#portfolio" className="inline-flex items-center justify-center gap-2 bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-cyan-200">
                Conheça nosso trabalho <ArrowRight size={16} />
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center border border-white/15 px-6 py-3.5 text-sm text-white/70 transition hover:border-white/35 hover:text-white">
                Traga um problema real
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="capacidades" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="section-label">O QUE CONSTRUÍMOS</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Tecnologia começa no problema, não na ferramenta.</h2>
            <p className="mt-6 max-w-lg leading-7 text-white/45">Entramos na operação, entendemos onde o trabalho trava e construímos a camada tecnológica necessária para fazê-lo avançar.</p>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="bg-[#050809] p-7 transition hover:bg-[#081012] sm:p-8">
                <Icon className="mb-8 text-cyan-300/65" size={22} strokeWidth={1.5} />
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/42">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modelo" className="border-y border-white/[0.07] bg-[#070a0b] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
            <div>
              <p className="section-label">TECNOLOGIA SEM INTERNALIZAR O RISCO</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
                Sua empresa precisa do sistema. Não necessariamente de uma equipe de tecnologia.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-7 text-white/48">
                Desenvolvemos sistemas sob encomenda para empresas que precisam evoluir sua operação sem contratar desenvolvedores, gerir infraestrutura ou assumir sozinhas o risco técnico do projeto.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/36">
                É especialmente útil quando a operação já cresceu, as ferramentas genéricas deixaram de acompanhar o negócio e existe um problema caro demais para continuar sendo resolvido manualmente.
              </p>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-9 inline-flex items-center gap-2 border border-cyan-300/30 px-6 py-3.5 text-sm text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/[0.04]">
                Conte o que está travando sua operação <ArrowRight size={16} />
              </a>
            </div>

            <div className="border border-white/[0.09] bg-black/35">
              <div className="border-b border-white/[0.08] px-7 py-5">
                <p className="text-[10px] uppercase tracking-[.2em] text-white/30">Como construímos</p>
              </div>
              {[
                ["01", "Entendemos o problema", "Mapeamos a operação, as pessoas envolvidas e o custo do processo atual."],
                ["02", "Definimos o caminho", "Organizamos escopo, prioridades, investimento e uma primeira versão realmente utilizável."],
                ["03", "Construímos e validamos", "Desenvolvemos em ciclos curtos, testando o sistema com quem vai utilizá-lo."],
                ["04", "Implantamos e evoluímos", "Acompanhamos a entrada em operação e os próximos avanços do produto."],
              ].map(([number, title, text]) => (
                <article key={number} className="grid grid-cols-[44px_1fr] gap-4 border-b border-white/[0.07] p-7 last:border-b-0">
                  <span className="font-mono text-xs text-cyan-300/55">{number}</span>
                  <div><h3 className="font-medium text-white/85">{title}</h3><p className="mt-2 text-sm leading-6 text-white/38">{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-y border-white/[0.07] bg-[#070a0b] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="section-label">TRABALHO REAL</p>
          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Produtos e sistemas que já sustentam operações.</h2>
            <p className="max-w-sm text-sm leading-6 text-white/38">Sem catálogo de promessas. Aqui mostramos o que já está em uso, entregue ou validado.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {work.map((item) => {
              const Card = item.href ? "a" : "article"
              return (
                <Card key={item.name} {...(item.href ? { href: item.href, target: "_blank", rel: "noreferrer" } : {})} className={`group relative min-h-[300px] overflow-hidden border border-white/[0.09] bg-black p-7 transition hover:border-cyan-300/25 sm:p-9 ${item.featured ? "md:col-span-2 md:min-h-[360px]" : ""}`}>
                  <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/[0.08] blur-3xl transition group-hover:bg-cyan-300/[0.13]" />
                  <div className="relative flex h-full flex-col">
                    <p className="text-[10px] uppercase tracking-[.2em] text-cyan-300/55">{item.eyebrow}</p>
                    <h3 className={`mt-8 font-semibold tracking-tight ${item.featured ? "text-4xl sm:text-6xl" : "text-3xl"}`}>{item.name}</h3>
                    <p className={`mt-5 max-w-xl leading-7 text-white/48 ${item.featured ? "text-base sm:text-lg" : "text-sm"}`}>{item.description}</p>
                    <div className="mt-auto flex items-end justify-between gap-6 pt-10">
                      <span className="text-xs text-white/27">{item.detail}</span>
                      {item.href && <span className="grid h-9 w-9 place-items-center border border-white/10 text-white/40 transition group-hover:border-cyan-300/35 group-hover:text-cyan-300"><ArrowRight size={15} /></span>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="desenvolvimento" className="relative py-24 lg:py-32">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.035] blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="section-label">EM DESENVOLVIMENTO</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Uma base tecnológica para a jornada veterinária.</h2>
            <p className="mt-6 max-w-2xl leading-7 text-white/45">Do primeiro contato ao apoio profissional: uma arquitetura comum, adaptada à realidade de cada operação.</p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {veterinary.map(({ name, status, description, features, icon: Icon }) => (
              <article key={name} className="border border-white/[0.09] bg-white/[0.018] p-7 sm:p-9">
                <div className="flex items-start justify-between gap-6">
                  <div className="grid h-11 w-11 place-items-center border border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-300"><Icon size={21} strokeWidth={1.5} /></div>
                  <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[.15em] text-amber-200/60">{status}</span>
                </div>
                <h3 className="mt-9 text-3xl font-semibold">{name}</h3>
                <p className="mt-4 min-h-[84px] text-sm leading-7 text-white/45">{description}</p>
                <ul className="mt-8 space-y-3 border-t border-white/[0.07] pt-7">
                  {features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-white/55"><ChevronRight size={14} className="text-cyan-300/60" />{feature}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-5 flex gap-4 border border-white/[0.07] bg-white/[0.015] p-6 text-sm leading-6 text-white/38">
            <ShieldCheck className="mt-0.5 shrink-0 text-cyan-300/55" size={18} />
            <p>Nos fluxos clínicos, a tecnologia organiza informações e oferece apoio. A interpretação e a decisão final permanecem sempre com o médico-veterinário.</p>
          </div>
        </div>
      </section>

      <section id="ecossistema" className="border-y border-white/[0.07] bg-[#070a0b] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="section-label">ECOSSISTEMA ICHTHUS</p>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Estratégia, tecnologia e propriedade intelectual trabalhando juntas.</h2>
          <div className="mt-12 grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
            {[
              { name: "Ichthus Marketing", tag: "ESTRATÉGIA E AQUISIÇÃO", text: "Posicionamento, conteúdo, campanhas e sistemas de aquisição para fazer negócios crescerem.", href: "https://ichthusmkt.com.br" },
              { name: "Proxy Labs", tag: "TECNOLOGIA E PRODUTOS", text: "Produtos digitais, sistemas sob medida, automações e inteligência artificial aplicada.", href: "#inicio" },
              { name: "Editora Ichthus", tag: "CONTEÚDO E PUBLICAÇÃO", text: "Livros próprios e uma futura estrutura de curadoria e publicação para especialistas.", href: "https://www.editoraichthus.com.br/" },
            ].map((company) => (
              <a key={company.name} href={company.href} target={company.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group bg-[#070a0b] p-7 transition hover:bg-white/[0.025] sm:p-8">
                <p className="text-[10px] tracking-[.18em] text-white/25">{company.tag}</p>
                <h3 className="mt-7 flex items-center justify-between text-xl font-semibold">{company.name}<ArrowRight size={15} className="text-white/20 transition group-hover:text-cyan-300" /></h3>
                <p className="mt-4 text-sm leading-6 text-white/38">{company.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="relative py-28 lg:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(34,211,238,.09),transparent_35%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Sparkles className="mx-auto text-cyan-300/60" size={24} strokeWidth={1.5} />
          <h2 className="mt-7 text-4xl font-semibold tracking-tight sm:text-6xl">Qual problema a tecnologia pode resolver na sua operação?</h2>
          <p className="mx-auto mt-6 max-w-xl leading-7 text-white/45">Não é preciso chegar com a solução pronta. Começamos entendendo o problema, o fluxo e a decisão que precisa melhorar.</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-2 bg-cyan-300 px-7 py-4 text-sm font-semibold text-black transition hover:bg-cyan-200">
            Conversar com a Proxy Labs <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <footer className="border-t border-white/[0.07] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div><BrandMark /><p className="mt-4 text-xs text-white/28">Tecnologia e produtos digitais do ecossistema Ichthus.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/35">
            <a href="https://ichthusmkt.com.br" target="_blank" rel="noreferrer" className="hover:text-white">Ichthus Marketing</a>
            <a href="https://scribmed.app" target="_blank" rel="noreferrer" className="hover:text-white">ScribMed</a>
            <a href="https://www.linkedin.com/company/proxy-technology" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white"><Linkedin size={13} /> LinkedIn</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a>
          </div>
          <p className="text-xs text-white/20">© 2026 Proxy Labs</p>
        </div>
      </footer>
    </main>
  )
}
