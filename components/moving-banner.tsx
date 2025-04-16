"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function MovingBanner() {
  const [animate, setAnimate] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pause animation on hover
  const handleMouseEnter = () => setAnimate(false)
  const handleMouseLeave = () => setAnimate(true)

  return (
    <div
      className="bg-grass py-2 text-white overflow-hidden cursor-pointer font-light"
      style={{
        fontFamily: "var(--font-playfair)",
        letterSpacing: "0.05em",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href="https://instagram.com/GoBeyondMeasure" target="_blank" rel="noopener noreferrer">
        <div className="flex items-center justify-center">
          <div ref={containerRef} className={cn("flex items-center whitespace-nowrap", animate && "animate-marquee")}>
            <div className="flex items-center mx-4">
              <span>Follow @GoBeyondMeasure on Instagram for updates</span>
            </div>
            <div className="flex items-center mx-4">
              <span>Follow @GoBeyondMeasure on Instagram for updates</span>
            </div>
            <div className="flex items-center mx-4">
              <span>Follow @GoBeyondMeasure on Instagram for updates</span>
            </div>
            <div className="flex items-center mx-4">
              <span>Follow @GoBeyondMeasure on Instagram for updates</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
