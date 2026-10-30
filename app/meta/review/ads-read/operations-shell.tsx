"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdsReadOperationsShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const inReport = pathname.includes("/client-report") || pathname.includes("/pet-endoscopia")
  const inAuthorization = !inReport

  return (
    <div className="provider-admin">
      <div className="pa-shell">
        <aside className="pa-sidebar">
          <div className="pa-wordmark">proxy<span>TECHNOLOGY</span></div>
          <p className="pa-nav-label">META PLATFORM</p>
          <nav aria-label="Meta administration">
            <Link href="/meta/admin">Connections <span>↗</span></Link>
            <Link href="/meta/admin/ads">Traffic reports <span>↗</span></Link>
            <Link
              className={inAuthorization ? "pa-nav-active" : ""}
              href="/meta/review/ads-read"
            >
              Meta Authorization <span>ads_read</span>
            </Link>
            {inReport ? (
              <span className="pa-nav-current">Open report <span>●</span></span>
            ) : null}
          </nav>
          <div className="pa-sidebar-bottom">
            Marketing API<br />
            <strong>Read-only flow</strong>
          </div>
        </aside>

        <div className="pa-workspace">
          <header className="pa-topbar">
            <span>
              Meta Provider <span className="pa-muted">/ Traffic and reports</span>
            </span>
            <Link className="pa-detail-link" href="/meta/admin/ads">
              Back to dashboard
            </Link>
          </header>
          <div className="pa-flow-content">{children}</div>
        </div>
      </div>
    </div>
  )
}
