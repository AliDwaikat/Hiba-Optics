import Hero from '../components/Hero'
import FeaturedProducts from '../components/home/FeaturedProducts'
import BrandStatement from '../components/home/BrandStatement'
import Services from '../components/home/Services'
import BranchesTeaser from '../components/home/BranchesTeaser'
import ClosingCTA from '../components/home/ClosingCTA'

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
      <BrandStatement />
      <Services />
      <BranchesTeaser />
      <ClosingCTA />
    </main>
  )
}
