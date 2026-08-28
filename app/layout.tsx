import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Proxy Technology | Software, IA, automações e integrações',
  description:
    'A Proxy Technology desenvolve produtos digitais, sistemas sob medida, CRM, automações, inteligência artificial e integrações com WhatsApp Business, e-mail, APIs e dados.',
  generator: 'Proxy Technology',
  metadataBase: new URL('https://proxy.ichthusmkt.com.br'),
  openGraph: {
    title: 'Proxy Technology | Software, IA, automações e integrações',
    description:
      'Produtos próprios e sistemas sob medida conectando atendimento, CRM, dados, IA e canais de comunicação.',
    url: 'https://proxy.ichthusmkt.com.br',
    siteName: 'Proxy Technology',
    locale: 'pt_BR',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-black text-white`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
