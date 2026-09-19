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
      "Case em produção de uma infraestrutura de audiência própria: conteúdo, newsletter, opt-in, WhatsApp Business e dashboard reunidos em uma operação de distribuição direta.",
    tags: ["Audiência própria", "E-mail", "WhatsApp", "Dashboard"],
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

const audiencePillars = [
  {
    icon: Network,
    title: "Base própria",
    text: "Contatos, segmentação, histórico e fontes de aquisição organizados em uma base que pertence à operação.",
  },
  {
    icon: Mail,
    title: "Distribuição multicanal",
    text: "Conteúdo distribuído por e-mail e WhatsApp, com fluxos preparados para diferentes origens e públicos.",
  },
  {
    icon: ShieldCheck,
    title: "Consentimento e governança",
    text: "Opt-in, opt-out, origem, evidências e regras operacionais incorporados ao fluxo desde a entrada do contato.",
  },
  {
    icon: Workflow,
    title: "Mensuração e operação",
    text: "Campanhas, entregas, leituras, cliques, respostas e crescimento da audiência acompanhados em dashboard.",
  },
]

const metaInfrastructure = [
  "Onboarding de clientes com Embedded Signup",
  "Cloud API e conexão de números empresariais",
  "Templates, campanhas e mensagens transacionais",
  "Webhooks de entrega, leitura, respostas e eventos",
  "Fluxos de consentimento, desautorização e exclusão de dados",
  "Arquitetura preparada para coexistência quando aplicável",
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
            <a href="#audiencia" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Audiência</a>
            <a href="#infraestrutura" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Infraestrutura</a>
            <a href="#meta" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Meta</a>
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
          <video autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover opacity-40">
            <source src="/proxy.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(34,211,238,0.10),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.28),#000_88%)]" />
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
              Desenvolvemos produtos próprios e sistemas sob medida que conectam atendimento, audiência, dados, CRM, inteligência artificial e canais de comunicação em fluxos reais de negócio.
            </p>
            <div className="mt-6 max-w-2xl border-l border-cyan-300/45 pl-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/65">Human-Centered AI</p>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                Tecnologia para ampliar a capacidade humana, reduzir atrito operacional e devolver tempo às pessoas para decisões, relações e trabalho de maior valor.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#operacoes" className="bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300">
                Ver operações atuais
              </a>
              <a href="#infraestrutura" className="border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white">
                Ver capacidade técnica
              </a>
            </div>
          </div>

          <aside className="border border-white/10 bg-black/45 p-7 backdrop-blur-md lg:p-9">
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


      <section id="audiencia" className="relative overflow-hidden border-y border-white/10 bg-[#071012] px-6 py-24 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.06),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/75">Audiência própria</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Conteúdo que vira relacionamento direto.</h2>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/50 lg:text-lg">
                Empresas produzem artigos, vídeos, notícias, lançamentos e conhecimento todos os dias. A Proxy transforma esse conteúdo em uma infraestrutura própria de distribuição, captação e relacionamento, sem depender apenas do alcance das redes sociais.
              </p>
            </div>
            <div className="border border-cyan-300/20 bg-black/35 p-6 lg:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/65">Fluxo</p>
              <div className="mt-5 grid gap-px bg-white/10 sm:grid-cols-5">
                {["Conteúdo", "Opt-in", "E-mail + WhatsApp", "Base própria", "Dashboard"].map((item, index) => (
                  <div key={item} className="relative bg-[#081012] px-4 py-5 text-center">
                    <span className="font-mono text-[9px] text-white/20">0{index + 1}</span>
                    <p className="mt-2 text-xs font-semibold text-white/75">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {audiencePillars.map(({ icon: Icon, title, text }) => (
              <article key={title} className="bg-[#071012] p-7">
                <Icon className="h-6 w-6 text-cyan-300/70" strokeWidth={1.6} />
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/45">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Aplicações
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/50">
                Veículos de mídia, e-commerce, educação, saúde, serviços profissionais, associações, empresas B2B e negócios que precisam manter relacionamento recorrente com uma base própria.
              </p>
            </div>
            <a
              href="https://eduardobrasil.fonsecabrasilserrao.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2 border border-cyan-300/25 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60"
            >
              Ver case em produção <ArrowUpRight className="h-4 w-4" />
            </a>
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

      <section id="meta" className="relative overflow-hidden border-y border-white/10 bg-black px-6 py-24 text-white lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(34,211,238,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <div className="inline-flex border border-cyan-300/25 bg-cyan-300/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Meta Tech Provider · WhatsApp Business Platform
            </div>
            <h2 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">WhatsApp empresarial exige infraestrutura.</h2>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/55">
              A Proxy Technology atua como Tech Provider para a WhatsApp Business Platform. Conectamos contas empresariais, aplicações, CRMs, automações, inteligência artificial e dados em fluxos preparados para operação real.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/40">
              Não tratamos o WhatsApp como um botão isolado. A integração nasce junto com consentimento, regras de atendimento, eventos, histórico e governança.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/meta/onboarding" className="inline-flex items-center gap-2 bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300">
                Ambiente WhatsApp Business <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/privacy" className="border border-white/15 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-white/35 hover:text-white">
                Política de privacidade
              </Link>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.035] p-7 lg:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/60">Capacidades na plataforma</p>
            <div className="mt-7 space-y-4">
              {metaInfrastructure.map((item) => (
                <div key={item} className="flex items-start gap-3 border-t border-white/10 pt-4 first:border-0 first:pt-0">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300/75" strokeWidth={1.8} />
                  <p className="text-sm font-medium leading-relaxed text-white/60">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/35">
              Cada implantação segue as permissões, políticas e processos aplicáveis à conta empresarial do cliente e à WhatsApp Business Platform.
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
