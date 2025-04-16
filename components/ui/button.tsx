"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#3AB5E9] text-white hover:bg-[#3AB5E9]/90",
        destructive: "bg-[#E96951] text-white hover:bg-[#E96951]/90",
        outline: "border border-input bg-white text-[#0E5D7F] hover:bg-[#3AB5E9]/10 hover:text-[#0E5D7F]",
        secondary: "bg-[#0E5D7F] text-white hover:bg-[#0E5D7F]/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        sky: "bg-[#3AB5E9] text-white hover:bg-[#3AB5E9]/90",
        salmon: "bg-[#E96951] text-white hover:bg-[#E96951]/90",
        navy: "bg-[#0E5D7F] text-white hover:bg-[#0E5D7F]/90",
        grass: "bg-[#A8BF87] text-white hover:bg-[#A8BF87]/90",
        sun: "bg-[#F7DBA7] text-[#0E5D7F] hover:bg-[#F7DBA7]/90",
        solid: "bg-[#3AB5E9] text-white hover:bg-[#3AB5E9]/90",
        orange: "bg-[#E96951]/10 border border-[#E96951] text-[#E96951] hover:bg-[#E96951]/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-full px-3 py-1",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  scrollToId?: string
  buttonLabel?: string // Added to identify specific buttons
  href?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, scrollToId, onClick, buttonLabel, href, ...props }, ref) => {
    // Skip rendering if this is a "Home" button
    if (buttonLabel === "Home") {
      return null
    }
    
    // State to track client-side rendering
    const [isMounted, setIsMounted] = React.useState(false)
    
    React.useEffect(() => {
      setIsMounted(true)
    }, [])

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // For navigation buttons with Link children, let the Link handle navigation
      if (!isMounted) return
      
      const hasLinkOrAnchor = event.currentTarget.querySelector('a, [href]') !== null;
      
      if (!hasLinkOrAnchor) {
        // Only prevent default for regular buttons
        event.preventDefault();
      }
      
      // Call the original onClick handler if it exists
      if (onClick) {
        onClick(event);
      }

      // If scrollToId is provided, scroll to that element
      if (scrollToId && isMounted) {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    // Simple button without special handling
    return (
      <button 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick} 
        {...props} 
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
