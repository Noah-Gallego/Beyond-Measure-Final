"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase"
import { SignupDialog } from "./signup-dialog"
import { getDashboardUrlByRole } from "@/utils/auth-helpers"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  
  // Toggle between login and signup dialogs
  const [showSignup, setShowSignup] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt started");
    setIsLoading(true)
    setErrorMessage("")
    
    try {
      console.log("Attempting sign in with:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error("Supabase auth error:", error);
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }
      
      console.log("Sign in successful:", data.user?.id);

      // Get the appropriate dashboard URL based on user role
      const dashboardUrl = getDashboardUrlByRole(data.user)
      
      // Close the dialog before navigation
      onOpenChange(false)
      
      // Redirect to role-specific dashboard
      console.log(`Redirecting to ${dashboardUrl} based on role: ${data.user?.user_metadata?.role || 'donor'}`)
      
      // Add a small delay before redirect to ensure dialog closes
      setTimeout(() => {
        router.push(dashboardUrl)
      }, 100)
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    } finally {
      // Ensure we're never stuck in loading state
      setTimeout(() => {
        if (isLoading) setIsLoading(false);
      }, 5000);
    }
  }

  // Handle switching to signup dialog
  const handleShowSignup = () => {
    setShowSignup(true)
  }
  
  // Handle signup success
  const handleSignupSuccess = () => {
    setShowSignup(false)
  }
  
  // Handle signup dialog close - ensure we properly handle both close and switch scenarios
  const handleSignupDialogChange = (open: boolean) => {
    // If dialog is closing because user clicked "Sign in instead", don't close the login dialog
    if (!open) {
      setShowSignup(false)
      // We don't call onOpenChange(false) here so the login dialog remains visible
    } else {
      setShowSignup(open)
    }
  }

  // Handle user choosing to sign in instead of sign up
  const handleSwitchToLogin = () => {
    setShowSignup(false)
    // Login dialog should remain open
  }

  return (
    <>
      <Dialog open={open && !showSignup} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-[#0E5D7F]">Welcome Back</DialogTitle>
            <DialogDescription className="text-center">
              Sign in to your Beyond Measure account to continue your journey in supporting education.
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/reset-password" className="text-sm text-[#3AB5E9] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full bg-navy/10 border border-navy text-navy hover:bg-navy/20" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log In"}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ready to make a difference in your classroom?{" "}
                <button
                  type="button"
                  onClick={handleShowSignup}
                  className="text-[#3AB5E9] hover:underline focus:outline-none"
                >
                  Register now!
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Signup Dialog */}
      <SignupDialog 
        open={showSignup && open} 
        onOpenChange={handleSignupDialogChange}
        onSuccess={handleSignupSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  )
}
