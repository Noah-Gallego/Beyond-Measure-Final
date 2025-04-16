import { AboutClientContent } from "@/components/about/about-client-content"
import { ErrorBoundary } from "@/components/error-boundary"

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#0E5D7F] py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                About BeyondMeasure
              </h1>
              <p className="mx-auto max-w-[700px] text-[#F7DBA7] md:text-xl">
                Our mission is to connect passionate donors with teachers to create meaningful change in classrooms across the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client-side rendered content wrapped in ErrorBoundary */}
      <ErrorBoundary>
        <AboutClientContent />
      </ErrorBoundary>
    </>
  )
}
