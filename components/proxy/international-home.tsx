import Link from "next/link"
import {
  ArrowUpRight,
  BrainCircuit,
  Database,
  Layers3,
  Mail,
  MessageSquareText,
  Network,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Workflow,
} from "lucide-react"

const capabilities = [
  {
    number: "01",
    icon: Layers3,
    title: "Operational systems",
    text: "CRM, workflows, dashboards, authenticated environments and internal tools designed around the way the business actually operates.",
  },
  {
    number: "02",
    icon: MessageSquareText,
    title: "Conversational operations",
    text: "WhatsApp Business, messaging, human handoff, notifications and structured service flows connected to operational context.",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "Applied AI",
    text: "Language models, classification, copilots, context and automation placed inside workflows where they can create measurable operational value.",
  },
  {
    number: "04",
    icon: Database,
    title: "Data & integrations",
    text: "APIs, webhooks, databases, authentication, permissions, audit trails and integrations between systems and channels.",
  },
  {
    number: "05",
    icon: Smartphone,
    title: "Digital products",
    text: "SaaS products, web applications, PWAs, customer portals and authenticated experiences built for desktop and mobile.",
  },
  {
    number: "06",
    icon: Network,
    title: "Owned audience infrastructure",
    text: "Email, WhatsApp, opt-in, segmentation, distribution and measurement connected to first-party customer and audience data.",
  },
]

const selectedWork = [
  {
    name: "ScribMed",
    label: "Healthcare · Product",
    description:
      "Clinical documentation support platform combining longitudinal context, structured consultations and professional safeguards for healthcare workflows.",
    tags: ["Applied AI", "SaaS", "Healthcare"],
    href: "https://scribmed.app",
    icon: Stethoscope,
  },
  {
    name: "Eduardo Brasil",
    label: "Professional communication · Custom platform",
    description:
      "An owned-audience operation connecting content, newsletter, opt-in, WhatsApp Business and dashboards into a direct distribution system.",
    tags: ["Owned audience", "Email", "WhatsApp", "Dashboard"],
    href: "https://eduardobrasil.fonsecabrasilserrao.com",
    icon: Mail,
  },
  {
    name: "LA Climatização",
    label: "Field services · CRM & operations",
    description:
      "An operational CRM designed around the journey from WhatsApp lead to inspection, quotation, approval, work order, completion and customer history.",
    tags: ["CRM", "WhatsApp", "Workflow", "PWA"],
    icon: Workflow,
  },
]

const metaCapabilities = [
  "Customer onboarding with Embedded Signup",
  "Cloud API and business-number connectivity",
  "Templates, transactional messaging and campaigns",
  "Delivery, read, response and event webhooks",
  "Consent, opt-out and data-deletion flows",
  "CRM, automation and AI integration",
]

