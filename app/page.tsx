"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, FileText, DollarSign, Package, Mail, Phone } from "lucide-react"
import { ScrollToSection } from "@/components/scroll-to-section"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LoginDialog } from "@/components/auth/login-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ContactForm from "@/components/ContactForm"
import ClientOnly from "@/components/client-only"

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Add this useEffect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Define all sections for navigation
  const sections = [
    { id: "hero", label: "Home" },
    { id: "how-it-works", label: "How It Works" },
    { id: "testimonials", label: "Testimonials" },
    { id: "about", label: "About Us" },
    { id: "faq", label: "FAQ" },
  ]

  // If not mounted yet (server-side), render a simplified version
  if (!isMounted) {
    return (
      <>
        {/* Hero Section - Simplified for SSR */}
        <section
          id="hero"
          className="bg-gradient-to-b from-sun-light to-white py-12 md:py-16 min-h-[70vh] flex items-center"
        >
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-3">
                  <h1 className="text-3xl font-normal tracking-tight text-navy sm:text-5xl xl:text-6xl">
                    Give without bounds.
                    <br />
                    Give with purpose.
                  </h1>
                  <p className="max-w-[600px] text-navy md:text-xl font-light leading-relaxed opacity-80">
                    A crowdsourcing platform where passionate donors come together to support private school teachers
                    and students, creating a ripple effect of positive change in education.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 rounded-2xl h-[550px] w-[550px]"></div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section
        id="hero"
        className="bg-gradient-to-b from-sun-light to-white py-12 md:py-16 min-h-[70vh] flex items-center"
      >
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-3">
                <h1 className="text-3xl font-normal tracking-tight text-navy sm:text-5xl xl:text-6xl">
                  Give without bounds.
                  <br />
                  Give with purpose.
                </h1>
                <p className="max-w-[600px] text-navy md:text-xl font-light leading-relaxed opacity-80">
                  A crowdsourcing platform where passionate donors come together to support private school teachers and
                  students, creating a ripple effect of positive change in education.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Button variant="sky" className="rounded-full" onClick={(e) => {
                  e.preventDefault();
                  setLoginOpen(true);
                }}>
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-salmon text-salmon hover:bg-salmon-light hover:text-salmon"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("about");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="overflow-hidden rounded-2xl shadow-soft">
                <Image
                  src="/placeholder.svg?height=550&width=550"
                  width={550}
                  height={550}
                  alt="Hero Image"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mt-8 md:mt-10">
            <ScrollToSection sections={sections} />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0E5D7F] mb-4">How it Works</h2>
            <p className="text-xl text-slate-600 max-w-3xl">
              You know what your classroom needs. We're here to help you bring those ideas to life.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-6 relative">
                <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#E96951]">1</span>
                <svg className="w-10 h-10 text-[#3AB5E9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0E5D7F] mb-3">Create Your Project</h3>
              <p className="text-slate-600">
                Design a compelling campaign for the resources your students need. Share your story and explain how these materials will enhance learning in your classroom.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mb-6 relative">
                <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#E96951]">2</span>
                <svg className="w-10 h-10 text-[#E96951]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0E5D7F] mb-3">Fund Your Classroom</h3>
              <p className="text-slate-600">
                Share your project with friends, family, and our community of donors passionate about education. Watch as contributions help you reach your funding goal.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mb-6 relative">
                <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#E96951]">3</span>
                <svg className="w-10 h-10 text-[#A8BF87]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0E5D7F] mb-3">Transform Your Teaching</h3>
              <p className="text-slate-600">
                Receive your materials and implement your vision. Share updates with your donors to show the impact of their generosity on your students' learning experiences.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center mt-12">
            <Button className="bg-[#0E5D7F] hover:bg-[#0E5D7F]/90 text-white py-3 px-8 rounded-full text-lg font-medium" onClick={(e) => {
              e.preventDefault();
              setLoginOpen(true);
            }}>
              Get Started
            </Button>
          </div>
          
          <p className="text-center mt-10 text-lg text-slate-500 italic">
            If you can imagine it, you can fund it.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-navy py-24 text-white min-h-screen flex items-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">Trusted by Educators</h2>
              <p className="max-w-[900px] text-sun md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-light opacity-90">
                Hear from teachers who have transformed their assessment practices with BeyondMeasure.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-16 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  "BeyondMeasure has completely changed how I assess student learning. I now have a much clearer picture of each student's growth.",
                author: "Sarah Johnson",
                role: "5th Grade Teacher",
              },
              {
                quote:
                  "The insights I get from BeyondMeasure help me tailor my instruction to meet the needs of every student in my classroom.",
                author: "Michael Rodriguez",
                role: "High School Science",
              },
              {
                quote:
                  "Parents love the detailed feedback they receive about their child's progress. It's opened up meaningful conversations about learning.",
                author: "Emily Chen",
                role: "Middle School English",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-navy/80 border-sky/20 text-white shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sun font-normal">
                    <CheckCircle className="h-5 w-5" />
                    Testimonial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="italic font-light">&ldquo;{testimonial.quote}&rdquo;</p>
                </CardContent>
                <CardFooter>
                  <div>
                    <p className="font-normal">{testimonial.author}</p>
                    <p className="text-sm text-sky">{testimonial.role}</p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-white py-24 min-h-screen flex items-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-[#3AB5E9] bg-[#3AB5E9]/10 px-3 py-1 text-sm text-[#3AB5E9]">
                About Us
              </div>
              <h2 className="text-3xl font-normal tracking-tight text-[#0E5D7F] sm:text-4xl md:text-5xl">Our Story</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Empowering educators to create enriched learning environments.
              </p>
            </div>
          </div>

          <div className="grid gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tighter text-[#0E5D7F]">
                  Founded by Educators, for Educators
                </h3>
                <p className="text-muted-foreground">
                  BeyondMeasure emerged from our passion to support dedicated teachers who often fund classroom resources out of their own pockets. Founded by former educators who intimately understand classroom needs, our platform connects teachers with donors who want to make a real difference in education.
                </p>
                <p className="text-muted-foreground">
                  Through our crowdfunding platform, we've helped thousands of teachers across the country bring their innovative classroom projects to life.
                </p>
                <Button variant="outline" className="mt-4 rounded-full border-[#3AB5E9] text-[#3AB5E9] hover:bg-[#3AB5E9]/10">
                  <Link href="/about">Read Our Full Story</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/placeholder.svg?height=400&width=600"
                width={600}
                height={400}
                alt="Teachers and students in a classroom"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="mt-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-[#A8BF87] bg-[#A8BF87]/10 px-3 py-1 text-sm text-[#A8BF87]">
                  Our Values
                </div>
                <h3 className="text-2xl font-bold tracking-tighter text-[#0E5D7F]">What We Stand For</h3>
                <p className="mx-auto max-w-[700px] text-muted-foreground">
                  The core values that drive our mission and guide our platform.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Educational Equity",
                  description: "We believe every student deserves access to quality educational resources, regardless of their school's funding or location.",
                  color: "border-[#3AB5E9]/20 bg-[#3AB5E9]/5",
                },
                {
                  title: "Teacher Empowerment",
                  description: "We champion teachers' creativity and initiative, providing them the platform to bring their classroom visions to life.",
                  color: "border-[#E96951]/20 bg-[#E96951]/5",
                },
                {
                  title: "Community Impact",
                  description: "We connect caring donors with classrooms to create meaningful change in education that ripples through communities.",
                  color: "border-[#A8BF87]/20 bg-[#A8BF87]/5",
                },
              ].map((value, index) => (
                <Card key={index} className={`${value.color}`}>
                  <CardHeader>
                    <CardTitle className="text-[#0E5D7F]">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-[#F7DBA7]/10 py-24 min-h-screen flex items-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-[#E96951] bg-[#E96951]/10 px-3 py-1 text-sm text-[#E96951]">
                FAQ
              </div>
              <h2 className="text-3xl font-normal tracking-tight text-[#0E5D7F] sm:text-4xl md:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Find answers to common questions about our teacher crowdfunding platform.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-3xl space-y-8 py-12">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#0E5D7F]">For Teachers</h3>
              <ClientOnly fallback={<div className="animate-pulse h-32 bg-gray-100 rounded-md"></div>}>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    {
                      question: "How do I create a classroom project?",
                      answer: "Creating a project is simple! After signing up, click 'Start a Project' on your dashboard. You'll be guided through a step-by-step process to describe your project, set a funding goal, add images, and explain how the resources will benefit your students.",
                    },
                    {
                      question: "What types of projects can I fund?",
                      answer: "You can create projects for virtually any classroom need: books, technology, art supplies, scientific equipment, field trips, classroom furniture, or special learning materials. The key is to clearly explain how these resources will enhance your students' learning experience.",
                    },
                    {
                      question: "How long does funding take?",
                      answer: "Project campaigns typically run for 30-60 days, but you can customize this timeframe. Once your project is fully funded, we'll process the funds and help you receive your materials within 2-3 weeks. If your project doesn't reach its funding goal, donors won't be charged.",
                    },
                  ].map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-[#0E5D7F]">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ClientOnly>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#0E5D7F]">For Donors</h3>
              <ClientOnly fallback={<div className="animate-pulse h-32 bg-gray-100 rounded-md"></div>}>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    {
                      question: "How do I know my donation makes an impact?",
                      answer: "Transparency is core to our platform. Teachers share updates and photos showing how your donation has been used in their classroom. You'll receive email notifications when your funded projects post updates, allowing you to see the direct impact of your generosity on student learning.",
                    },
                    {
                      question: "Are my donations tax-deductible?",
                      answer: "Yes! All donations made through our platform are tax-deductible. After making a donation, you'll receive a tax receipt via email that you can use for tax purposes.",
                    },
                    {
                      question: "Can I donate to specific schools or regions?",
                      answer: "Absolutely. You can browse projects by location, subject area, grade level, or specific needs. This allows you to support schools in your community or focus on educational areas you're passionate about.",
                    },
                  ].map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index + 5}`}>
                      <AccordionTrigger className="text-left text-[#0E5D7F]">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ClientOnly>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-[#0E5D7F]">Still have questions?</h3>
              <p className="mt-2 text-muted-foreground">
                If you couldn't find the answer you were looking for, please reach out to our support team.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="sky" className="rounded-full">
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button variant="outline" className="rounded-full border-sky text-sky hover:bg-sky/10">
                  <Link href="/faq">Browse Help Center</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Dialog */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
