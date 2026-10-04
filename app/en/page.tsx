import type { Metadata } from "next"

import { InternationalHome } from "@/components/proxy/international-home"
import { siteName, siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: { absolute: "Proxy Technology | Software, AI & Operational Systems" },
  description:
    "Proxy Technology builds software, applied AI, automation and integrations that connect customer operations, CRM, data and communication channels.",
  alternates: {
    canonical: "/en",
    languages: {
      "pt-BR": "/",
      en: "/en",
    },
  },
  openGraph: {
    title: "Proxy Technology | Software, AI & Operational Systems",
    description:
      "Technology designed to work inside real operations — software, applied AI, customer operations, data and integrations.",
    url: `${siteUrl}/en`,
    siteName,
    locale: "en",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Proxy Technology | Software, AI & Operational Systems",
    description:
      "Technology designed to work inside real operations — software, applied AI, customer operations, data and integrations.",
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
      description:
        "Proxy Technology builds software, applied AI, automation and integrations for real digital operations.",
      areaServed: "International",
      knowsAbout: [
        "Software development",
        "Applied artificial intelligence",
        "Human-Centered AI",
        "CRM",
        "Automation",
        "WhatsApp Business Platform",
        "Customer operations",
        "APIs and integrations",
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/en/#webpage`,
      url: `${siteUrl}/en`,
      name: "Proxy Technology | Software, AI & Operational Systems",
      inLanguage: "en",
      isPartOf: {
        "@id": `${siteUrl}/#website`,
      },
    },
  ],
}

export default function EnglishHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <InternationalHome />
    </>
  )
}
