import Hero from '../components/Hero'
import BrandStatement from '../components/home/BrandStatement'
import Services from '../components/home/Services'
import BranchesTeaser from '../components/home/BranchesTeaser'
import ClosingCTA from '../components/home/ClosingCTA'

export default function Home() {
  return (
    <main>
      <Hero />
      <BrandStatement />
      <Services />
      <BranchesTeaser />
      <ClosingCTA />
    </main>
  )
}
