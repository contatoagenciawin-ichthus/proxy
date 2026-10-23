import { redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { getAdminConfig } from '@/lib/meta-admin/policy.mjs'
import { loginAdmin } from '../actions'
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentPlatformAdmin()) redirect('/meta/admin')
  const enabled = Boolean(getAdminConfig())
  const { error } = await searchParams
  return <main className="pa-login"><p className="pa-eyebrow">PROXY TECHNOLOGY / META PROVIDER</p>
    <h1>Administração das integrações</h1>
    <p className="pa-lead">Acesso exclusivo à equipe autorizada da Proxy.</p>
    <section className="pa-login-box"><h2>{enabled ? 'Entrar na plataforma' : 'Acesso em preparação'}</h2>
      <p>{enabled ? 'Use sua conta GitHub autorizada. O acesso aos CRMs dos clientes não concede permissão a este painel.' : 'O login administrativo ainda não foi configurado neste ambiente. O inventário permanece protegido.'}</p>
      {error && <p role="alert" className="pa-warning">Não foi possível autorizar o acesso. Confirme com o responsável pela plataforma se sua conta está habilitada.</p>}
      {enabled && <form action={loginAdmin}><button className="pa-button">Continuar com GitHub <span aria-hidden="true">↗</span></button></form>}
    </section><p className="pa-muted">Gestão da plataforma separada das organizações atendidas.</p></main>
}
