const fallbackSiteUrl = "https://proxy.ichthusmkt.com.br"

function normalizeSiteUrl(value?: string) {
  const candidate = value?.trim() || fallbackSiteUrl
  return candidate.replace(/\/$/, "")
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL,
)

export const siteName = "Proxy Technology"
export const siteDescription =
  "A Proxy Technology desenvolve produtos digitais, sistemas sob medida, IA, CRM e infraestrutura de audiência própria com e-mail, WhatsApp Business, APIs e dados."
