import type React from "react"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin } from "lucide-react"
import ContactForm from "@/components/ContactForm"
import { Suspense } from "react"
import ClientOnly from "@/components/client-only"
import ContactClientWrapper from "@/components/ContactClientWrapper"

// Main export - server component
export default function ContactPage() {
  return (
    <>
      {/* Hero Section - Server Component */}
      <section className="bg-[#E96951] py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">Contact Us</h1>
              <p className="mx-auto max-w-[700px] text-white/90 md:text-xl">
                We'd love to hear from you. Reach out with questions, feedback, or to schedule a demo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Content wrapped in Suspense */}
      <Suspense fallback={<div className="container py-16 text-center">Loading contact information...</div>}>
        <ContactClientWrapper />
      </Suspense>
    </>
  )
}
