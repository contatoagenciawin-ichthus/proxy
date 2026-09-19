import type { Metadata } from "next"

import { InstitutionalHome } from "@/components/proxy/institutional-home"
import { siteDescription, siteName, siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      legalName: "AGENCIA WIN LTDA",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      email: "contato@proxytechnology.com.br",
      description: siteDescription,
      areaServed: {
        "@type": "Country",
        name: "Brasil",
      },
      knowsAbout: [
        "Desenvolvimento de software",
        "Inteligência artificial aplicada",
        "Human-Centered AI",
        "CRM",
        "Automação",
        "WhatsApp Business Platform",
        "E-mail e distribuição",
        "Infraestrutura de audiência própria",
        "APIs e integrações",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Soluções Proxy Technology",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "Sistemas sob medida",
          },
          {
            "@type": "OfferCatalog",
            name: "IA aplicada e copilotos",
          },
          {
            "@type": "OfferCatalog",
            name: "CRM e automação operacional",
          },
          {
            "@type": "OfferCatalog",
            name: "WhatsApp Business e integrações Meta",
          },
          {
            "@type": "OfferCatalog",
            name: "Audiência própria e distribuição multicanal",
          },
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "pt-BR",
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <InstitutionalHome />
    </>
  )
}
