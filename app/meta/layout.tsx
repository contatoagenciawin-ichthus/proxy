import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meta App Review",
  description:
    "Proxy Technology review environment for Meta Login, WhatsApp Embedded Signup, and authorized business asset verification.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  openGraph: {
    title: "Proxy Technology | Meta App Review",
    description:
      "Review environment for Meta Login, WhatsApp Embedded Signup, and authorized business asset verification.",
    locale: "en_US",
  },
}

export default function MetaLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div lang="en">{children}</div>
}
