"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
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
import { 
  loadGoogleMapsApi, 
  isGoogleMapsLoaded, 
  GoogleMapsWindow,
  GoogleAutocomplete,
  GooglePlace,
  refreshAutocompleteStyles
} from "@/utils/googleMapsLoader"
import { getDashboardUrlByRole } from '@/utils/auth-helpers'

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function SignupDialog({ open, onOpenChange, onSuccess, onSwitchToLogin }: SignupDialogProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  
  // Role selection
  const [role, setRole] = useState<'donor' | 'teacher'>('donor')
  
  // Teacher-specific fields
  const [schoolName, setSchoolName] = useState("")
  const [schoolAddress, setSchoolAddress] = useState("")
  const [schoolCity, setSchoolCity] = useState("")
  const [schoolState, setSchoolState] = useState("")
  const [schoolPostalCode, setSchoolPostalCode] = useState("")
  const [positionTitle, setPositionTitle] = useState("")
  
  // Google Maps Places API integration
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [placesInitialized, setPlacesInitialized] = useState(false)
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const addressWrapperRef = useRef<HTMLDivElement>(null)
  
  // Password validation
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordMatchError, setPasswordMatchError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Google Maps Places API initialization
  useEffect(() => {
    // Load Google Maps API if not already loaded
    if (!isGoogleMapsLoaded()) {
      loadGoogleMapsApi()
        .then(() => {
          setGoogleMapsLoaded(true);
          refreshAutocompleteStyles(); // Apply styles after load
        })
        .catch(error => console.error("Error loading Google Maps API:", error));
    } else {
      setGoogleMapsLoaded(true);
      refreshAutocompleteStyles(); // Apply styles if already loaded
    }
  }, []);
  
  // Handle place_changed event from autocomplete
  const handlePlaceChange = (place: GooglePlace) => {
    if (place && place.address_components) {
      // Prevent any default behavior
      document.body.style.pointerEvents = 'none';
      setTimeout(() => document.body.style.pointerEvents = 'auto', 100);
      
      // Extract address components
      let streetNumber = '';
      let streetName = '';
      let city = '';
      let state = '';
      let postalCode = '';
      
      for (const component of place.address_components!) {
        const componentType = component.types[0];
        
        switch (componentType) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            streetName = component.long_name;
            break;
          case 'locality':
            city = component.long_name;
            break;
          case 'administrative_area_level_1':
            state = component.short_name;
            break;
          case 'postal_code':
            postalCode = component.long_name;
            break;
        }
      }
      
      // Update state with extracted components
      const fullStreetAddress = streetNumber && streetName ? `${streetNumber} ${streetName}` : place.formatted_address || '';
      
      // Update form fields
      setSchoolAddress(fullStreetAddress);
      if (city) setSchoolCity(city);
      if (state) setSchoolState(state);
      if (postalCode) setSchoolPostalCode(postalCode);
      
      // Log success for debugging
      console.log('Address selected:', fullStreetAddress);
      
      // Force input to maintain focus - prevents dialog from losing focus
      setTimeout(() => {
        if (addressInputRef.current) {
          // Stop any propagation
          const evt = new MouseEvent('click', {
            bubbles: false,
            cancelable: true,
            view: window
          });
          addressInputRef.current.dispatchEvent(evt);
          
          // Apply focus
          addressInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Initialize Places Autocomplete
  useEffect(() => {
    if (googleMapsLoaded && addressInputRef.current && !autocompleteRef.current) {
      try {
        // Use type assertion to access the google object
        const google = (window as unknown as GoogleMapsWindow).google;
        
        // Clear any existing autocomplete instance
        if (autocompleteRef.current) {
          // Use type assertion to access event property
          (google.maps as any).event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
        
        // Create new autocomplete instance
        autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['address'],
          fields: ['address_component', 'formatted_address'],
          componentRestrictions: { country: 'us' }
        });
        
        // Prevent form submission when address is selected with Enter key
        addressInputRef.current.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && autocompleteRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
        
        // Add place_changed listener using type assertion
        (google.maps as any).event.addListener(autocompleteRef.current, 'place_changed', () => {
          const place = autocompleteRef.current?.getPlace() as GooglePlace;
          if (place) {
            handlePlaceChange(place);
          }
        });
        
        // Fix any browser and CSS issues with the dropdown
        refreshAutocompleteStyles();
        
        // Add specific event listener to prevent dialog from closing
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          pacContainer.addEventListener('mousedown', (e) => {
            e.stopPropagation();
          }, true);
          
          pacContainer.addEventListener('click', (e) => {
            e.stopPropagation();
          }, true);
        }
        
        setPlacesInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error);
      }
    }
    
    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        try {
          const google = (window as unknown as GoogleMapsWindow).google;
          (google.maps as any).event.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          console.error('Error cleaning up autocomplete:', error);
        }
      }
    };
  }, [googleMapsLoaded, addressInputRef.current, open]);
  
  // Refresh autocomplete when role changes to 'teacher'
  useEffect(() => {
    if (role === 'teacher' && googleMapsLoaded) {
      refreshAutocompleteStyles();
    }
  }, [role, googleMapsLoaded]);
  
  // Handle address input change manually
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolAddress(e.target.value);
    
    // Make sure to hide the dropdown when the input is cleared
    if (e.target.value === '') {
      // Reset the related fields
      setSchoolCity('');
      setSchoolState('');
      setSchoolPostalCode('');
    }
  }
  
  // Handle focus of the address input to ensure dropdown works properly
  const handleAddressFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent dialog from losing focus
    refreshAutocompleteStyles(); // Refresh styles on focus
    
    if (googleMapsLoaded && placesInitialized) {
      // Trigger a refresh of the autocomplete dropdown
      const inputEl = addressInputRef.current;
      if (inputEl) {
        // Add a space and then remove it to trigger the dropdown
        const currentValue = inputEl.value;
        if (currentValue.trim().length > 0) {
          inputEl.value = currentValue + ' ';
          setTimeout(() => {
            inputEl.value = currentValue;
            
            // Manually trigger a change event
            const event = new Event('input', { bubbles: true });
            inputEl.dispatchEvent(event);
          }, 10);
        }
      }
    }
  }
  
  // Handle click on address input
  const handleAddressClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Stop event propagation
    handleAddressFocus(e as unknown as React.FocusEvent<HTMLInputElement>); // Same behavior as focus
  }
  
  // Update password onChange handler to validate all requirements
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Calculate password strength
    let score = 0;
    const requirements = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword)
    };
    
    // Add to score for each requirement met
    if (requirements.length) score += 25;
    if (requirements.uppercase) score += 25;
    if (requirements.number) score += 25;
    if (requirements.special) score += 25;
    
    setPasswordStrength(score);
    
    // Check if passwords match when password changes
    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordMatchError("Passwords don't match");
      } else {
        setPasswordMatchError("");
      }
    }
  };
  
  // Confirm password validation
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    
    if (password !== newConfirmPassword) {
      setPasswordMatchError("Passwords don't match")
    } else {
      setPasswordMatchError("")
    }
  }
  
  // Toggle password visibility functions
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }
  
  // Password strength indicator color and label
  const getPasswordStrengthInfo = () => {
    if (passwordStrength === 0) return { color: 'bg-gray-200', label: '' }
    if (passwordStrength < 33) return { color: 'bg-red-500', label: 'Weak' }
    if (passwordStrength < 67) return { color: 'bg-yellow-500', label: 'Medium' }
    return { color: 'bg-green-500', label: 'Strong' }
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    // Validate all password requirements
    const passwordRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    // Check if all requirements are met
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req === true);
    
    // Validation checks
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!allRequirementsMet) {
      setErrorMessage("Password must meet all requirements: 8+ characters, uppercase letter, number, and special character");
      setIsLoading(false);
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must agree to the terms and conditions");
      setIsLoading(false);
      return;
    }
    
    // Additional validation for teacher role
    if (role === 'teacher') {
      if (!schoolName || !schoolAddress || !schoolCity || !schoolState || !schoolPostalCode || !positionTitle) {
        setErrorMessage("Please complete all required school information fields")
        setIsLoading(false)
        return
      }
    }

    try {
      // Register with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            role: role,
          },
        },
      })

      if (signUpError) throw signUpError
      
      if (!authData.user) {
        throw new Error('Something went wrong during signup. Please try again.')
      }
      
      // Create user profile with role information
      const createUserResult = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authId: authData.user.id,
          email,
          firstName,
          lastName,
          role,
          schoolName: role === 'teacher' ? schoolName : undefined,
          schoolAddress: role === 'teacher' ? schoolAddress : undefined,
          schoolCity: role === 'teacher' ? schoolCity : undefined,
          schoolState: role === 'teacher' ? schoolState : undefined,
          schoolPostalCode: role === 'teacher' ? schoolPostalCode : undefined,
          positionTitle: role === 'teacher' ? positionTitle : undefined,
        }),
      })
      
      if (!createUserResult.ok) {
        const errorData = await createUserResult.json()
        throw new Error(errorData.error || 'Error creating user profile')
      }

      setSuccessMessage("Registration successful! Redirecting to your dashboard...")
      
      // Reset form
      setFirstName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRole('donor')
      setSchoolName("")
      setSchoolAddress("")
      setSchoolCity("")
      setSchoolState("")
      setSchoolPostalCode("")
      setPositionTitle("")
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      // Get the appropriate dashboard URL based on user role
      const dashboardUrl = getDashboardUrlByRole(authData.user)

      // Close the dialog after a delay and redirect
      setTimeout(() => {
        onOpenChange(false)
        router.push(dashboardUrl)
      }, 2000)
    } catch (error: any) {
      console.error("Error signing up:", error)
      setErrorMessage(error.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(state) => {
        // If we're closing the dialog
        if (!state) {
          // Close the dialog completely
          onOpenChange(false);
          return;
        }
        
        // Detect if we're interacting with autocomplete
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          const style = window.getComputedStyle(pacContainer);
          // If we're clicking on the pac-container, prevent dialog state change
          if (style.display !== 'none') {
            return;
          }
        }
        
        // Otherwise, allow dialog state change
        onOpenChange(state);
      }}
    >
      <DialogContent 
        className="max-w-md overflow-visible" 
        // Completely override the default behavior
        onPointerDownOutside={e => {
          // Check if clicking on autocomplete suggestions
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer && (
            pacContainer.contains(e.target as Node) ||
            // Check if we're inside the autocomplete or related element
            e.target instanceof Element && (
              e.target.classList.contains('pac-item') ||
              e.target.classList.contains('pac-item-query') ||
              // Or if we're anywhere near the pac container
              e.target.closest('.pac-container')
            )
          )) {
            // Prevent the dialog from closing if clicking on autocomplete
            e.preventDefault();
          }
        }}
        // Add a click handler to ensure the dialog doesn't lose focus
        onClick={e => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-[#0E5D7F]">Create an Account</DialogTitle>
          <DialogDescription className="text-center">
            Join our community and start making a difference in education
          </DialogDescription>
        </DialogHeader>
        <DialogClose 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => {
            if (onSwitchToLogin) {
              onSwitchToLogin();
            } else {
              onOpenChange(false);
            }
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-green-700 border border-green-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4 overflow-y-auto overflow-x-visible max-h-[60vh] pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block text-sm font-medium">I am a</Label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`flex items-center justify-center p-3 rounded-lg cursor-pointer border transition-colors ${
                  role === 'donor' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setRole('donor')}
              >
                <div className="text-center">
                  <svg className={`h-6 w-6 mx-auto mb-1 ${role === 'donor' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm font-medium ${role === 'donor' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Donor
                  </span>
                </div>
              </div>
              <div 
                className={`flex items-center justify-center p-3 rounded-lg cursor-pointer border transition-colors ${
                  role === 'teacher' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setRole('teacher')}
              >
                <div className="text-center">
                  <svg className={`h-6 w-6 mx-auto mb-1 ${role === 'teacher' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className={`text-sm font-medium ${role === 'teacher' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Teacher
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Teacher-specific fields */}
          {role === 'teacher' && (
            <div className="mt-4 space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">School Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Lincoln High School"
                  required={role === 'teacher'}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">School Address</Label>
                <div className="relative" ref={addressWrapperRef}>
                  <Input
                    id="schoolAddress"
                    type="text"
                    value={schoolAddress}
                    onChange={handleAddressChange}
                    onFocus={handleAddressFocus}
                    onClick={handleAddressClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    autoComplete="off"
                    ref={addressInputRef}
                    className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="123 Education St"
                    required={role === 'teacher'}
                    disabled={isLoading}
                  />
                  {/* API Status indicator */}
                  <div className="mt-1 text-xs">
                    <span className={`inline-block px-2 py-1 rounded ${(googleMapsLoaded && typeof window !== 'undefined' && !!window.google?.maps?.places) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      Places API: {(googleMapsLoaded && typeof window !== 'undefined' && !!window.google?.maps?.places) ? 'Loaded ✓' : 'Loading...'}
                    </span>
                    {googleMapsLoaded && (
                      <span className={`ml-2 inline-block px-2 py-1 rounded ${placesInitialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        Autocomplete: {placesInitialized ? 'Ready ✓' : 'Initializing...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolCity">City</Label>
                  <Input
                    id="schoolCity"
                    type="text"
                    value={schoolCity}
                    onChange={(e) => setSchoolCity(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Anytown"
                    required={role === 'teacher'}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolState">State</Label>
                  <Input
                    id="schoolState"
                    type="text"
                    value={schoolState}
                    onChange={(e) => setSchoolState(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="CA"
                    required={role === 'teacher'}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolPostalCode">Postal Code</Label>
                <Input
                  id="schoolPostalCode"
                  type="text"
                  value={schoolPostalCode}
                  onChange={(e) => setSchoolPostalCode(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="12345"
                  required={role === 'teacher'}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="positionTitle">Position/Title</Label>
                <Input
                  id="positionTitle"
                  type="text"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="5th Grade Teacher"
                  required={role === 'teacher'}
                  disabled={isLoading}
                />
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Note: Teacher accounts require verification before you can create projects.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {password && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${getPasswordStrengthInfo().color}`} 
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
                {getPasswordStrengthInfo().label && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Password strength: <span className={`font-medium ${
                      passwordStrength < 33 ? 'text-red-600' : 
                      passwordStrength < 67 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>{getPasswordStrengthInfo().label}</span>
                  </p>
                )}
                <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1 list-disc list-inside">
                  <li className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}>
                    At least one uppercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-600" : "text-gray-500"}>
                    At least one number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-gray-500"}>
                    At least one special character
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border ${passwordMatchError ? 'border-red-500' : confirmPassword && !passwordMatchError ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 ${passwordMatchError ? 'focus:ring-red-500' : confirmPassword && !passwordMatchError ? 'focus:ring-green-500' : 'focus:ring-blue-500'} focus:border-transparent transition-colors`}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {passwordMatchError ? (
              <p className="mt-1 text-sm text-red-600">{passwordMatchError}</p>
            ) : confirmPassword && (
              <p className="mt-1 text-sm text-green-600">Passwords match</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              disabled={isLoading}
            />
            <Label htmlFor="terms" className="text-sm font-normal">
              I agree to the{" "}
              <Link href="/terms" className="text-[#3AB5E9] hover:underline">
                terms and conditions
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full bg-[#0E5D7F]" disabled={isLoading || (!!passwordMatchError)}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin mr-2 h-4 w-4 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="text-center text-sm">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToLogin) {
                    onSwitchToLogin();
                  } else {
                    onOpenChange(false);
                  }
                }}
                className="text-[#3AB5E9] hover:underline focus:outline-none font-medium"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 