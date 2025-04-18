"use client"

import React, { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin } from "lucide-react"
import ContactForm from "@/components/ContactForm"
import ClientOnly from "@/components/client-only"
import Link from "next/link"

// ContactForm loading fallback
function ContactFormLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded mb-6 w-4/5"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}

// Safe component that uses Suspense
function ContactFormWithSuspense() {
  return (
    <Suspense fallback={<ContactFormLoading />}>
      <ContactForm />
    </Suspense>
  );
}

export default function ContactClientWrapper() {
  return (
    <section id="contact" className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#0E5D7F]">Get in Touch</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 h-full">
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <p className="text-muted-foreground mb-6">
                Have questions or want to learn more about BeyondMeasure? We're here to help.
                Fill out the form or contact us directly.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-3 text-[#E96951]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-sm text-muted-foreground">support@gobeyondmeasure.org</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 text-[#E96951]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Phone</h4>
                    <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 text-[#E96951]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Address</h4>
                    <p className="text-sm text-muted-foreground">123 Education Lane, Suite 400</p>
                    <p className="text-sm text-muted-foreground">San Francisco, CA 94107</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium mb-2">Schedule a Demo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Want to see BeyondMeasure in action? Schedule a personalized demo with one of our education
                  specialists.
                </p>
                <Link href="/setup-demo?source=contact">
                  <Button className="mt-4 bg-[#3AB5E9] hover:bg-[#3AB5E9]/90">Book a Demo</Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Wrap ContactForm in ClientOnly and Suspense */}
          <ClientOnly fallback={<ContactFormLoading />}>
            <ContactFormWithSuspense />
          </ClientOnly>
        </div>
      </div>
    </section>
  )
} 