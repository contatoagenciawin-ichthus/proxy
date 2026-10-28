import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { logoutAdmin } from '../actions'

export default async function TrafficReportsAdminPage() {
  if (!(await currentPlatformAdmin())) redirect('/meta/admin/login')

  return <div className="pa-shell">
    <aside className="pa-sidebar">
      <div className="pa-wordmark">proxy<span>TECHNOLOGY</span></div>
      <p className="pa-nav-label">PLATAFORMA META</p>
      <nav aria-label="Administração">
        <Link href="/meta/admin">Conexões <span>03</span></Link>
        <Link className="pa-nav-active" href="/meta/admin/ads">Relatórios de tráfego <span>↗</span></Link><Link href="/meta/admin/ads/accounts">Contas de anúncios <span>↗</span></Link>
      </nav>
      <div className="pa-sidebar-bottom">Acesso da plataforma<br/><strong>Consulta administrativa</strong></div>
    </aside>

    <div className="pa-workspace">
      <header className="pa-topbar">
        <span>Meta Provider <span className="pa-muted">/ Relatórios de tráfego</span></span>
        <form action={logoutAdmin}><button className="pa-text-button">Sair</button></form>
      </header>

      <main className="pa-main">
        <div className="pa-heading">
          <div>
            <p className="pa-eyebrow">META ADS · MARKETING API</p>
            <h1>Relatórios de tráfego</h1>
            <p className="pa-lead">Acesso administrativo aos relatórios das contas de anúncios autorizadas pela Proxy.</p>
          </div>
          <span className="pa-mode">SOMENTE LEITURA</span>
        </div>

        <section className="pa-quick-access">
          <div><p className="pa-eyebrow">OPERAÇÃO</p><h2>Contas de anúncios</h2><p>Consulte as contas autorizadas, pesquise por cliente e abra o relatório individual sem passar pelo fluxo técnico de review.</p></div>
          <Link className="pa-button pa-button-link" href="/meta/admin/ads/accounts">Abrir contas de anúncios <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="pa-report-grid">
          <article className="pa-report-card">
            <p className="pa-eyebrow">1 · AUTORIZAÇÃO</p>
            <h2>Atualizar dados da Meta</h2>
            <p>Use o fluxo ads_read para autenticar a sessão e carregar as contas e métricas disponíveis pela Marketing API.</p>
            <Link className="pa-button pa-button-link" href="/meta/review/ads-read">Abrir autorização ads_read <span aria-hidden="true">↗</span></Link>
          </article>

          <article className="pa-report-card">
            <p className="pa-eyebrow">2 · RELATÓRIO</p>
            <h2>Abrir relatório por conta</h2>
            <p>Informe o ID da conta de anúncios. O relatório usa os dados já carregados na sessão Meta deste navegador.</p>
            <form className="pa-report-form" action="/meta/review/ads-read/client-report" method="get">
              <label>
                ID da conta
                <input name="account_id" placeholder="act_1234567890" required pattern="act_[0-9]+" />
              </label>
              <button className="pa-button" type="submit">Abrir relatório</button>
            </form>
          </article>
        </section>

        <section className="pa-note">
          <h2>Estado atual da integração</h2>
          <p>Esta central torna o acesso operacional mais simples, mas não altera a arquitetura atual: os dados do relatório ainda dependem da sessão ads_read autorizada no navegador. O vínculo permanente entre cliente, conta de anúncios e dados persistidos será uma etapa posterior, quando a Marketing API estiver operando de forma estável para produção.</p>
        </section>

        <section className="pa-section-title">
          <h2>Como usar agora</h2>
          <span>Fluxo administrativo</span>
        </section>
        <dl className="pa-diagnostics">
          <div><dt>Primeiro acesso ou sessão expirada</dt><dd>Atualizar dados da Meta</dd></div>
          <div><dt>Sessão válida e conta conhecida</dt><dd>Abrir relatório por account_id</dd></div>
          <div><dt>Diagnóstico técnico / homologação</dt><dd><Link className="pa-detail-link" href="/meta/review/ads-read">Abrir fluxo técnico ↗</Link></dd></div>
        </dl>

        <footer className="pa-footer">
          <span>Proxy Technology · Meta Provider</span>
          <span>Relatórios em modo somente leitura</span>
        </footer>
      </main>
    </div>
  </div>
}
