import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { siteDescription, siteName, siteUrl } from '@/lib/site'
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
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Proxy Technology | Software, IA, audiência e integrações',
    template: '%s | Proxy Technology',
  },
  description: siteDescription,
  applicationName: siteName,
  generator: siteName,
  creator: siteName,
  publisher: siteName,
  category: 'technology',
  openGraph: {
    title: 'Proxy Technology | Software, IA, audiência e integrações',
    description:
      'Produtos próprios e sistemas sob medida conectando atendimento, audiência, CRM, dados, IA, e-mail e WhatsApp Business.',
    url: siteUrl,
    siteName,
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Proxy Technology | Software, IA, audiência e integrações',
    description:
      'Produtos próprios e sistemas sob medida conectando atendimento, audiência, CRM, dados, IA, e-mail e WhatsApp Business.',
  },
  robots: {
    index: true,
    follow: true,
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
