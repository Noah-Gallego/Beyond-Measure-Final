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
          className="project-card"
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