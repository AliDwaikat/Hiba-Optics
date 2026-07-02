import Hero from '../components/Hero'
import Services from '../components/home/Services'
import BranchesTeaser from '../components/home/BranchesTeaser'
import ClosingCTA from '../components/home/ClosingCTA'

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <BranchesTeaser />
      <ClosingCTA />
    </main>
  )
}
