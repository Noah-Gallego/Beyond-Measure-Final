"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin } from "lucide-react"
import ContactForm from "@/components/ContactForm"

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
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

      {/* Contact Content */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0E5D7F]">Get in Touch</h2>
                <p className="mt-2 text-muted-foreground">
                  Have questions about BeyondMeasure? Our team is here to help. Fill out the form and we'll get back to
                  you as soon as possible.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <Mail className="mt-1 h-5 w-5 text-[#3AB5E9]" />
                  <div>
                    <h3 className="font-semibold text-[#0E5D7F]">Email Us</h3>
                    <p className="text-sm text-muted-foreground">For general inquiries: info@beyondmeasure.edu</p>
                    <p className="text-sm text-muted-foreground">For support: support@beyondmeasure.edu</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="mt-1 h-5 w-5 text-[#E96951]" />
                  <div>
                    <h3 className="font-semibold text-[#0E5D7F]">Call Us</h3>
                    <p className="text-sm text-muted-foreground">Main Office: (555) 123-4567</p>
                    <p className="text-sm text-muted-foreground">Support Line: (555) 987-6543</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 h-5 w-5 text-[#A8BF87]" />
                  <div>
                    <h3 className="font-semibold text-[#0E5D7F]">Visit Us</h3>
                    <p className="text-sm text-muted-foreground">123 Education Lane</p>
                    <p className="text-sm text-muted-foreground">Learning City, ED 12345</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-[#F7DBA7]/20 p-6">
                <h3 className="font-semibold text-[#0E5D7F]">Schedule a Demo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Want to see BeyondMeasure in action? Schedule a personalized demo with one of our education
                  specialists.
                </p>
                <Button className="mt-4 bg-[#3AB5E9] hover:bg-[#3AB5E9]/90">Book a Demo</Button>
              </div>
            </div>
            
            {/* Use the ContactForm component */}
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
