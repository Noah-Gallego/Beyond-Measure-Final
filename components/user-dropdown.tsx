"use client"

import { useState, useEffect } from "react"
import { ChevronDown, User, Folder, Plus, LogOut, Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

interface UserDropdownProps {
  userName?: string
  isLoggedIn?: boolean
  onLogout?: () => void
  userDashboardLink?: string | null
}

export function UserDropdown({ 
  userName = "TEACHER NAME", 
  isLoggedIn = false, 
  onLogout,
  userDashboardLink = "/dashboard"
}: UserDropdownProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Get the user's role when component mounts
  useEffect(() => {
    if (user) {
      const role = String(user.user_metadata?.role || '').toLowerCase()
      setUserRole(role)
    } else {
      setUserRole('donor') // Default to donor if no role is set
    }
  }, [user])

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    setOpen(false)
  }

  const handleNavigate = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-[#0E5D7F] hover:text-[#0E5D7F]/80"
      >
        <span className="text-sm font-medium uppercase">{userName}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-soft border border-gray-100 z-50 overflow-hidden">
          <div className="flex flex-col">
            <div
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#3AB5E9]/5 transition-colors"
              onClick={() => handleNavigate(userDashboardLink || "/dashboard")}
            >
              <User className="h-5 w-5 text-[#0E5D7F]" />
              <span className="text-base font-medium text-[#0E5D7F]">My Dashboard</span>
            </div>

            <div
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#3AB5E9]/5 transition-colors"
              onClick={() => handleNavigate("/profile")}
            >
              <User className="h-5 w-5 text-[#0E5D7F]" />
              <span className="text-base font-medium text-[#0E5D7F]">My Profile</span>
            </div>

            {userRole === 'teacher' ? (
              <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#3AB5E9]/5 transition-colors"
                onClick={() => handleNavigate("/teacher/projects")}
              >
                <Folder className="h-5 w-5 text-[#0E5D7F]" />
                <span className="text-base font-medium text-[#0E5D7F]">My Projects</span>
              </div>
            ) : (
              <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#3AB5E9]/5 transition-colors"
                onClick={() => handleNavigate("/account/wishlist")}
              >
                <Heart className="h-5 w-5 text-[#E96951]" />
                <span className="text-base font-medium text-[#0E5D7F]">Wishlist</span>
              </div>
            )}

            {userRole === 'teacher' ? (
              <div className="px-3 py-2" onClick={() => handleNavigate("/teacher/projects/create")}>
                <div className="flex items-center gap-3 bg-[#E96951] text-white w-full px-4 py-3 rounded-md cursor-pointer hover:bg-[#E96951]/90 transition-colors">
                  <Plus className="h-5 w-5" />
                  <span className="text-base font-medium">Create a Project and Get Funded</span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-2" onClick={() => handleNavigate("/search")}>
                <div className="flex items-center gap-3 bg-[#E96951] text-white w-full px-4 py-3 rounded-md cursor-pointer hover:bg-[#E96951]/90 transition-colors">
                  <Plus className="h-5 w-5" />
                  <span className="text-base font-medium">Find Projects to Support</span>
                </div>
              </div>
            )}

            <div
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 text-[#E96951] hover:bg-[#E96951]/5 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base font-medium">Sign Out</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
