'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { supabaseAdmin } from '../utils/supabaseAdmin';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import '../styles/ProjectsGrid.css';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { CategoryBadge } from '@/components/CategoryBadge';
import { FundingProgress } from '@/components/FundingProgress';
import { useTheme } from "next-themes";
import { createClient } from '@/utils/supabase/client';
import { Heart, CheckCircle, XCircle } from 'lucide-react';
import { addToWishlist, removeFromWishlist, createDonorProfile } from '@/utils/supabase';

type Project = {
  id: string;
  title: string;
  description: string;
  student_impact: string;
  funding_goal: number;
  current_amount: number;
  main_image_url: string | null;
  status: string;
  teacher?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    school?: {
      name: string;
      city: string;
      state: string;
    };
  } | null;
  categories?: {
    id: string;
    name: string;
  }[];
};

interface ProjectsListProps {
  searchQuery?: string;
  categoryFilter?: string;
  featured?: boolean;
  limit?: number;
  minFunding?: number;
  maxFunding?: number;
}

export default function ProjectsList({ 
  searchQuery = '', 
  categoryFilter = 'all',
  featured = false,
  limit,
  minFunding = 0,
  maxFunding = 50000
}: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [wishlistedProjects, setWishlistedProjects] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({});
  const [wishlistSuccess, setWishlistSuccess] = useState<Record<string, boolean>>({});
  const [wishlistError, setWishlistError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check if user prefers dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    
    // Listen for changes to the color scheme preference
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Step 1: First fetch the basic project data
        let query = supabase
          .from('projects')
          .select(`
            id, 
            title, 
            description, 
            student_impact, 
            funding_goal, 
            current_amount, 
            main_image_url,
            status,
            teacher_id,
            categories:project_categories(
              category:categories(id, name)
            )
          `)
          .eq('status', 'active');
          
        // If featured is true, add additional filter or order logic
        if (featured) {
          // For this example, we'll just order by current_amount to show most funded projects first
          query = query.order('current_amount', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        // Apply limit if specified
        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        console.log('Fetched projects data:', data);
        
        // Before we start the loop, define our default avatar URL
        const defaultAvatarUrl = darkMode
          ? "/images/default-avatar-dark.svg"
          : "/images/default-avatar.svg";

        // Step 2: Now fetch the teacher profiles with admin privileges
        const formattedProjects = await Promise.all(data?.map(async project => {
          console.log('Processing project:', project.title);
          
          // Handle teacher data
          let teacherData = null;
          
          // Extract categories from the nested structure early
          const categories = project.categories 
            ? project.categories
                .map(pc => pc.category)
                .filter(Boolean)
                .map(cat => ({
                  id: cat.id,
                  name: cat.name
                }))
            : [];
            
          // If we have a teacher_id, fetch the teacher profile using admin client
          if (project.teacher_id) {
            try {
              console.log('Fetching teacher profile for ID:', project.teacher_id);
              
              // Use supabaseAdmin to bypass RLS
              const { data: teacherProfile, error: teacherError } = await supabaseAdmin
                .from('teacher_profiles')
                .select(`
                  id, 
                  user_id,
                  school_name, 
                  school_city, 
                  school_state,
                  position_title,
                  bio
                `)
                .eq('id', project.teacher_id)
                .single();
                
              if (teacherError) {
                console.error('Error fetching teacher profile:', teacherError);
              } else if (teacherProfile) {
                console.log('Teacher profile found:', teacherProfile);
                
                // Create consistent school data for all projects
                const schoolData = {
                  name: teacherProfile.school_name || 'School Name Not Available',
                  city: teacherProfile.school_city || 'City Not Available',
                  state: teacherProfile.school_state || 'State Not Available'
                };
                
                // Now fetch the associated user data
                const { data: userData, error: userError } = await supabaseAdmin
                  .from('users')
                  .select(`
                    id,
                    first_name,
                    last_name,
                    email,
                    profile_image_url
                  `)
                  .eq('id', teacherProfile.user_id)
                  .single();
                
                if (userError) {
                  console.error('Error fetching user data:', userError);
                } else if (userData) {
                  console.log('User data found:', userData);
                  
                  // Create a display name from user data
                  let displayName = '';
                  
                  if (userData.first_name || userData.last_name) {
                    displayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
                  } else if (userData.email) {
                    displayName = userData.email.split('@')[0];
                  } else {
                    displayName = teacherProfile.position_title || "Teacher";
                  }
                  
                  // Get the real profile image URL
                  const profileImageUrl = userData.profile_image_url || null;
                  console.log('Profile image URL:', profileImageUrl);
                  
                  teacherData = {
                    id: teacherProfile.id,
                    user_id: teacherProfile.user_id,
                    display_name: displayName,
                    profile_image_url: profileImageUrl,
                    school: schoolData
                  };
                  
                  console.log('Processed teacher data:', teacherData);
                }
              }
            } catch (error) {
              console.error('Error processing teacher data:', error);
            }
          }
          
          return {
            ...project,
            teacher: teacherData,
            categories: categories
          };
        })) || [];
        
        setProjects(formattedProjects);
        setFilteredProjects(formattedProjects);
      } catch (error: any) {
        console.error('Error fetching projects:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [featured, limit, darkMode]);

  // Filter projects when search query, category, or funding range changes
  useEffect(() => {
    if (!projects.length) return;
    
    let filtered = [...projects];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(query) || 
        project.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      console.log('Filtering by category:', categoryFilter);
      console.log('Projects before category filter:', filtered.length);
      
      // Check if it's a comma-separated list of categories
      if (categoryFilter.includes(',')) {
        const categoryIds = categoryFilter.split(',');
        console.log('Multiple categories detected:', categoryIds);
        
        filtered = filtered.filter(project => {
          if (!project.categories || project.categories.length === 0) {
            return false;
          }
          
          // Check if any project category matches any of the filter categories
          return project.categories.some(category => 
            categoryIds.includes(category.id)
          );
        });
      } else {
        // Single category filter
        filtered = filtered.filter(project => {
          if (!project.categories || project.categories.length === 0) {
            return false;
          }
          
          return project.categories.some(category => 
            category.id === categoryFilter
          );
        });
      }
      
      console.log('Projects after category filter:', filtered.length);
    }
    
    // Apply funding range filter
    if (minFunding > 0 || maxFunding < 50000) {
      console.log('Filtering by funding range:', { minFunding, maxFunding });
      console.log('Projects before funding filter:', filtered.length);
      
      // Log each project's funding goal to see values
      filtered.forEach(project => {
        console.log(`Project "${project.title}": funding_goal=${project.funding_goal}`);
      });
      
      filtered = filtered.filter(project => 
        project.funding_goal >= minFunding && 
        project.funding_goal <= maxFunding
      );
      
      console.log('Projects after funding filter:', filtered.length);
    }
    
    setFilteredProjects(filtered);
  }, [searchQuery, categoryFilter, projects, minFunding, maxFunding]);

  const handleDonate = async (projectId: string) => {
    if (!user) {
      alert('Please sign in to donate');
      return;
    }
    
    // This would be replaced with a proper donation flow using Stripe
    alert(`Donation functionality would be implemented with Stripe for project ${projectId}`);
  };

  // Add CSS styles for heart animation
  useEffect(() => {
    // Define the CSS for heart animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes heartPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      
      .heart-btn {
        transition: all 0.2s ease;
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 8px;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        border-radius: 50%;
        z-index: 10;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .heart-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      }
      
      .heart-btn.active {
        color: #e11d48;
        fill: #e11d48;
      }
      
      .heart-pulse {
        animation: heartPulse 0.4s ease-in-out;
      }
      
      .wishlist-status {
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 8px;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        border-radius: 50%;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch user's wishlisted projects if logged in
  useEffect(() => {
    async function fetchUserWishlist() {
      if (!user) {
        setWishlistedProjects([]);
        return;
      }
      
      try {
        console.log('Fetching wishlist for user:', user.id);
        
        // Check localStorage for cached wishlist data first
        if (typeof window !== 'undefined') {
          const cachedWishlist = localStorage.getItem(`wishlist_${user.id}`);
          if (cachedWishlist) {
            try {
              const parsedData = JSON.parse(cachedWishlist);
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log('Using cached wishlist data:', parsedData);
                setWishlistedProjects(parsedData);
              }
            } catch (e) {
              console.error('Error parsing cached wishlist data:', e);
            }
          }
        }
        
        // Get user DB ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          return;
        }
        
        // Check if the donor profile exists
        const { data: donorData, error: donorError } = await supabase
          .from('donor_profiles')
          .select('id')
          .eq('user_id', userData.id)
          .maybeSingle();
        
        // Handle real errors, but not "no rows returned" which isn't an error
        if (donorError && donorError.code !== 'PGRST116') {
          console.error('Error checking donor profile:', donorError);
          return;
        }
        
        // Store donor ID if we found a profile
        let donorId = donorData?.id;
        
        // If no donor profile found, just proceed without creating one
        // This will change when the user actually tries to wishlist something
        if (!donorId) {
          console.log('No donor profile found for wishlist fetch. Will create when needed.');
          return; // Exit early - don't try to create a profile here
        }
        
        // Get wishlist items if we have a donor profile
        const { data: wishlistItems, error: wishlistError } = await supabase
          .from('donor_wishlists')
          .select('project_id')
          .eq('donor_id', donorId);
        
        if (wishlistError) {
          console.error('Error fetching wishlist:', wishlistError);
          return;
        }
        
        // Extract project IDs
        const projectIds = wishlistItems?.map(item => item.project_id) || [];
        
        // Cache to localStorage for faster loading on page changes
        if (typeof window !== 'undefined' && projectIds.length > 0) {
          localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(projectIds));
        }
        
        console.log('Wishlisted projects from DB:', projectIds);
        setWishlistedProjects(projectIds);
      } catch (error) {
        console.error('Error in fetchUserWishlist:', error);
      }
    }
    
    fetchUserWishlist();
  }, [user]);

  // Update handleWishlistToggle to also update localStorage
  const handleWishlistToggle = async (e, projectId) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent bubbling
    
    // Store a reference to the button element before the setTimeout
    const heartBtn = e.currentTarget;
    heartBtn.classList.add('heart-pulse');
    
    // Remove animation class after it completes
    setTimeout(() => {
      heartBtn.classList.remove('heart-pulse');
    }, 400);
    
    if (!user) {
      // Redirect to auth or show login modal
      alert('Please sign in to add projects to your wishlist');
      return;
    }
    
    // Set loading state for this project
    setWishlistLoading(prev => ({ ...prev, [projectId]: true }));
    
    try {
      // Reset previous states
      setWishlistSuccess(prev => ({ ...prev, [projectId]: false }));
      setWishlistError(prev => ({ ...prev, [projectId]: false }));
      
      // Check if project is already in wishlist
      const isWishlisted = wishlistedProjects.includes(projectId);
      
      // Get user DB ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        setWishlistError(prev => ({ ...prev, [projectId]: true }));
        return;
      }
      
      // Get donor profile or create one
      let donorProfileId;
      const { data: donorData, error: donorError } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (donorError && donorError.code !== 'PGRST116') {
        console.error('Error fetching donor profile:', donorError);
        setWishlistError(prev => ({ ...prev, [projectId]: true }));
        return;
      }
      
      if (!donorData) {
        console.log('No donor profile found, creating one...');
        
        // Create donor profile using the createDonorProfile utility function
        const result = await createDonorProfile(user.id);
        
        if (!result.success || !result.donorProfile) {
          console.error('Failed to create donor profile:', result.error);
          setWishlistError(prev => ({ ...prev, [projectId]: true }));
          return;
        }
        
        donorProfileId = result.donorProfile.id;
      } else {
        donorProfileId = donorData.id;
      }
      
      // Use the utility functions from supabase.ts
      if (isWishlisted) {
        // Remove from wishlist
        const result = await removeFromWishlist(donorProfileId, projectId);
        if (result.success) {
          // Update local state
          const updatedWishlist = wishlistedProjects.filter(id => id !== projectId);
          setWishlistedProjects(updatedWishlist);
          
          // Update localStorage cache
          if (typeof window !== 'undefined') {
            localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
          }
        } else {
          console.error('Error removing from wishlist:', result.error);
          setWishlistError(prev => ({ ...prev, [projectId]: true }));
          return;
        }
      } else {
        // Add to wishlist
        const result = await addToWishlist(donorProfileId, projectId);
        if (result.success) {
          // Update local state
          const updatedWishlist = [...wishlistedProjects, projectId];
          setWishlistedProjects(updatedWishlist);
          
          // Update localStorage cache
          if (typeof window !== 'undefined') {
            localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
          }
        } else {
          console.error('Error adding to wishlist:', result.error);
          setWishlistError(prev => ({ ...prev, [projectId]: true }));
          return;
        }
      }
      
      // Show success indicator
      setWishlistSuccess(prev => ({ ...prev, [projectId]: true }));
      
      // Hide success after a delay
      setTimeout(() => {
        setWishlistSuccess(prev => ({ ...prev, [projectId]: false }));
      }, 2000);
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      setWishlistError(prev => ({ ...prev, [projectId]: true }));
    } finally {
      setWishlistLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="mx-auto h-24 w-24 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {searchQuery ? 'Try adjusting your search or filter criteria.' : 'Check back soon for new projects!'}
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Default image to use when a project has no image, based on color scheme
  const defaultImageUrl = darkMode
    ? "/images/project-placeholder-dark.svg"
    : "/images/project-placeholder.svg";

  // Default avatar image to use when a teacher has no profile image
  const defaultAvatarUrl = "/placeholder-avatar.png";

  // Next.js Image component handles errors internally, so these functions are simplified
  // to just log errors for monitoring purposes
  const handleImageError = () => {
    console.error("Failed to load project image");
  };

  const handleAvatarError = () => {
    console.error("Failed to load avatar image");
  };

  // Function to get a deterministic color based on the teacher's name
  const getAvatarColor = (name: string) => {
    // List of background colors for the avatars
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500',
      'bg-yellow-500', 'bg-teal-500', 'bg-orange-500'
    ];
    
    // Use the sum of character codes to select a color
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  // Function to get the initial of teacher's name
  const getInitial = (name: string) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'T';
  };

  return (
    <div className="projects-grid">
      {filteredProjects.map((project) => (
        <Link 
          href={`/projects/${project.id}`} 
          key={project.id} 
          className="project-card relative"
        >
          <div className="project-image-container">
            {project.main_image_url ? (
              <Image
                src={project.main_image_url}
                alt={project.title || "Educational project"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                priority={false}
                loading="lazy"
                onError={handleImageError}
              />
            ) : (
              <Image
                src={defaultImageUrl}
                alt={project.title || "Educational project"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                priority={false}
                loading="lazy"
              />
            )}
            <div className="project-funding-badge">
              {Math.round((project.current_amount / project.funding_goal) * 100)}% Funded
            </div>
            
            {/* Wishlist button */}
            {wishlistLoading[project.id] ? (
              <div className="wishlist-status">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : wishlistSuccess[project.id] ? (
              <div className="wishlist-status text-green-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            ) : wishlistError[project.id] ? (
              <div className="wishlist-status text-red-500">
                <XCircle className="h-5 w-5" />
              </div>
            ) : (
              <button 
                className={`heart-btn ${wishlistedProjects.includes(project.id) ? 'active' : ''}`}
                onClick={(e) => handleWishlistToggle(e, project.id)}
                aria-label={wishlistedProjects.includes(project.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className="h-5 w-5" fill={wishlistedProjects.includes(project.id) ? "currentColor" : "none"} />
              </button>
            )}
          </div>
          
          <div className="project-content">
            <div className="project-category">
              {project.categories && project.categories.length > 0 
                ? project.categories[0].name 
                : "School Project"}
            </div>
            <h3 className="project-title">{project.title}</h3>
            <p className="project-description">{project.description}</p>
            
            {project.teacher && (
              <div className="project-teacher">
                <div className="project-teacher-avatar">
                  {/* Debug log to confirm profile image URL */}
                  {console.log('Rendering teacher avatar with URL:', project.teacher.profile_image_url)}
                  
                  {project.teacher.profile_image_url ? (
                    // If we have a real profile image URL, use the Image component directly
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={project.teacher.profile_image_url}
                        alt={project.teacher.display_name}
                        className="object-cover"
                      />
                      <AvatarFallback 
                        className="text-sm"
                        style={{ backgroundColor: getAvatarColor(project.teacher.display_name) }}
                      >
                        {getInitial(project.teacher.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    // If no profile image, use a colored initial avatar
                    <Avatar className="h-10 w-10">
                      <AvatarFallback 
                        className="text-sm"
                        style={{ backgroundColor: getAvatarColor(project.teacher.display_name) }}
                      >
                        {getInitial(project.teacher.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="project-teacher-info">
                  <div className="project-teacher-name">{project.teacher.display_name}</div>
                  {project.teacher.school && (
                    <div className="project-teacher-school">
                      {project.teacher.school.name}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {project.teacher?.school && (
              <div className="project-impact">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {project.teacher.school.city}, {project.teacher.school.state}
              </div>
            )}
            
            <div className="project-progress">
              <div className="project-progress-stats">
                <div className="project-raised">{formatCurrency(project.current_amount)}</div>
                <div className="project-goal">of {formatCurrency(project.funding_goal)}</div>
              </div>
              <div className="project-progress-bar-container">
                <div 
                  className="project-progress-bar" 
                  style={{ 
                    width: `${Math.min(100, Math.round((project.current_amount / project.funding_goal) * 100))}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <button 
              className="project-donate-button"
              onClick={(e) => {
                e.preventDefault();
                handleDonate(project.id);
              }}
            >
              Support This Project
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}