import { Header } from "@/components/proxy/header"
import { CinematicHero } from "@/components/proxy/cinematic-hero"
import { Manifesto } from "@/components/proxy/manifesto"
import { ProductGrid2 } from "@/components/proxy/product-grid2"
import { Group } from "@/components/proxy/group"
import { Connect } from "@/components/proxy/connect"
import { Roadmap } from "@/components/proxy/roadmap"
import { Footer } from "@/components/proxy/footer"

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      <Header />
      <CinematicHero />
      <Manifesto />
      <ProductGrid2 />
      <Group />
      <Connect />
      <Roadmap />
      <Footer />
    </main>
  )
}