export function InternationalHome() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/en" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-cyan-400/50">
              <span className="h-3.5 w-3.5 bg-cyan-400" />
            </span>
            <span className="text-lg font-bold tracking-tight">PROXY</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#systems" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Systems</a>
            <a href="#work" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Work</a>
            <a href="#meta" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Meta</a>
            <a href="#contact" className="text-xs uppercase tracking-[0.15em] text-white/50 transition hover:text-white">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 transition hover:text-white">
              PT
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">EN</span>
            <a
              href="mailto:contato@proxytechnology.com.br"
              className="hidden border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-cyan-400/50 hover:text-white sm:inline-flex"
            >
              Start a conversation
            </a>
          </div>
        </div>
      </header>

      <section className="relative min-h-[94vh] overflow-hidden px-6 pb-24 pt-36 lg:px-8 lg:pt-44">
        <div className="absolute inset-0">
          <video autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover opacity-40">
            <source src="/proxy.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(34,211,238,0.10),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.28),#000_88%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.16fr_0.84fr] lg:items-end">
          <div>
            <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
              Proxy Technology · Software, AI, automation & integrations
            </p>
            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-7xl lg:text-[5.7rem]">
              Technology designed to work inside real operations.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/55 lg:text-xl">
              We build software, AI systems and integrations that connect customer operations, data, CRM and communication channels into workflows people can actually use.
            </p>
            <div className="mt-6 max-w-2xl border-l border-cyan-300/45 pl-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/65">Human-Centered AI</p>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                AI should increase human capacity, reduce operational friction and give people more time for decisions, relationships and higher-value work.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#systems" className="bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300">
                Explore our capabilities
              </a>
              <a href="#work" className="border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white">
                See selected work
              </a>
            </div>
          </div>

          <aside className="border border-white/10 bg-black/45 p-7 backdrop-blur-md lg:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">What we build around</p>
            <div className="mt-7 space-y-6">
              {[
                ["Customer operations", "Enquiries, service, sales, scheduling, follow-up and human handoff."],
                ["Business workflows", "CRM, approvals, tasks, dashboards, documents and operational history."],
                ["Connected technology", "AI, messaging, APIs, data and software working as one operating layer."],
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">How we work</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Less software for software&apos;s sake. More operational architecture.
            </h2>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-3">
            {[
              ["01", "Understand the flow", "We map the customer journey, decisions, data, bottlenecks and handoffs before choosing the technology."],
              ["02", "Build the missing layer", "We develop the application, integration or automation around the actual rules of the operation."],
              ["03", "Put it into use", "The outcome is a working system with history, metrics, human ownership and room to evolve."],
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

      <section id="systems" className="bg-white px-6 py-24 text-black lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/45">Technical capability</p>
              <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">
                One technology layer between channels, data and people.
              </h2>
              <p className="mt-7 max-w-lg leading-relaxed text-black/55">
                Sometimes the right answer is a complete product. Sometimes it is one integration that removes a critical handoff. We start with the operation, not with a predetermined tool.
              </p>
            </div>

            <div className="grid border-l border-t border-black/15 sm:grid-cols-2">
              {capabilities.map(({ number, icon: Icon, title, text }) => (
                <article key={title} className="min-h-72 border-b border-r border-black/15 p-7 lg:p-8">
                  <div className="flex items-start justify-between">
                    <Icon className="h-6 w-6" strokeWidth={1.6} />
                    <span className="font-mono text-[10px] text-black/30">{number}</span>
                  </div>
                  <h3 className="mt-10 text-xl font-bold tracking-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-black/55">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-[#071012] px-6 py-24 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.06),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/75">Customer & audience infrastructure</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
                Acquisition becomes more valuable when it connects to the operation.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/50 lg:text-lg">
                We connect owned data, messaging, email, CRM and measurement so customer interest does not end at the lead form or social platform.
              </p>
            </div>
            <div className="border border-cyan-300/20 bg-black/35 p-6 lg:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/65">Example flow</p>
              <div className="mt-5 grid gap-px bg-white/10 sm:grid-cols-5">
                {["Demand", "Enquiry", "Operations", "Follow-up", "Measure"].map((item, index) => (
                  <div key={item} className="relative bg-[#081012] px-4 py-5 text-center">
                    <span className="font-mono text-[9px] text-white/20">0{index + 1}</span>
                    <p className="mt-2 text-xs font-semibold text-white/75">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-3">
            {[
              [ShieldCheck, "Governed by design", "Consent, permissions, access rules and operational ownership are considered as part of the system, not bolted on later."],
              [MessageSquareText, "Human handoff", "Automation should know when to assist and when the right next step is a person with context."],
              [Database, "Measurable flows", "Events, sources, states and outcomes create visibility into what the operation is actually doing."],
            ].map(([Icon, title, text]) => {
              const Component = Icon as typeof ShieldCheck
              return (
                <article key={String(title)} className="bg-[#071012] p-7">
                  <Component className="h-6 w-6 text-cyan-300/70" strokeWidth={1.6} />
                  <h3 className="mt-8 text-lg font-semibold">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">{String(text)}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="work" className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/75">Selected work</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
                Systems shaped by different operations.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-white/45 lg:text-base">
              The technology changes by context. The principle does not: understand the workflow, connect the missing layer and build something the operation can own.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 lg:grid-cols-3">
            {selectedWork.map((item) => {
              const Icon = item.icon
              const content = (
                <>
                  <Icon className="h-6 w-6 text-cyan-300/70" strokeWidth={1.6} />
                  <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">{item.label}</p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">{item.name}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-white/48">{item.description}</p>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="border border-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/35">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {item.href && (
                    <div className="mt-auto flex items-center gap-2 pt-10 text-xs font-semibold text-cyan-300/70 transition group-hover:text-cyan-200">
                      Open project <ArrowUpRight className="h-4 w-4" />
                    </div>
                  )}
                </>
              )

              return item.href ? (
                <a key={item.name} href={item.href} target="_blank" rel="noreferrer" className="group flex min-h-[27rem] flex-col bg-black p-7 transition hover:bg-white/[0.035] lg:p-8">
                  {content}
                </a>
              ) : (
                <article key={item.name} className="flex min-h-[27rem] flex-col bg-black p-7 lg:p-8">
                  {content}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="meta" className="relative overflow-hidden border-y border-white/10 bg-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(34,211,238,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <div className="inline-flex border border-cyan-300/25 bg-cyan-300/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Meta Tech Provider · WhatsApp Business Platform
            </div>
            <h2 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Business messaging needs infrastructure behind the conversation.
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/55">
              Proxy Technology works as a technology provider for WhatsApp Business Platform implementations, connecting business accounts, applications, CRM, automation, AI and operational data.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/40">
              We do not treat WhatsApp as an isolated button. Messaging is designed together with consent, service rules, events, history and human ownership.
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.035] p-7 lg:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/60">Platform capabilities</p>
            <div className="mt-7 space-y-4">
              {metaCapabilities.map((item) => (
                <div key={item} className="flex items-start gap-3 border-t border-white/10 pt-4 first:border-0 first:pt-0">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300/75" strokeWidth={1.8} />
                  <p className="text-sm font-medium leading-relaxed text-white/60">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0b0b] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">Ichthus ecosystem</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Technology connected to strategy and growth.
            </h2>
          </div>
          <div className="border-l border-white/10 pl-7 lg:pl-10">
            <p className="max-w-2xl text-sm leading-relaxed text-white/48">
              Proxy is the technology arm of the Ichthus ecosystem. Ichthus connects positioning, digital experience and acquisition; Proxy builds the operational technology that can carry that demand through the business.
            </p>
            <a href="https://www.ichthusmkt.com.br/en" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300/75 transition hover:text-cyan-200">
              Visit Ichthus <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 border-y border-white/10 py-16 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:py-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">Projects & integrations</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              When the operation does not fit a ready-made tool, we build the missing layer.
            </h2>
          </div>
          <div>
            <p className="leading-relaxed text-white/50">
              CRM, customer operations, messaging, automation, AI, integrations, dashboards or complete digital products: the scope starts with the workflow that needs to work.
            </p>
            <a href="mailto:contato@proxytechnology.com.br" className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-cyan-300">
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
              Software, applied AI, automation and integrations for real digital operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/35">
            <Link href="/" className="transition hover:text-white">Português</Link>
            <a href="https://www.ichthusmkt.com.br/en" target="_blank" rel="noreferrer" className="transition hover:text-white">Ichthus</a>
            <a href="mailto:contato@proxytechnology.com.br" className="transition hover:text-white">Contact</a>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/5 pt-6 text-[10px] uppercase tracking-[0.15em] text-white/20">
          © 2026 Proxy Technology. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
