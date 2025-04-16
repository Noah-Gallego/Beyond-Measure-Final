'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import '../styles/ProjectsGrid.css';

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
};

interface ProjectsListProps {
  searchQuery?: string;
  categoryFilter?: string;
  featured?: boolean;
  limit?: number;
}

export default function ProjectsList({ 
  searchQuery = '', 
  categoryFilter = 'all',
  featured = false,
  limit
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
            teacher_profiles:teacher_id(
              id, 
              user_id,
              school_name, 
              school_city, 
              school_state,
              users:user_id(
                first_name,
                last_name
              )
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
        
        // Transform the data to match our Project type
        const formattedProjects = data?.map(project => {
          // Handle teacher data
          let teacherData = null;
          if (project.teacher_profiles) {
            const teacherProfile = Array.isArray(project.teacher_profiles) 
              ? project.teacher_profiles[0] 
              : project.teacher_profiles;
              
            if (teacherProfile) {
              // Create display name from first and last name
              let displayName = 'Teacher';
              
              if (teacherProfile.users) {
                // Handle users as potentially an array or a single object
                const userData = Array.isArray(teacherProfile.users) 
                  ? teacherProfile.users[0] 
                  : teacherProfile.users;
                
                if (userData) {
                  const firstName = userData.first_name || '';
                  const lastName = userData.last_name || '';
                  if (firstName || lastName) {
                    displayName = `${firstName} ${lastName}`.trim();
                  }
                }
              }
              
              teacherData = {
                id: teacherProfile.id,
                display_name: displayName,
                school: teacherProfile.school_name ? {
                  name: teacherProfile.school_name,
                  city: teacherProfile.school_city,
                  state: teacherProfile.school_state
                } : undefined
              };
            }
          }
          
          return {
            ...project,
            teacher: teacherData
          };
        }) || [];
        
        setProjects(formattedProjects);
        setFilteredProjects(formattedProjects);
      } catch (error: any) {
        console.error('Error fetching projects:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [featured, limit]);

  // Filter projects when search query or category changes
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
    
    // Apply category filter (this is a placeholder since we don't have categories in the data yet)
    if (categoryFilter && categoryFilter !== 'all') {
      // In a real implementation, you would filter by category
      // filtered = filtered.filter(project => project.category === categoryFilter);
    }
    
    setFilteredProjects(filtered);
  }, [searchQuery, categoryFilter, projects]);

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
  const defaultAvatarUrl = "/images/default-avatar.svg";

  // Handle image error by replacing with default image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultImageUrl;
    e.currentTarget.onerror = null; // Prevent infinite loops
  };

  // Handle avatar image error by replacing with default avatar
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultAvatarUrl;
    e.currentTarget.onerror = null; // Prevent infinite loops
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
          className="card project-card"
        >
          <div className="project-image-container">
            <img
              src={project.main_image_url || defaultImageUrl}
              alt={project.title || "Educational project"}
              onError={handleImageError}
            />
            <div className="project-funding-badge">
              {Math.round((project.current_amount / project.funding_goal) * 100)}% Funded
            </div>
            {/* Always show Teacher Avatar on Image */}
            <div className="absolute bottom-3 left-3 z-10">
              <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-md flex items-center justify-center text-white font-medium text-xl ${getAvatarColor(project.teacher?.display_name || 'Teacher')}`}>
                {getInitial(project.teacher?.display_name || 'Teacher')}
              </div>
            </div>
          </div>
          
          <div className="project-content">
            <h3 className="project-title">{project.title}</h3>
            <p className="project-description">{project.description}</p>
            
            {/* Project School Information */}
            {project.teacher?.school && (
              <div className="project-impact">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>
                  {project.teacher.school.name}, {project.teacher.school.city}, {project.teacher.school.state}
                </span>
              </div>
            )}
            
            <div className="project-progress">
              <div className="flex justify-between text-sm mb-2">
                <span>{formatCurrency(project.current_amount)} raised</span>
                <span>{formatCurrency(project.funding_goal)} goal</span>
              </div>
              <div className="project-progress-bar-container">
                <div 
                  className="project-progress-bar" 
                  style={{ width: `${Math.min(100, Math.round((project.current_amount / project.funding_goal) * 100))}%` }}
                ></div>
              </div>
            </div>
            
            <button 
              className="project-donate-button bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              onClick={(e) => {
                e.preventDefault();
                handleDonate(project.id);
              }}
            >
              Donate to Project
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
} 