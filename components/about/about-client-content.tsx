"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AboutInteractiveElements } from "@/components/about/interactive-elements"

export function AboutClientContent() {
  // Add state to track client-side mounting
  const [isMounted, setIsMounted] = useState(false)

  // Set isMounted to true after component mounts on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If not mounted yet, show a loading state
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3AB5E9]"></div>
      </div>
    )
  }

  // Full component rendered only on the client
  return (
    <>
      {/* Our Story */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-sky bg-sky/10 px-3 py-1 text-sm text-sky">
                  Our Story
                </div>
                <h2 className="text-3xl font-bold tracking-tighter text-navy sm:text-4xl">
                  Founded by Educators, for Educators
                </h2>
                <p className="text-muted-foreground">
                  BeyondMeasure emerged from our passion to support dedicated teachers who often fund classroom resources out of their own pockets. Founded in 2018 by a team of former educators who intimately understand classroom needs, our platform connects teachers with donors who want to make a real difference in education.
                </p>
                <p className="text-muted-foreground">
                  What began as a small initiative has grown into a nationwide platform that has funded over 15,000 classroom projects, benefiting more than 500,000 students. Through our crowdfunding platform, we've helped teachers access essential resources that traditional school budgets couldn't cover, from basic supplies to innovative technology.
                </p>
                <p className="text-muted-foreground">
                  Every project funded represents an educator's vision brought to life and students given new opportunities to learn and grow. We believe that when communities invest directly in classrooms, everyone benefits.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/about/founders.jpg"
                width={600}
                height={400}
                alt="Teachers and students in a classroom"
                className="rounded-lg object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-sun-light/10 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-sun bg-sun/10 px-3 py-1 text-sm text-sun">
                Our Values
              </div>
              <h2 className="text-3xl font-bold tracking-tighter text-navy sm:text-4xl">What We Stand For</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                The core values that drive our mission and guide our platform.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Educational Equity",
                description: "We believe every student deserves access to quality educational resources, regardless of their school's funding or location.",
                color: "border-sky/20 bg-sky/5",
              },
              {
                title: "Teacher Empowerment",
                description: "We champion teachers' creativity and initiative, providing them the platform to bring their classroom visions to life.",
                color: "border-coral/20 bg-coral/5",
              },
              {
                title: "Community Impact",
                description: "We connect caring donors with classrooms to create meaningful change in education that ripples through communities.",
                color: "border-sun/20 bg-sun/5",
              },
              {
                title: "Transparency",
                description: "We believe in complete transparency in how funds are used, ensuring donors see the direct impact of their contributions.",
                color: "border-sun-light/20 bg-sun-light/5",
              },
              {
                title: "Innovation",
                description: "We support creative teaching approaches that engage students and promote deeper learning experiences.",
                color: "border-navy/20 bg-navy/5",
              },
              {
                title: "Accessibility",
                description: "We make fundraising easy and accessible for all teachers, regardless of technical experience or grant-writing skills.",
                color: "border-sky/20 bg-sky/5",
              },
            ].map((value, index) => (
              <Card key={index} className={`${value.color}`}>
                <CardHeader>
                  <CardTitle className="text-navy">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-coral bg-coral/10 px-3 py-1 text-sm text-coral">
                Our Team
              </div>
              <h2 className="text-3xl font-bold tracking-tighter text-navy sm:text-4xl">
                Meet the People Behind BeyondMeasure
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our diverse team brings together expertise in education, fundraising, and technology.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              {
                name: "Dr. Elena Rodriguez",
                role: "Founder & CEO",
                bio: "Former elementary school teacher with a passion for ensuring all classrooms have the resources they need.",
                image: "/founder1.jpg",
              },
              {
                name: "Marcus Chen",
                role: "Chief Technology Officer",
                bio: "Educational technologist focused on creating accessible platforms that connect donors with classrooms.",
                image: "/founder2.jpg",
              },
              {
                name: "Aisha Johnson",
                role: "Director of Teacher Success",
                bio: "Former high school science teacher dedicated to helping educators create compelling project campaigns.",
                image: "/founder3.jpg",
              },
              {
                name: "David Park",
                role: "Head of Donor Relations",
                bio: "Nonprofit fundraising expert committed to building meaningful connections between donors and schools.",
                image: "/teacher1.jpg",
              },
            ].map((member, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <Image
                    src={member.image}
                    width={300}
                    height={300}
                    alt={member.name}
                    className="mx-auto aspect-square rounded-full object-cover shadow-sm border-2 border-sky/20"
                  />
                  <CardHeader className="p-0 pt-4 text-center">
                    <CardTitle className="text-lg text-navy">{member.name}</CardTitle>
                    <CardDescription className="text-coral">{member.role}</CardDescription>
                  </CardHeader>
                  <p className="mt-2 text-center text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <AboutInteractiveElements />
    </>
  )
}
