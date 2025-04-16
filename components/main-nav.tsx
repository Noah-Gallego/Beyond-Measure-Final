"use client"
import { usePathname } from "next/navigation"

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

  return <nav className="flex items-center space-x-4">{/* Navigation links removed as requested */}</nav>
}
