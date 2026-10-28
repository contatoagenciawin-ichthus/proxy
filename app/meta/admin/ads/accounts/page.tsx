import Link from "next/link"
import { redirect } from "next/navigation"
import { currentPlatformAdmin } from "@/lib/meta-admin/auth"
import { logoutAdmin } from "../../actions"
import { MetaAdAccountsClient } from "./accounts-client"

export default async function MetaAdAccountsAdminPage() {
  if (!(await currentPlatformAdmin())) redirect("/meta/admin/login")

  return (
    <div className="pa-shell">
      <aside className="pa-sidebar">
        <div className="pa-wordmark">proxy<span>TECHNOLOGY</span></div>
        <p className="pa-nav-label">PLATAFORMA META</p>
        <nav aria-label="Administração">
          <Link href="/meta/admin">Conexões <span>03</span></Link>
          <Link href="/meta/admin/ads">Relatórios de tráfego <span>↗</span></Link>
          <Link className="pa-nav-active" href="/meta/admin/ads/accounts">Contas de anúncios <span>↗</span></Link>
        </nav>
        <div className="pa-sidebar-bottom">Meta Ads<br/><strong>Consulta administrativa</strong></div>
      </aside>

      <div className="pa-workspace">
        <header className="pa-topbar">
          <span>Meta Provider <span className="pa-muted">/ Contas de anúncios</span></span>
          <form action={logoutAdmin}><button className="pa-text-button">Sair</button></form>
        </header>

        <main className="pa-main">
          <div className="pa-heading">
            <div>
              <p className="pa-eyebrow">META ADS · MARKETING API</p>
              <h1>Contas de anúncios</h1>
              <p className="pa-lead">
                Visão operacional das contas acessíveis pela sessão Meta autorizada neste navegador.
              </p>
            </div>
            <span className="pa-mode">SOMENTE LEITURA</span>
          </div>

          <MetaAdAccountsClient />

          <section className="pa-note">
            <h2>Separação entre operação e diagnóstico</h2>
            <p>
              Esta é a interface operacional do Proxy Admin. O fluxo
              <code> /meta/review/ads-read</code> permanece disponível apenas para
              autorização, homologação e diagnóstico técnico.
            </p>
          </section>

          <footer className="pa-footer">
            <span>Proxy Technology · Meta Ads</span>
            <span>Visão multi-cliente restrita à administração da plataforma</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
