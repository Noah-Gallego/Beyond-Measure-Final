"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { LoginDialog } from "@/components/auth/login-dialog"

interface MobileNavProps {
  sections?: {
    id: string
    label: string
    externalLink?: boolean
  }[]
}

export function MobileNav({ sections }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/projects",
      label: "Projects",
      active: pathname === "/projects" || pathname === "/projects/create",
    },
    {
      href: "/contact",
      label: "Contact",
      active: pathname === "/contact",
    },
  ]

  const scrollToSection = (id: string, isExternalLink?: boolean) => {
    setOpen(false)
    
    if (isExternalLink) {
      // If it's an external link like "/contact", navigate to that path
      if (typeof window !== "undefined") {
        window.location.href = id;
      }
      return;
    }
    
    if (typeof document !== "undefined") {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="px-0 md:hidden" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-white">
          <div className="flex flex-col space-y-4 py-4">
            <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
              <Image
                src="/images/beyond-measure-logo.png"
                alt="BeyondMeasure Logo"
                width={160}
                height={45}
                className="h-auto w-auto"
              />
            </Link>

            {/* Section navigation */}
            {sections && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-semibold text-[#0E5D7F]">Sections</h3>
                </div>
                <div className="flex flex-col space-y-3">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id, section.externalLink)}
                      className="text-base font-medium text-[#0E5D7F] transition-colors hover:text-[#3AB5E9] text-left"
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
                <div className="border-t my-2"></div>
              </>
            )}

            {/* Other pages */}
            <div className="pt-2 pb-2">
              <h3 className="text-sm font-semibold text-[#0E5D7F]">Pages</h3>
            </div>
            <div className="flex flex-col space-y-3">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-[#3AB5E9]",
                    route.active ? "text-[#E96951]" : "text-[#0E5D7F]",
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => {
                setOpen(false)
                setLoginOpen(true)
              }}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-grass bg-grass-light px-3 py-1 text-sm text-grass hover:bg-grass-light/80 transition-colors"
            >
              <LogIn className="mr-1 h-3.5 w-3.5" />
              Log In
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Login Dialog */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
