import Link from "next/link"
import {
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Layers3,
  Mail,
  MessageSquareText,
  Network,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Workflow,
} from "lucide-react"

const operations = [
  {
    name: "ScribMed",
    segment: "Saúde",
    kind: "Produto próprio",
    status: "Em produção",
    statusTone: "live",
    description:
      "Plataforma de apoio à documentação clínica com contexto longitudinal, estruturação de consulta e controles voltados ao uso profissional em saúde.",
    tags: ["IA aplicada", "SaaS", "Prontuário", "Contexto clínico"],
    href: "https://scribmed.app",
    icon: Stethoscope,
  },
  {
    name: "Mentora Clara",
    segment: "Educação",
    kind: "Produto próprio",
    status: "Em produção",
    statusTone: "live",
    description:
      "Plataforma para correção e orientação de redações de vestibulandos, com autenticação, histórico, regras de uso e operação de assinatura.",
    tags: ["IA aplicada", "EdTech", "Auth", "Pagamentos"],
    href: "https://www.mentoraclara.com.br",
    icon: BrainCircuit,
  },
  {
    name: "Eduardo Brasil",
    segment: "Comunicação profissional",
    kind: "Plataforma sob medida",
    status: "Em produção",
    statusTone: "live",
    description:
      "Newsletter com estúdio editorial, base própria e infraestrutura de distribuição. A operação evolui para comunicação multicanal por e-mail e WhatsApp.",
    tags: ["Newsletter", "E-mail", "WhatsApp", "Dashboard"],
    href: "https://eduardobrasil.fonsecabrasilserrao.com",
    icon: Mail,
  },
  {
    name: "ScribVet",
    segment: "Saúde veterinária",
    kind: "Produto próprio",
    status: "Em lançamento",
    statusTone: "launch",
    description:
      "Plataforma veterinária para atendimento, histórico de tutor e paciente, organização clínica e novas camadas de relacionamento. Peludinhos e Pet Endoscopia estão previstas nas primeiras implantações.",
    tags: ["SaaS", "Veterinária", "IA aplicada", "Relacionamento"],
    icon: Bot,
  },
  {
    name: "LA Climatização",
    segment: "Serviços técnicos",
    kind: "CRM + atendimento",
    status: "Em implantação",
    statusTone: "build",
    description:
      "Atendimento inteligente e CRM operacional para organizar o fluxo do lead no WhatsApp até vistoria, orçamento, aprovação, ordem de serviço, conclusão e histórico do cliente.",
    tags: ["CRM", "WhatsApp", "PWA", "Automação"],
    icon: Building2,
  },
  {
    name: "Peludinhos",
    segment: "Saúde veterinária",
    kind: "CRM + atendimento",
    status: "Em implantação",
    statusTone: "build",
    description:
      "Atendimento inteligente com memória de tutor e animal, histórico, organização de demanda e integração da jornada entre WhatsApp, agendamento e operação clínica.",
    tags: ["CRM", "WhatsApp", "Automação", "Dados"],
    icon: MessageSquareText,
  },
]

const capabilities = [
  {
    icon: MessageSquareText,
    title: "WhatsApp Business",
    text: "Integrações para atendimento, notificações, fluxos transacionais e comunicação estruturada usando a WhatsApp Business Platform e APIs da Meta.",
  },
  {
    icon: Mail,
    title: "E-mail e distribuição",
    text: "Newsletter, e-mail transacional e campanhas conectados a bases próprias, regras de segmentação, eventos e dashboards.",
  },
  {
    icon: Layers3,
    title: "CRM e operação",
    text: "Pipelines desenhados a partir do processo real da empresa: leads, clientes, tarefas, documentos, aprovações, histórico e acompanhamento.",
  },
  {
    icon: BrainCircuit,
    title: "IA aplicada",
    text: "Modelos de linguagem, classificação, contexto, copilotos e automações inseridos em fluxos onde geram ganho operacional mensurável.",
  },
  {
    icon: Database,
    title: "Dados, autenticação e APIs",
    text: "Aplicações com login, permissões, banco de dados, APIs, webhooks, trilhas de auditoria e integrações entre sistemas.",
  },
  {
    icon: Smartphone,
    title: "Web apps e PWA",
    text: "Sistemas responsivos para computador e celular, incluindo aplicações instaláveis, dashboards e áreas autenticadas.",
  },
]

const metaInfrastructure = [
  "Embedded Signup para conexão do WhatsApp Business",
  "Rotas de callback e validação de integração",
  "Fluxos de desautorização",
  "Solicitação e tratamento de exclusão de dados",
  "Políticas públicas de privacidade e termos de uso",
]

