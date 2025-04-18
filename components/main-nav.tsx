"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface MainNavProps {
  navButtonStyles?: {
    active: string
    inactive: string
  }
}

export function MainNav({ navButtonStyles }: MainNavProps) {
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

  // Default styles if not provided
  const defaultStyles = {
    active: "text-salmon bg-salmon/10 border border-salmon hover:bg-salmon/20",
    inactive: "text-navy bg-navy/10 border border-navy hover:bg-navy/20",
  }

  const styles = navButtonStyles || defaultStyles

  return (
    <nav className="flex items-center space-x-4">
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/logo.jpg"
          alt="Beyond Measure"
          width={40}
          height={40}
          className="h-8 w-auto rounded-md"
        />
        <span className="font-semibold hidden md:inline-block text-navy">Beyond Measure</span>
      </Link>
    </nav>
  )
}
