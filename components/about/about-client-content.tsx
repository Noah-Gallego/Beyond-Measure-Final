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
                  Founded for Community Impact
                </h2>
                <p className="text-muted-foreground">
                  The SeedCore Foundation emerged from a passion to support community development and entrepreneurship in Bakersfield, California. Founded by John-Paul and Ingrid Lake, SeedCore aims to create meaningful impact with the resources entrusted to us while building a stronger, more vibrant community.
                </p>
                <p className="text-muted-foreground">
                  What began as a personal mission to responsibly steward finances and set an example for the next generation has grown into a foundation focused on creating positive change throughout Kern County. Through strategic partnerships and targeted initiatives, we're fostering entrepreneurship-led economic development in our region.
                </p>
                <p className="text-muted-foreground">
                  Every initiative we support represents our vision for a thriving community where entrepreneurs have the resources they need to succeed. We believe that when we invest directly in our community, everyone benefits from increased opportunity and prosperity.
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
                title: "Community Development",
                description: "We believe in strengthening our community by supporting initiatives that foster sustainable economic growth and opportunity for all.",
                color: "border-sky/20 bg-sky/5",
              },
              {
                title: "Entrepreneurship",
                description: "We champion innovation and entrepreneurial spirit, providing resources and support to help new businesses thrive in our region.",
                color: "border-coral/20 bg-coral/5",
              },
              {
                title: "Strategic Partnership",
                description: "We connect resources with needs through thoughtful partnerships that create meaningful change in our community.",
                color: "border-sun/20 bg-sun/5",
              },
              {
                title: "Integrity",
                description: "We believe in complete transparency and responsible stewardship of the resources entrusted to us.",
                color: "border-sun-light/20 bg-sun-light/5",
              },
              {
                title: "Family Legacy",
                description: "We are committed to setting an example of giving and community leadership for future generations.",
                color: "border-navy/20 bg-navy/5",
              },
              {
                title: "Local Focus",
                description: "We prioritize making an impact in Kern County, focusing our efforts where we can create the most meaningful change.",
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
                Meet the People Behind SeedCore
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our leadership team brings together expertise in business, community development, and entrepreneurship.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                name: "John-Paul Lake",
                role: "Treasurer & Co-Founder",
                bio: "John-Paul Lake is the Treasurer and Co-Founder of the SeedCore Foundation. He is a community and business leader based in Bakersfield, California. Beyond his role at SeedCore, he serves on the Board of Directors for the California State University, Bakersfield (CSUB) Foundation, contributing to initiatives that support entrepreneurship and education in the region.",
                image: "/founder1.jpg",
              },
              {
                name: "Ingrid Lake",
                role: "President & Co-Founder",
                bio: "Ingrid Lake is the President and Co-Founder of the SeedCore Foundation. Alongside her husband, John-Paul, she established the foundation to steward their finances effectively, set an example of giving and community-building for their children, and make a meaningful impact with the resources entrusted to them.",
                image: "/founder2.jpg",
              },
              {
                name: "Danielle Patterson",
                role: "Director",
                bio: "Danielle Patterson serves as the Director of the SeedCore Foundation. She oversees the Kern Initiative for Talent & Entrepreneurship (KITE), a private-public partnership focused on entrepreneurship-led economic development. With a background as a business owner, Danielle brings firsthand experience to her role, emphasizing the importance of communication and understanding the economic makeup of the county to support entrepreneurs effectively.",
                image: "/founder3.jpg",
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
