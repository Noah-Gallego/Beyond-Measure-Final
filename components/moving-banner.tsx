"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Instagram } from "lucide-react"

export function MovingBanner() {
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle hover with smooth transition
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  return (
    <div
      className="bg-[#A8BF87] py-2 text-white overflow-hidden cursor-pointer font-light relative"
      style={{
        fontFamily: "var(--font-playfair)",
        letterSpacing: "0.05em",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href="https://instagram.com/GoBeyondMeasure" target="_blank" rel="noopener noreferrer">
        <div className="marquee-container">
          <div 
            ref={containerRef} 
            className="marquee-content"
            style={{
              animationPlayState: isHovered ? "paused" : "running"
            }}
          >
            {/* First set of items */}
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="flex items-center mx-6 transition-all duration-300 hover:scale-105">
                <Instagram className="mr-2 h-4 w-4 text-[#E96951]" />
                <span className="mr-1">Follow</span>
                <span className="font-medium text-[#E96951]">@GoBeyondMeasure</span>
                <span className="ml-1">on Instagram</span>
              </div>
            ))}
          </div>
          <div 
            className="marquee-content"
            style={{
              animationPlayState: isHovered ? "paused" : "running"
            }}
          >
            {/* Second set of items (duplicate for continuous flow) */}
            {[7, 8, 9, 10, 11, 12].map((index) => (
              <div key={index} className="flex items-center mx-6 transition-all duration-300 hover:scale-105">
                <Instagram className="mr-2 h-4 w-4 text-[#E96951]" />
                <span className="mr-1">Follow</span>
                <span className="font-medium text-[#E96951]">@GoBeyondMeasure</span>
                <span className="ml-1">on Instagram</span>
              </div>
            ))}
          </div>
        </div>
      </Link>

      {/* CSS Animations */}
      <style jsx global>{`
        .marquee-container {
          position: relative;
          width: 100%;
          height: 24px;
          overflow: hidden;
          display: flex;
        }
        
        .marquee-content {
          display: flex;
          animation: marquee 20s linear infinite;
          white-space: nowrap;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
