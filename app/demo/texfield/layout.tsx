import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Texfield | Central de Relacionamento',
  description: 'Ambiente demonstrativo da plataforma de relacionamento da Proxy Technology para a Texfield.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function TexfieldDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
