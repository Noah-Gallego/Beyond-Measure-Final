import { Suspense } from "react"
import FAQContentWrapper from "@/components/FAQContentWrapper"

// Loading component for the page
function FAQLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin h-10 w-10 border-4 border-[#3AB5E9] border-t-transparent rounded-full"></div>
    </div>
  );
}

// Main export - server component
export default function FAQPage() {
  return (
    <>
      {/* Hero Section - Server Component */}
      <section className="bg-[#3AB5E9] py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Frequently Asked Questions
              </h1>
              <p className="mx-auto max-w-[700px] text-white/90 md:text-xl">
                Find answers to common questions about our teacher crowdfunding platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client-side FAQ content with proper Suspense */}
      <Suspense fallback={<FAQLoading />}>
        <FAQContentWrapper />
      </Suspense>
    </>
  )
}
