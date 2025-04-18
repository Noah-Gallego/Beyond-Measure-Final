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
        {/* Modern top banner */}
        <div className="w-full bg-gradient-to-r from-navy via-sky to-sun py-3 px-4 text-white flex justify-between items-center sticky top-0 z-50 shadow-md">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Beyond Measure"
              width={40}
              height={40}
              className="h-8 w-auto rounded-md border-2 border-white shadow-sm"
            />
            <span className="font-bold text-lg tracking-tight">Beyond Measure</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-sun transition-colors text-sm md:text-base hidden md:inline-block">
              About Us
            </Link>
            <Link href="/projects" className="hover:text-sun transition-colors text-sm md:text-base hidden md:inline-block">
              Projects
            </Link>
            <Link href="/contact" className="hover:text-sun transition-colors text-sm md:text-base hidden md:inline-block">
              Contact
            </Link>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setLoginOpen(true)}
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/20 text-sm h-8 px-3"
              >
                Log in
              </Button>
              <Button
                onClick={() => setLoginOpen(true)}
                className="bg-sun text-navy hover:bg-sun/90 text-sm h-8 px-3"
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>

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
      {/* Modern top banner */}
      <div className="w-full bg-gradient-to-r from-navy via-sky to-sun py-3 px-4 text-white flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Beyond Measure"
            width={40}
            height={40}
            className="h-8 w-auto rounded-md border-2 border-white shadow-sm"
          />
          <span className="font-bold text-lg tracking-tight">Beyond Measure</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-sun transition-colors text-sm md:text-base hidden md:inline-block">
            About Us
          </Link>
          <Link href="/projects" className="hover:text-sun transition-colors text-sm md:text-base hidden md:inline-block">
            Projects
          </Link>
          <Link href="/contact" className="hover:text-sun transition-colors text-sm md:text-base hidden md:inline-block">
            Contact
          </Link>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setLoginOpen(true)}
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/20 text-sm h-8 px-3"
            >
              Log in
            </Button>
            <Button
              onClick={() => setLoginOpen(true)}
              className="bg-sun text-navy hover:bg-sun/90 text-sm h-8 px-3"
            >
              Sign up
            </Button>
          </div>
        </div>
      </div>

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
                  A crowdsourcing platform where passionate donors come together to support private school teachers
                  and students, creating a ripple effect of positive change in education.
                </p>
              </div>
              
              {/* Left-aligned search wrapper */}
              <div className="mt-4 mb-6 ml-0">
                <Suspense fallback={
                  <div className="max-w-3xl relative">
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
                    <div className="max-w-3xl">
                      <SearchWrapper />
                    </div>
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
                src="/hero-image.jpg"
                alt="Students in classroom"
                width={550}
                height={550}
                className="rounded-2xl shadow-lg object-cover"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-white border-none shadow-md">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sun flex items-center justify-center">
                    <FileText className="h-5 w-5 text-navy" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-medium text-navy">1. Create a Project</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                <div className="aspect-video overflow-hidden rounded-lg mb-4">
                  <Image
                    src="/how-it-works-1.jpg"
                    alt="Teacher creating a project"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-700">
                  Teachers create detailed project proposals outlining the educational needs, funding goals, and direct 
                  impact on student experience. Every project is reviewed for authenticity and impact.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-md">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sun flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-navy" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-medium text-navy">2. Receive Funding</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                <div className="aspect-video overflow-hidden rounded-lg mb-4">
                  <Image
                    src="/how-it-works-2.jpg"
                    alt="Donors funding a project"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-700">
                  Donors browse projects, contribute any amount, and track the project's funding progress. 
                  100% of donations go directly to the project with no administrative fees.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-md">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sun flex items-center justify-center">
                    <Package className="h-5 w-5 text-navy" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-medium text-navy">3. Impact Students</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                <div className="aspect-video overflow-hidden rounded-lg mb-4">
                  <Image
                    src="/how-it-works-3.jpg"
                    alt="Students benefiting from the project"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-700">
                  Funded projects are implemented in classrooms, enhancing educational experiences. 
                  Teachers share updates and results, connecting donors to the impact of their contributions.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-12">
            <Button
              asChild
              className="bg-navy text-white hover:bg-navy/90 px-8 py-6 rounded-full text-lg"
            >
              <Link href="/projects/create">Get Funded Now!</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gradient-to-b from-navy to-navy/90 py-24 text-white min-h-screen flex items-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">Making A Difference</h2>
              <p className="max-w-[900px] text-sun md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-light opacity-90">
                See how Beyond Measure transforms educational experiences for students across the country
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
            <Card className="bg-white border-none shadow-md transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4 mb-4">
                  <Image
                    src="/testimonial-1.jpg"
                    alt="Elementary Student"
                    width={120}
                    height={120}
                    className="rounded-full h-24 w-24 object-cover border-4 border-sun"
                  />
                  <div className="text-center">
                    <p className="font-medium text-navy">Emma's Classroom</p>
                    <p className="text-sm text-gray-500">Elementary School</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  "The new science equipment has made learning so much fun! We get to do real experiments now instead of just reading about them in books."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-md transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4 mb-4">
                  <Image
                    src="/testimonial-2.jpg"
                    alt="Student Group Project"
                    width={120}
                    height={120}
                    className="rounded-full h-24 w-24 object-cover border-4 border-sun"
                  />
                  <div className="text-center">
                    <p className="font-medium text-navy">Westlake High</p>
                    <p className="text-sm text-gray-500">STEM Program</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  "Our robotics team wouldn't exist without Beyond Measure. The funding helped us purchase equipment that's sparked interest in engineering careers."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-md transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4 mb-4">
                  <Image
                    src="/testimonial-3.jpg"
                    alt="Creative Classroom"
                    width={120}
                    height={120}
                    className="rounded-full h-24 w-24 object-cover border-4 border-sun"
                  />
                  <div className="text-center">
                    <p className="font-medium text-navy">Creative Arts Academy</p>
                    <p className="text-sm text-gray-500">Music Department</p>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  "The instruments we received have transformed our music program. Students who never had access to quality instruments are now discovering their talents."
                </p>
              </CardContent>
            </Card>
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
              <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden">
                <Image
                  src="/about-image.jpg"
                  alt="Students collaborating"
                  fill
                  className="object-cover"
                />
              </div>
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