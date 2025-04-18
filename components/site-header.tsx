"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { MobileNav } from "@/components/mobile-nav"
import { LoginDialog } from "@/components/auth/login-dialog"
import { UserDropdown } from "@/components/user-dropdown"
import { LogIn, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthProvider"
import { getDashboardUrlByRole, formatUserName } from "@/utils/auth-helpers"
import { usePathname } from "next/navigation"
import SearchProjects from "@/components/SearchProjects"

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [showAdminDropdown, setShowAdminDropdown] = useState(false)
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const { user, isLoading, signOut } = useAuth()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Define sections for navigation
  const sections = [
    { id: "hero", label: "Home", externalLink: false },
    { id: "how-it-works", label: "How It Works", externalLink: false },
    { id: "testimonials", label: "Testimonials", externalLink: false },
    { id: "about", label: "About Us", externalLink: false },
    { id: "faq", label: "FAQ", externalLink: false },
    { id: "/contact", label: "Contact", externalLink: true },
  ]

  // Get the user's role when authenticated
  useEffect(() => {
    if (user) {
      const role = String(user.user_metadata?.role || '').toLowerCase()
      setUserRole(role)
    } else {
      setUserRole(null)
    }
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return

      // Show the header background after scrolling down
      setIsScrolled(window.scrollY > 50)

      // Get the "how-it-works" section
      const howItWorksSection = document.getElementById("how-it-works")

      if (howItWorksSection) {
        // Get the position of the section relative to the viewport
        const howItWorksSectionRect = howItWorksSection.getBoundingClientRect()

        // Show navigation when the top of the section is at or above the top of the viewport
        // This means the user has scrolled to or past the beginning of the section
        setShowNavigation(howItWorksSectionRect.top <= 0)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll)

      // Initial check in case the page loads already scrolled
      setTimeout(() => {
        handleScroll()
      }, 100)

      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Custom button styles for navigation
  const navButtonStyles = {
    active: "border border-salmon bg-salmon/10 text-salmon hover:bg-salmon/20",
    inactive: "border border-navy bg-navy/10 text-navy hover:bg-navy/20",
  }

  // Handle navigation based on user role - use the helper function
  const handleUserNavigation = () => {
    return getDashboardUrlByRole(user);
  }

  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin') || false
  
  // Check if we're on a teacher page
  const isTeacherPage = pathname?.startsWith('/teacher') || false

  // Define admin menu items
  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Admin Dashboard' },
    { path: '/admin/projects', label: 'Pending Projects' },
    { path: '/admin/teachers', label: 'Teacher Verification' },
    { path: '/admin/categories', label: 'Manage Categories' },
  ]

  // Define teacher menu items
  const teacherMenuItems = [
    { path: '/teacher/dashboard', label: 'Dashboard' },
    { path: '/teacher/projects', label: 'My Projects' },
    { path: '/teacher/projects/create', label: 'Create Project' },
    { path: '/profile', label: 'My Profile' },
  ]

  // Add document-level event listeners to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const adminButton = document.getElementById('admin-button');
      const adminDropdown = document.getElementById('admin-dropdown');
      const teacherButton = document.getElementById('teacher-button');
      const teacherDropdown = document.getElementById('teacher-dropdown');
      
      // Close admin dropdown if clicking outside
      if (adminButton && adminDropdown && 
          !adminButton.contains(target) && 
          !adminDropdown.contains(target)) {
        setShowAdminDropdown(false);
      }
      
      // Close teacher dropdown if clicking outside
      if (teacherButton && teacherDropdown && 
          !teacherButton.contains(target) && 
          !teacherDropdown.contains(target)) {
        setShowTeacherDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "bg-white shadow-soft border-b border-gray-100" : "bg-transparent"
        }`}
      >
        <div className="container relative flex h-16 items-center px-4 justify-between">
          <Link
            href="/"
            className="flex items-center mr-6"
            onClick={(e) => {
              // If we're already on the home page, prevent default navigation
              // and just scroll to top
              if (window.location.pathname === "/") {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: "smooth" })
              } else {
                // If we're on another page, we'll navigate to home
                // and then scroll to top after the page loads
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }, 100)
              }
            }}
          >
            <div className="h-16 w-32 overflow-hidden">
              <Image
                src="/images/beyond-measure-logo.png"
                alt="BeyondMeasure Logo"
                width={120}
                height={40}
                className="h-auto w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation - Only visible after scrolling to how-it-works */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <div
              className={`flex flex-wrap justify-center gap-2 transition-all duration-300 ${
                showNavigation ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"
              }`}
            >
              {/* Search Projects Button - Always visible */}
              <Link
                href="/search"
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors px-4 py-2",
                  pathname === "/search" ? navButtonStyles.active : navButtonStyles.inactive,
                )}
              >
                <Search className="mr-1 h-4 w-4" />
                Find Projects
              </Link>
              
              {sections
                .filter((section) => section.id !== "hero" && section.id !== "about") // Filter out Home and About Us buttons
                .map((section) => {
                  const isActive = typeof window !== "undefined" ? section.id === window.location.hash.substring(1) : false
                  return (
                    <a
                      key={section.id}
                      href={section.externalLink ? section.id : `#${section.id}`}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors px-4 py-2",
                        isActive ? navButtonStyles.active : navButtonStyles.inactive,
                      )}
                      onClick={(e) => {
                        if (!section.externalLink) {
                          e.preventDefault()
                          const element = document.getElementById(section.id)
                          if (element) element.scrollIntoView({ behavior: "smooth" })
                        }
                      }}
                    >
                      {section.label}
                    </a>
                  )
                })}
            </div>
          </div>

          <div className="ml-auto flex items-center justify-end space-x-4">
            {/* Search icon in navbar - show on all pages */}
            <div className="hidden md:block">
              <SearchProjects variant="nav" />
            </div>
            
            {/* Admin Navigation Menu */}
            {!isLoading && userRole === 'admin' && (
              <div className="relative hidden md:block">
                <button 
                  id="admin-button"
                  className={`px-3 py-1.5 flex items-center space-x-1 rounded-md text-sm font-medium transition-colors
                    ${isAdminPage 
                      ? "bg-salmon text-white hover:bg-salmon/80" 
                      : "text-navy bg-navy/5 hover:bg-navy/10 border border-navy/20"}`}
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  onMouseEnter={() => setShowAdminDropdown(true)}
                >
                  <span>Admin</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdminDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showAdminDropdown && (
                  <div 
                    id="admin-dropdown"
                    className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 overflow-hidden"
                    onMouseEnter={() => setShowAdminDropdown(true)}
                    onMouseLeave={() => setShowAdminDropdown(false)}
                    style={{
                      animation: 'fadeIn 0.2s ease-out forwards'
                    }}
                  >
                    {adminMenuItems.map((item, index) => (
                      <Link 
                        key={item.path} 
                        href={item.path} 
                        className={`block px-4 py-2 text-sm transition-colors duration-150 ${
                          pathname === item.path 
                            ? 'bg-salmon/10 text-salmon font-medium' 
                            : 'text-navy hover:bg-navy/5'
                        }`}
                        style={{
                          animation: `slideIn 0.2s ease-out forwards ${index * 0.03}s`
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Teacher Navigation Menu */}
            {!isLoading && userRole === 'teacher' && (
              <div className="relative hidden md:block">
                <button 
                  id="teacher-button"
                  className={`px-3 py-1.5 flex items-center space-x-1 rounded-md text-sm font-medium transition-colors
                    ${isTeacherPage 
                      ? "bg-grass text-white hover:bg-grass/80" 
                      : "text-navy bg-navy/5 hover:bg-navy/10 border border-navy/20"}`}
                  onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                  onMouseEnter={() => setShowTeacherDropdown(true)}
                >
                  <span>Teacher</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showTeacherDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showTeacherDropdown && (
                  <div 
                    id="teacher-dropdown"
                    className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 overflow-hidden"
                    onMouseEnter={() => setShowTeacherDropdown(true)}
                    onMouseLeave={() => setShowTeacherDropdown(false)}
                    style={{
                      animation: 'fadeIn 0.2s ease-out forwards'
                    }}
                  >
                    {teacherMenuItems.map((item, index) => (
                      <Link 
                        key={item.path} 
                        href={item.path} 
                        className={`block px-4 py-2 text-sm transition-colors duration-150 ${
                          pathname === item.path 
                            ? 'bg-grass/10 text-grass font-medium' 
                            : 'text-navy hover:bg-navy/5'
                        }`}
                        style={{
                          animation: `slideIn 0.2s ease-out forwards ${index * 0.03}s`
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}
                    
                    {/* Only show "Create Project" button if we're on teacher pages */}
                    {isTeacherPage && (
                      <div className="px-4 py-2 border-t border-gray-100" style={{ animation: 'slideIn 0.2s ease-out forwards 0.15s' }}>
                        <Link 
                          href="/teacher/projects/create" 
                          className="block w-full py-1.5 px-3 text-sm text-center bg-grass text-white rounded-md hover:bg-grass/90 transition-colors"
                        >
                          + New Project
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <a
              href="#about"
              className="hidden md:inline-block text-navy font-medium text-sm hover:text-sky cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById("about")
                if (element) element.scrollIntoView({ behavior: "smooth" })
              }}
            >
              About Us
            </a>

            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <UserDropdown 
                isLoggedIn={true} 
                onLogout={signOut} 
                userName={`👋 ${formatUserName(user)}`}
                userDashboardLink={handleUserNavigation()}
              />
            ) : (
              <div className="hidden md:flex">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center rounded-full border border-grass bg-grass/10 px-3 py-1 text-sm text-grass hover:bg-grass/20 transition-colors"
                >
                  <LogIn className="mr-1 h-3.5 w-3.5" />
                  Log In
                </button>
              </div>
            )}

            <MobileNav sections={sections} />
          </div>
        </div>
      </header>

      {/* Login Dialog */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-8px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
