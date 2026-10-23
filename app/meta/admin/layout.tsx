import type { Metadata } from 'next'
import './admin.css'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {
  title: 'Administração Meta · Proxy',
  description: 'Administração restrita das integrações da Proxy Technology.',
  robots: { index: false, follow: false, noarchive: true },
}
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div lang="pt-BR" className="provider-admin">{children}</div>
}
