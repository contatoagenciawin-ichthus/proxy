'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock3,
  Eye,
  Filter,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  MousePointerClick,
  Package,
  Search,
  Send,
  Settings,
  Users,
  Wrench,
  X,
} from 'lucide-react'

type Section = 'overview' | 'email' | 'contacts' | 'whatsapp' | 'reports'

const navItems: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'email', label: 'E-mails', icon: Mail },
  { id: 'contacts', label: 'Contatos', icon: Users },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
]

const campaigns = [
  {
    name: 'Componentes para preparação de fiação',
    audience: 'Clientes • Fiação',
    sent: '382',
    delivered: '374',
    clicks: '61',
    rate: '16,3%',
    status: 'Entregue',
  },
  {
    name: 'Novidades Texfield • Setembro',
    audience: 'Base geral',
    sent: '624',
    delivered: '608',
    clicks: '92',
    rate: '15,1%',
    status: 'Entregue',
  },
  {
    name: 'Assistência técnica e peças',
    audience: 'Pós-venda',
    sent: '196',
    delivered: '191',
    clicks: '38',
    rate: '19,9%',
    status: 'Entregue',
  },
]

const contacts = [
  { name: 'Indústria Aurora Têxtil', type: 'Cliente', interest: 'Fiação', city: 'Americana, SP', status: 'Ativo' },
  { name: 'Malharia Horizonte', type: 'Prospect', interest: 'Malharia', city: 'Blumenau, SC', status: 'Em nutrição' },
  { name: 'Tecidos Nova Era', type: 'Cliente', interest: 'Peças', city: 'Brusque, SC', status: 'Ativo' },
  { name: 'Fios do Sul', type: 'Prospect', interest: 'Máquinas', city: 'Jaraguá do Sul, SC', status: 'Oportunidade' },
  { name: 'Têxtil Bandeirantes', type: 'Cliente', interest: 'Assistência', city: 'São Paulo, SP', status: 'Ativo' },
]

const conversations = [
  {
    company: 'Fios do Sul',
    initials: 'FS',
    text: 'Precisamos cotar um conjunto de peças para uma máquina de preparação.',
    time: '09:42',
    tag: 'Comercial',
    priority: true,
  },
  {
    company: 'Tecidos Nova Era',
    initials: 'TN',
    text: 'O técnico consegue nos orientar sobre a substituição deste componente?',
    time: '09:18',
    tag: 'Técnico',
    priority: false,
  },
  {
    company: 'Malharia Horizonte',
    initials: 'MH',
    text: 'Recebi o material por e-mail. Vocês atendem também Santa Catarina?',
    time: 'Ontem',
    tag: 'Lead',
    priority: false,
  },
]

const performanceBars = [38, 55, 48, 67, 59, 76, 71, 84, 79, 91, 86, 96]

function DemoNotice() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Ambiente demonstrativo • dados ilustrativos
    </div>
  )
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Mail
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="rounded-xl bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1.5 text-xs text-slate-500">{detail}</div>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{eyebrow}</div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 lg:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

function CampaignTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Campanhas recentes</h3>
          <p className="mt-1 text-xs text-slate-500">Desempenho consolidado das últimas comunicações.</p>
        </div>
        <button className="text-xs font-semibold text-sky-700 transition hover:text-sky-900">Ver todas</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              <th className="px-5 py-3">Campanha</th>
              <th className="px-4 py-3">Público</th>
              <th className="px-4 py-3 text-right">Enviados</th>
              <th className="px-4 py-3 text-right">Entregues</th>
              <th className="px-4 py-3 text-right">Cliques</th>
              <th className="px-5 py-3 text-right">CTR</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{campaign.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                    <CircleCheck className="h-3.5 w-3.5" />
                    {campaign.status}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">{campaign.audience}</td>
                <td className="px-4 py-4 text-right text-sm font-medium text-slate-700">{campaign.sent}</td>
                <td className="px-4 py-4 text-right text-sm font-medium text-slate-700">{campaign.delivered}</td>
                <td className="px-4 py-4 text-right text-sm font-medium text-slate-700">{campaign.clicks}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold text-slate-950">{campaign.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PerformanceChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Interações por campanha</h3>
          <p className="mt-1 text-xs text-slate-500">Cliques registrados nos últimos 12 envios.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600">
          90 dias
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex h-44 items-end gap-2">
        {performanceBars.map((value, index) => (
          <div key={index} className="flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-sky-600 to-cyan-400 opacity-90"
              style={{ height: `${value}%` }}
              title={`${value} interações relativas`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-slate-400">
        <span>Jun</span>
        <span>Jul</span>
        <span>Ago</span>
        <span>Set</span>
      </div>
    </div>
  )
}

function Overview() {
  return (
    <>
      <SectionHeader
        eyebrow="Central de relacionamento"
        title="Bom dia, Texfield."
        description="Uma visão única da comunicação comercial por e-mail e das conversas que podem evoluir para atendimento e oportunidade."
        action={
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Send className="h-4 w-4" />
            Nova campanha
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contatos ativos" value="1.248" detail="+42 adicionados nos últimos 30 dias" icon={Users} />
        <StatCard label="Entregabilidade" value="97,4%" detail="Base com boa qualidade de entrega" icon={Check} />
        <StatCard label="Cliques" value="191" detail="Interações nas últimas 3 campanhas" icon={MousePointerClick} />
        <StatCard label="Oportunidades" value="18" detail="Sinais comerciais identificados" icon={ArrowUpRight} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <PerformanceChart />
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Sinal comercial</div>
              <h3 className="mt-2 text-lg font-semibold">Interesse em peças</h3>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">Prioridade</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Um contato da Fios do Sul clicou duas vezes no conteúdo sobre componentes e iniciou uma conversa no WhatsApp.
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-xs text-slate-400">Contato</div>
            <div className="mt-1 font-medium">Fios do Sul • Compras</div>
            <div className="mt-4 text-xs text-slate-400">Origem</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-cyan-300" />
              Campanha → clique → WhatsApp
            </div>
          </div>
          <button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
            Ver histórico do contato
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <CampaignTable />
      </div>
    </>
  )
}

function EmailSection() {
  return (
    <>
      <SectionHeader
        eyebrow="E-mail"
        title="Relacionamento que permanece com a empresa."
        description="Campanhas, segmentação e métricas em um canal próprio. O foco está em entrega, clique, ação e qualidade da base."
        action={
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800">
            <Mail className="h-4 w-4" />
            Criar campanha
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Enviados • 30 dias" value="1.202" detail="3 campanhas concluídas" icon={Send} />
        <StatCard label="Entregues" value="1.173" detail="97,6% dos envios" icon={Inbox} />
        <StatCard label="Cliques únicos" value="191" detail="16,3% sobre entregues" icon={MousePointerClick} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Campanha em destaque</h3>
              <p className="mt-1 text-xs text-slate-500">Componentes para preparação de fiação</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Entregue</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ['Enviados', '382'],
              ['Entregues', '374'],
              ['Cliques', '61'],
              ['Rejeitados', '8'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Funil da campanha</span>
              <span className="text-slate-400">dados ilustrativos</span>
            </div>
            <div className="space-y-3">
              {[
                ['Entrega', '97,9%', 'w-[97.9%]'],
                ['Clique', '16,3%', 'w-[62%]'],
                ['Ação comercial', '4,7%', 'w-[35%]'],
              ].map(([label, value, width]) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full bg-sky-600 ${width}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#e8edf2]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Prévia do e-mail</h3>
              <p className="mt-1 text-xs text-slate-500">Exemplo de comunicação para a base Texfield.</p>
            </div>
            <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Visualizar campanha">
              <Eye className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 lg:p-7">
            <div className="mx-auto max-w-[560px] overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="text-lg font-black tracking-[0.18em] text-slate-950">TEXFIELD</div>
              </div>
              <div className="bg-slate-950 px-6 py-8 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300">Soluções para a indústria têxtil</div>
                <h4 className="mt-3 text-2xl font-semibold leading-tight">Tecnologia, peças e suporte para manter sua operação em movimento.</h4>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Selecionamos novidades e soluções para empresas que buscam produtividade e continuidade operacional.
                </p>
              </div>
              <div className="px-6 py-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <Package className="h-5 w-5 text-sky-700" />
                    <div className="mt-3 text-sm font-semibold text-slate-950">Peças e componentes</div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">Itens para diferentes etapas e necessidades da produção.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <Wrench className="h-5 w-5 text-sky-700" />
                    <div className="mt-3 text-sm font-semibold text-slate-950">Suporte técnico</div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">Atendimento para orientar avaliação, manutenção e reposição.</p>
                  </div>
                </div>
                <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white">
                  Falar com a Texfield
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <CampaignTable />
      </div>
    </>
  )
}

function ContactsSection() {
  return (
    <>
      <SectionHeader
        eyebrow="Base de relacionamento"
        title="Uma base organizada para falar com públicos diferentes."
        description="Clientes, prospects, representantes e outros grupos podem receber comunicações específicas sem perder o histórico de relacionamento."
        action={
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4" />
            Importar contatos
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Base total" value="1.248" detail="Contatos válidos e ativos" icon={Users} />
        <StatCard label="Clientes" value="763" detail="61% da base" icon={Check} />
        <StatCard label="Prospects" value="391" detail="31% da base" icon={ArrowUpRight} />
        <StatCard label="Segmentos" value="12" detail="Por perfil e interesse" icon={Filter} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Contatos recentes</h3>
            <p className="mt-1 text-xs text-slate-500">Exemplo de organização comercial por empresa e interesse.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
              <Search className="h-4 w-4" />
              Buscar contato
            </div>
            <button className="rounded-lg border border-slate-200 p-2 text-slate-500">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                <th className="px-5 py-3">Empresa</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Interesse</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {contact.name
                          .split(' ')
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join('')}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{contact.type}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{contact.interest}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{contact.city}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{contact.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function WhatsAppSection() {
  const [selectedConversation, setSelectedConversation] = useState(0)
  const current = conversations[selectedConversation]

  return (
    <>
      <SectionHeader
        eyebrow="WhatsApp"
        title="Quando o interesse vira conversa."
        description="O WhatsApp entra como camada de atendimento prioritário, preservando contexto e ajudando a encaminhar cada solicitação para o responsável adequado."
      />

      <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
        <strong>Demonstração conceitual:</strong> esta tela representa a experiência planejada para atendimento integrado. O módulo de e-mail é a frente mais madura desta demonstração.
      </div>

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white xl:grid-cols-[340px_1fr_300px]">
        <div className="border-b border-slate-200 xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-950">Conversas</h3>
              <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">7 abertas</span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-400">
              <Search className="h-4 w-4" />
              Buscar conversa
            </div>
          </div>
          <div>
            {conversations.map((conversation, index) => (
              <button
                key={conversation.company}
                onClick={() => setSelectedConversation(index)}
                className={`w-full border-b border-slate-100 p-4 text-left transition ${
                  selectedConversation === index ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                    {conversation.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{conversation.company}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{conversation.time}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{conversation.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{conversation.tag}</span>
                      {conversation.priority && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Prioridade</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[500px] flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-950">{current.company}</div>
              <div className="mt-0.5 text-xs text-slate-400">WhatsApp Business • atendimento comercial</div>
            </div>
            <button className="rounded-lg border border-slate-200 p-2 text-slate-500">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 bg-[#f5f6f7] p-5">
            <div className="mx-auto max-w-[620px]">
              <div className="mb-5 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">Hoje</div>
              <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                {current.text}
                <div className="mt-2 text-right text-[10px] text-slate-400">{current.time}</div>
              </div>
              <div className="ml-auto mt-4 max-w-[78%] rounded-2xl rounded-tr-sm bg-sky-700 p-4 text-sm leading-6 text-white shadow-sm">
                Olá. Recebemos sua solicitação e já identificamos o assunto. Vou encaminhar para o responsável comercial com o contexto da sua mensagem.
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-sky-100">
                  09:44
                  <Check className="h-3 w-3" />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sky-700">Contexto identificado</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] text-slate-400">Categoria</div>
                    <div className="mt-1 text-xs font-semibold text-slate-800">{current.tag}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Origem recente</div>
                    <div className="mt-1 text-xs font-semibold text-slate-800">Campanha de e-mail</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
              Responder ao contato...
              <button className="ml-auto rounded-lg bg-slate-950 p-2 text-white">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-5 xl:border-l xl:border-t-0">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Contexto comercial</div>
          <h4 className="mt-3 text-base font-semibold text-slate-950">{current.company}</h4>

          <div className="mt-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Status</div>
              <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Em atendimento
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Responsável sugerido</div>
              <div className="mt-1.5 text-sm font-medium text-slate-700">Comercial Texfield</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Última interação por e-mail</div>
              <div className="mt-1.5 text-sm font-medium text-slate-700">Clique em peças e componentes</div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="text-xs font-semibold text-slate-950">Linha do tempo</div>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-sky-700" />
                <div>
                  <div className="text-xs font-medium text-slate-700">E-mail entregue</div>
                  <div className="mt-1 text-[10px] text-slate-400">Ontem • 14:20</div>
                </div>
              </div>
              <div className="flex gap-3">
                <MousePointerClick className="mt-0.5 h-4 w-4 text-sky-700" />
                <div>
                  <div className="text-xs font-medium text-slate-700">Clique registrado</div>
                  <div className="mt-1 text-[10px] text-slate-400">Ontem • 16:08</div>
                </div>
              </div>
              <div className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 text-sky-700" />
                <div>
                  <div className="text-xs font-medium text-slate-700">Conversa iniciada</div>
                  <div className="mt-1 text-[10px] text-slate-400">Hoje • {current.time}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ReportsSection() {
  return (
    <>
      <SectionHeader
        eyebrow="Relatórios"
        title="Métrica útil para decisão comercial."
        description="A leitura prioriza o que é mais confiável e acionável: entrega, rejeição, clique, resposta, evolução da base e passagem para atendimento."
        action={
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
            Exportar relatório
            <ArrowUpRight className="h-4 w-4" />
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entregabilidade" value="97,4%" detail="+0,8 p.p. vs. período anterior" icon={Check} />
        <StatCard label="CTR médio" value="16,3%" detail="Cliques sobre e-mails entregues" icon={MousePointerClick} />
        <StatCard label="Conversas geradas" value="34" detail="Interações que chegaram ao atendimento" icon={MessageCircle} />
        <StatCard label="Base válida" value="98,1%" detail="Contatos sem rejeição permanente" icon={Users} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <PerformanceChart />
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-950">Saúde da comunicação</h3>
          <p className="mt-1 text-xs text-slate-500">Indicadores consolidados do ambiente demonstrativo.</p>

          <div className="mt-6 space-y-5">
            {[
              ['E-mails válidos', '98,1%', 98],
              ['Entregabilidade', '97,4%', 97],
              ['Contatos segmentados', '84,0%', 84],
              ['Histórico identificado', '76,0%', 76],
            ].map(([label, value, width]) => (
              <div key={String(label)}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <p className="text-xs leading-5 text-slate-600">
                Taxas de abertura não são tratadas como indicador principal porque mecanismos de privacidade podem distorcer essa leitura. A plataforma prioriza eventos mais acionáveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function TexfieldDemoPage() {
  const [section, setSection] = useState<Section>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentLabel = navItems.find((item) => item.id === section)?.label ?? 'Visão geral'

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-slate-800 bg-[#0c1118] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-lg font-black tracking-[0.18em]">TEXFIELD</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Central de relacionamento</div>
          </div>

          <nav className="flex-1 p-3">
            <div className="mb-2 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-600">Navegação</div>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'whatsapp' && (
                    <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/15 text-sky-300'}`}>
                      DEMO
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-xl bg-white/[0.05] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400 font-black text-slate-950">P</span>
                Proxy Technology
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Ambiente comercial demonstrativo.</p>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <aside className="h-full w-[280px] bg-[#0c1118] p-4 text-white" onClick={(event) => event.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-base font-black tracking-[0.16em]">TEXFIELD</div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.13em] text-slate-500">Central de relacionamento</div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                const active = section === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSection(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                      active ? 'bg-white text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="text-sm font-semibold text-slate-950">{currentLabel}</div>
                <div className="hidden text-xs text-slate-400 sm:block">Texfield • ambiente de demonstração</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:block">
                <DemoNotice />
              </div>
              <button className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50" aria-label="Notificações">
                <Bell className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">TX</div>
                <span className="text-xs font-semibold text-slate-700">Texfield</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </header>

          <main className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1480px]">
              <div className="mb-5 md:hidden">
                <DemoNotice />
              </div>

              {section === 'overview' && <Overview />}
              {section === 'email' && <EmailSection />}
              {section === 'contacts' && <ContactsSection />}
              {section === 'whatsapp' && <WhatsAppSection />}
              {section === 'reports' && <ReportsSection />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