const groups = [
  {
    name: "Ichthus Marketing",
    label: "Estratégia, comunicação e aquisição",
    text: "A camada de estratégia, posicionamento, conteúdo, mídia e experiência digital do grupo.",
    href: "https://www.ichthusmkt.com.br",
  },
  {
    name: "Editora Ichthus",
    label: "Conteúdo, publicação e comércio editorial",
    text: "Operação editorial que também serve como campo real para produtos, automações, pagamentos e distribuição digital.",
    href: "https://editoraichthus.com.br",
  },
]

function Status({ tone, children }: { tone: string; children: React.ReactNode }) {
  const classes =
    tone === "live"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : tone === "launch"
        ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
        : "border-amber-300/20 bg-amber-300/10 text-amber-200"

  return (
    <span className={`inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function InstitutionalHome() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-cyan-400/50">
              <span className="h-3.5 w-3.5 bg-cyan-400" />
            </span>
            <span className="text-lg font-bold tracking-tight">PROXY</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#operacoes" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Operações</a>
            <a href="#infraestrutura" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Infraestrutura</a>
            <a href="#meta" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Integrações</a>
            <a href="#contato" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Contato</a>
          </nav>

          <a
            href="mailto:contato@proxytechnology.com.br"
            className="border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-cyan-400/50 hover:text-white"
          >
            Fale conosco
          </a>
        </div>
      </header>

      <section className="relative min-h-[92vh] overflow-hidden px-6 pb-24 pt-36 lg:px-8 lg:pt-44">
        <div className="absolute inset-0">
          <video autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover opacity-25">
            <source src="/proxy.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(34,211,238,0.13),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.45),#000_82%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
              Proxy Technology · Software, IA, automação e integrações
            </p>
            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-7xl lg:text-[5.7rem]">
              Tecnologia construída para entrar na operação.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/55 lg:text-xl">
              Desenvolvemos produtos próprios e sistemas sob medida que conectam atendimento, dados, CRM, inteligência artificial e canais de comunicação em fluxos reais de negócio.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#operacoes" className="bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300">
                Ver operações atuais
              </a>
              <a href="#infraestrutura" className="border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white">
                Ver capacidade técnica
              </a>
            </div>
          </div>

          <aside className="border border-white/10 bg-black/55 p-7 backdrop-blur-md lg:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">Atuação</p>
            <div className="mt-7 space-y-6">
              {[
                ["Produtos digitais", "SaaS e aplicações próprias em saúde, veterinária e educação."],
                ["Sistemas sob medida", "CRM, atendimento, dashboards, PWA e áreas autenticadas."],
                ["Comunicação integrada", "WhatsApp Business, e-mail, automações e distribuição multicanal."],
              ].map(([title, text]) => (
                <div key={title} className="border-t border-white/10 pt-5 first:border-0 first:pt-0">
                  <h2 className="font-semibold text-white/90">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b0b0b] px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">Como trabalhamos</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Menos produto de prateleira. Mais arquitetura de operação.</h2>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-3">
            {[
              ["01", "Entender o fluxo", "Mapeamos atendimento, decisão, dados, gargalos e pontos onde a tecnologia precisa agir."],
              ["02", "Construir a camada", "Desenvolvemos a aplicação, integração, automação ou produto com regras compatíveis com a operação."],
              ["03", "Colocar em uso", "O objetivo é sistema funcionando no dia a dia, com histórico, métricas e capacidade de evolução."],
            ].map(([number, title, text]) => (
              <article key={number} className="bg-[#0b0b0b] p-7">
                <span className="font-mono text-xs text-white/25">{number}</span>
                <h3 className="mt-10 text-xl font-semibold">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/45">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="operacoes" className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/75">Operações atuais</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">O que está sendo usado, lançado ou implantado agora.</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-white/45 lg:text-base">
              A Proxy concentra hoje seus esforços em produtos e projetos com aplicação concreta. Iniciativas em pausa não são apresentadas como ofertas ativas.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {operations.map((operation) => {
              const Icon = operation.icon
              const content = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <Icon className="h-6 w-6 text-cyan-300/70" strokeWidth={1.6} />
                    <Status tone={operation.statusTone}>{operation.status}</Status>
                  </div>
                  <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    {operation.segment} · {operation.kind}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">{operation.name}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-white/48">{operation.description}</p>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {operation.tags.map((tag) => (
                      <span key={tag} className="border border-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/35">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {operation.href && (
                    <div className="mt-auto flex items-center gap-2 pt-10 text-xs font-semibold text-cyan-300/70 transition group-hover:text-cyan-200">
                      Abrir projeto <ArrowUpRight className="h-4 w-4" />
                    </div>
                  )}
                </>
              )

              return operation.href ? (
                <a
                  key={operation.name}
                  href={operation.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-[29rem] flex-col bg-black p-7 transition hover:bg-white/[0.035] lg:p-8"
                >
                  {content}
                </a>
              ) : (
                <article key={operation.name} className="group flex min-h-[29rem] flex-col bg-black p-7 lg:p-8">
                  {content}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="infraestrutura" className="bg-white px-6 py-24 text-black lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/45">Capacidade técnica</p>
              <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">Uma camada de tecnologia entre canais, dados e pessoas.</h2>
              <p className="mt-7 max-w-lg leading-relaxed text-black/55">
                A solução pode ser um produto completo ou uma integração específica. O desenho técnico parte do processo que precisa funcionar, não de uma ferramenta predeterminada.
              </p>
            </div>

            <div className="grid border-l border-t border-black/15 sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article key={title} className="min-h-60 border-b border-r border-black/15 p-7 lg:p-8">
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                  <h3 className="mt-10 text-lg font-bold uppercase tracking-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-black/55">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="meta" className="bg-cyan-400 px-6 py-24 text-black lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Integrações de comunicação</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">WhatsApp não é só um botão no site.</h2>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-black/65">
              Para operações que dependem de mensageria, construímos a camada de conexão entre conta empresarial, aplicação, CRM, regras de atendimento e dados. A Proxy mantém infraestrutura própria para o fluxo técnico de integração com a Meta.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/meta/onboarding" className="inline-flex items-center gap-2 bg-black px-5 py-3 text-sm font-semibold text-white">
                Ambiente WhatsApp Business <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/privacy" className="border border-black/25 px-5 py-3 text-sm font-semibold text-black/70 transition hover:border-black/50">
                Política de privacidade
              </Link>
            </div>
          </div>

          <div className="border border-black/20 bg-black/5 p-7 lg:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">Infraestrutura existente</p>
            <div className="mt-7 space-y-4">
              {metaInfrastructure.map((item) => (
                <div key={item} className="flex items-start gap-3 border-t border-black/15 pt-4 first:border-0 first:pt-0">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
                  <p className="text-sm font-medium leading-relaxed text-black/70">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 text-xs leading-relaxed text-black/50">
              A existência dessa infraestrutura não representa, por si só, selo, certificação ou endosso da Meta. As integrações seguem os processos e permissões aplicáveis a cada operação.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0b0b] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">Ecossistema Ichthus</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tecnologia conectada à estratégia e à operação.</h2>
          </div>
          <div className="grid gap-px bg-white/10 md:grid-cols-2">
            {groups.map((group) => (
              <a key={group.name} href={group.href} target="_blank" rel="noreferrer" className="group bg-[#0b0b0b] p-8 transition hover:bg-white/[0.035]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/60">{group.label}</p>
                <h3 className="mt-4 flex items-center gap-2 text-2xl font-bold">
                  {group.name} <ArrowUpRight className="h-5 w-5 text-white/25 transition group-hover:text-cyan-300" />
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">{group.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 border-y border-white/10 py-16 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:py-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">Projetos e integrações</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">Quando o processo não cabe em uma ferramenta pronta, construímos a camada que falta.</h2>
          </div>
          <div>
            <p className="leading-relaxed text-white/50">
              CRM, atendimento, mensageria, automação, IA, integrações, dashboards ou produtos digitais completos: o escopo é desenhado a partir da operação.
            </p>
            <a
              href="mailto:contato@proxytechnology.com.br"
              className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              contato@proxytechnology.com.br <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="px-6 pb-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center border border-cyan-400/40">
                <span className="h-3 w-3 bg-cyan-400" />
              </span>
              <span className="font-bold">PROXY TECHNOLOGY</span>
            </div>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-white/30">
              Desenvolvimento de software, inteligência artificial, automações e integrações para operações digitais.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/35">
            <Link href="/privacy" className="transition hover:text-white">Privacidade</Link>
            <Link href="/terms" className="transition hover:text-white">Termos de uso</Link>
            <Link href="/meta/onboarding" className="transition hover:text-white">WhatsApp Business</Link>
            <a href="https://www.ichthusmkt.com.br" target="_blank" rel="noreferrer" className="transition hover:text-white">Ichthus Marketing</a>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/5 pt-6 text-[10px] uppercase tracking-[0.15em] text-white/20">
          © 2026 Proxy Technology. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  )
}
