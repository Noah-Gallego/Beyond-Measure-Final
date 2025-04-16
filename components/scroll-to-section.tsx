"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface ScrollToSectionProps {
  sections: {
    id: string
    label: string
  }[]
  className?: string
  variant?: "primary" | "secondary" | "minimal"
}

export function ScrollToSection({ sections, className, variant = "primary" }: ScrollToSectionProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    if (typeof window !== "undefined") {
      const handleScroll = () => {
        const scrollPosition = window.scrollY + 100 // Offset for header

        // Find the section that is currently in view
        for (const section of sections) {
          const element = document.getElementById(section.id)
          if (element) {
            const { top, bottom } = element.getBoundingClientRect()
            if (top <= 100 && bottom >= 100) {
              setActiveSection(section.id)
              break
            }
          }
        }
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [sections])

  const scrollToSection = (id: string, event?: React.MouseEvent) => {
    if (!isMounted || typeof window === "undefined") return
    
    if (event) {
      event.preventDefault()
    }

    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  // If not mounted yet (server-side), render a simplified version
  if (!isMounted) {
    return <div className={className}></div>
  }

  if (variant === "primary") {
    return (
      <div className={cn("flex flex-wrap justify-center gap-2", className)}>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant="outline"
            className={cn("rounded-full transition-all bg-sky/10 border-sky text-sky hover:bg-sky/20")}
            scrollToId={section.id}
          >
            {section.label}
          </Button>
        ))}
      </div>
    )
  }

  if (variant === "secondary") {
    return (
      <div className={cn("flex flex-wrap justify-center gap-2", className)}>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant="ghost"
            className={cn(
              "transition-all hover:bg-transparent",
              activeSection === section.id ? "text-salmon" : "text-navy",
            )}
            scrollToId={section.id}
          >
            {section.label}
            {activeSection === section.id && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
            )}
          </Button>
        ))}
      </div>
    )
  }

  // Minimal variant - just shows a down arrow to next section
  return (
    <div className={cn("flex justify-center", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white/80 hover:bg-white"
        onClick={(e) => {
          e.preventDefault();
          const currentIndex = sections.findIndex((section) => section.id === activeSection)
          const nextIndex = (currentIndex + 1) % sections.length
          scrollToSection(sections[nextIndex].id)
        }}
      >
        <ChevronDown className="h-6 w-6 text-navy" />
        <span className="sr-only">Scroll to next section</span>
      </Button>
    </div>
  )
}
