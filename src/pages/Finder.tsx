import FinderQuiz from '../components/finder/FinderQuiz'

/** Standalone Frame Finder page. The quiz itself lives in the shared
 *  <FinderQuiz> component, reused by the site-wide finder modal. */
export default function Finder() {
  return (
    <main className="min-h-screen bg-white">
      <FinderQuiz />
    </main>
  )
}
