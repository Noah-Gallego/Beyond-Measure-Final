"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

// Component for counting up numbers for stats
function CountUpNumber({ end, label }: { end: number; label: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 2000
    const increment = end / (duration / 16) // Update every ~16ms for smooth animation
    
    // Don't start immediately
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(interval)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(interval)
    }, 500) // Delay start
    
    return () => clearTimeout(timer)
  }, [end])

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-navy">{count.toLocaleString()}</div>
      <div className="text-md text-muted-foreground mt-2">{label}</div>
    </div>
  )
}

// This component will handle any client-side interactions
export function AboutInteractiveElements() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <section className="py-16 md:py-24 bg-sky/5">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-sky bg-sky/10 px-3 py-1 text-sm text-sky">
              Our Impact
            </div>
            <h2 className="text-3xl font-bold tracking-tighter text-navy sm:text-4xl">
              Making a Difference Together
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Through our platform, we've helped thousands of teachers get the resources they need.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-white/80 border-sky/10">
            <CardContent className="p-6">
              <CountUpNumber end={15736} label="Projects Funded" />
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-sun/10">
            <CardContent className="p-6">
              <CountUpNumber end={523491} label="Students Impacted" />
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-coral/10">
            <CardContent className="p-6">
              <CountUpNumber end={8524} label="Teachers Supported" />
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-navy/10">
            <CardContent className="p-6">
              <CountUpNumber end={4532761} label="Dollars Raised" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
