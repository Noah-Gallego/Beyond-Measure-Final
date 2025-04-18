"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle, 
  FileText, 
  DollarSign, 
  Package, 
  Mail, 
  Phone 
} from "lucide-react"
import { ScrollToSection } from "@/components/scroll-to-section"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LoginDialog } from "@/components/auth/login-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import WrappedContactForm from "@/components/WrappedContactForm"
import ClientOnly from "@/components/client-only"
import SearchWrapper from "@/components/SearchWrapper"

// Client component to handle initial state
function ClientHomeWrapper() {
  const [loginOpen, setLoginOpen] = useState(false)
  
  return (
    <Suspense fallback={
      <div className="bg-gradient-to-b from-sun-light to-white py-12 md:py-16 min-h-[70vh] flex items-center">
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
              
              {/* Placeholder for search component while loading */}
              <div className="mt-4 mb-6">
                <div className="max-w-3xl mx-auto relative">
                  <div className="bg-white rounded-full shadow-lg pl-5 pr-5 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                    <div className="text-sky flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                    </div>
                    <div className="flex-1 min-w-0 text-navy opacity-60 truncate">Find a project to fund now</div>
                    <div className="rounded-full bg-navy text-white px-4 py-2 font-medium ml-auto whitespace-nowrap flex-shrink-0">Fund Now</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 rounded-2xl h-[550px] w-[550px]"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SuspendedHomeContent loginOpen={loginOpen} setLoginOpen={setLoginOpen} />
    </Suspense>
  )
}

// Content component with client-side functionality
function SuspendedHomeContent({ loginOpen, setLoginOpen }: { loginOpen: boolean, setLoginOpen: (open: boolean) => void }) {
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
                
                {/* Add placeholder for search component */}
                <div className="mt-4 mb-6">
                  <div className="max-w-3xl mx-auto relative">
                    <div className="bg-white rounded-full shadow-lg pl-5 pr-5 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <div className="text-sky flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                      </div>
                      <div className="flex-1 min-w-0 text-navy opacity-60 truncate">Find a project to fund now</div>
                      <button className="rounded-full bg-navy text-white px-4 py-2 font-medium ml-auto whitespace-nowrap flex-shrink-0">Fund Now</button>
                    </div>
                  </div>
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
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo-full.svg"
                  alt="Beyond Measure"
                  width={172}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex">
                <ScrollToSection sections={sections} />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setLoginOpen(true)}
                  variant="outline"
                  className="hidden sm:flex bg-white text-navy border-none hover:bg-gray-100"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => setLoginOpen(true)}
                  className="hidden sm:flex bg-navy text-white hover:bg-navy/90"
                >
                  Sign up
                </Button>
                <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        id="hero"
        className="bg-gradient-to-b from-sun-light to-white py-12 md:py-16 pt-32 min-h-[70vh] flex items-center"
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
              
              {/* Add SearchWrapper with explicit client-only rendering */}
              <div className="mt-4 mb-6">
                <Suspense fallback={
                  <div className="max-w-3xl mx-auto relative">
                    <div className="bg-white rounded-full shadow-lg pl-5 pr-5 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <div className="text-sky flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                      </div>
                      <div className="flex-1 min-w-0 text-navy opacity-60 truncate">Find a project to fund now</div>
                      <div className="rounded-full bg-navy text-white px-4 py-2 font-medium ml-auto whitespace-nowrap flex-shrink-0">Fund Now</div>
                    </div>
                  </div>
                }>
                  <ClientOnly>
                    <SearchWrapper />
                  </ClientOnly>
                </Suspense>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-8">
                <Button asChild className="rounded-full text-white bg-navy hover:bg-navy/90 px-6">
                  <Link href="/projects">Browse Projects</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-navy text-navy hover:bg-gray-100 px-6"
                >
                  <Link href="/projects/create">Submit a Project</Link>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-navy">Trusted Platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-navy">100% to Schools</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-navy">Tax Deductible</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/hero-image.png"
                alt="Students in classroom"
                width={550}
                height={550}
                className="rounded-2xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-12 md:py-24 bg-white"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-navy">How It Works</h2>
              <p className="max-w-[900px] text-navy md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform connects donors with private schools to fund educational projects and student needs.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card className="relative overflow-hidden border-none shadow-md">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-sky/10"></div>
              <CardHeader>
                <FileText className="h-9 w-9 text-sky" />
                <CardTitle className="text-navy text-xl mt-4">1. Submit a Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-navy opacity-80">
                  Private schools can submit their educational project needs, including detailed information and funding goals.
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-none shadow-md">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-sky/10"></div>
              <CardHeader>
                <DollarSign className="h-9 w-9 text-sky" />
                <CardTitle className="text-navy text-xl mt-4">2. Fund a Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-navy opacity-80">
                  Donors can browse projects, make tax-deductible contributions, and track the impact of their donations.
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-none shadow-md">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-sky/10"></div>
              <CardHeader>
                <Package className="h-9 w-9 text-sky" />
                <CardTitle className="text-navy text-xl mt-4">3. Complete the Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-navy opacity-80">
                  Schools receive the funds when the project is fully funded, implement their plan, and share updates with donors.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-12">
            <Button
              asChild
              className="bg-navy text-white hover:bg-navy/90 px-8 py-6 rounded-full text-lg"
            >
              <Link href="/projects/create">Submit Your Project</Link>
            </Button>
          </div>
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
                <Button variant="sky" className="rounded-full" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button variant="outline" className="rounded-full border-sky text-sky hover:bg-sky/10" asChild>
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

// Loading fallback component for the entire page
function HomeLoading() {
  return (
    <div className="bg-gradient-to-b from-sun-light to-white py-12 md:py-16 min-h-[70vh] flex items-center">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-3">
              <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="mt-4 mb-6">
              <div className="max-w-3xl mx-auto relative">
                <div className="bg-white rounded-full shadow-lg pl-5 pr-5 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                  <div className="text-sky flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  </div>
                  <div className="flex-1 min-w-0 text-navy opacity-60 truncate">Find a project to fund now</div>
                  <div className="rounded-full bg-navy text-white px-4 py-2 font-medium ml-auto whitespace-nowrap flex-shrink-0">Fund Now</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 rounded-2xl h-[550px] w-[550px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export - Double wrapped in Suspense for safety
export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <Suspense fallback={<HomeLoading />}>
        <ClientHomeWrapper />
      </Suspense>
    </Suspense>
  )
}