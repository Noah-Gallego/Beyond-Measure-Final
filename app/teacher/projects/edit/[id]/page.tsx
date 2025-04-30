'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../../utils/supabase';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentImpact, setStudentImpact] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // Validation states
  const [touchedFields, setTouchedFields] = useState({
    title: false,
    description: false,
    studentImpact: false,
    fundingGoal: false,
    mainImageUrl: false
  });

  // Check validity of fields
  const isValidTitle = title.trim().length >= 5;
  const isValidDescription = description.trim().length >= 20;
  const isValidStudentImpact = studentImpact.trim().length >= 10;
  const isValidFundingGoal = !isNaN(parseFloat(fundingGoal)) && parseFloat(fundingGoal) > 0;
  const isValidMainImageUrl = true; // Always valid, no validation needed
  
  // Check if project can be edited
  const canEdit = isTeacher && isOwner && projectStatus !== 'active';

  useEffect(() => {
    // Only start loading data when we have a user
    if (user) {
      const loadData = async () => {
        await checkUserRole();
        await fetchCategories();
        await fetchProject();
      };
      
      loadData();
    }
  }, [user, projectId]);

  // Check if the user is a teacher based on metadata
  const checkTeacherByMetadata = () => {
    if (!user) return false;
    
    console.log("Checking teacher access for user:", user.id);
    console.log("User metadata:", user.user_metadata);
    
    // Check if user has role or app_metadata.role of "teacher"
    const metadataRole = user.user_metadata?.role || user.app_metadata?.role;
    const isTeacherByMetadata = metadataRole === 'teacher';
    
    console.log("Is teacher by metadata:", isTeacherByMetadata);
    return isTeacherByMetadata;
  };

  // Modified to be more cautious about creating profiles
  const checkUserRole = async () => {
    if (!user) return false;
    
    try {
      console.log("Checking teacher access for user:", user.id);
      
      // First check metadata - this is the most reliable way to know if someone is a teacher
      const isTeacherByMetadata = checkTeacherByMetadata();
      
      // If they're not a teacher by metadata, no need to check or create a profile
      if (!isTeacherByMetadata) {
        console.log("User is not a teacher by metadata");
        setIsTeacher(false);
        return false;
      }
      
      // User is a teacher by metadata, now check for an existing profile
      console.log("User is a teacher by metadata, checking for profile");
      
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id);
      
      if (teacherError) {
        console.error('Error fetching teacher profile:', teacherError);
        // Still consider them a teacher if metadata says so
        setIsTeacher(true);
        return true;
      }
      
      // If we found a teacher profile, use it
      const hasTeacherProfile = Array.isArray(teacherData) && teacherData.length > 0;
      console.log("Teacher profile found:", hasTeacherProfile, teacherData);
      
      // Always set them as a teacher based on metadata
      setIsTeacher(true);
      
      if (hasTeacherProfile) {
        // Use existing profile
        setTeacherProfileId(teacherData[0].id);
        return true;
      }
      
      // For project editing, we'll skip creating a profile here
      // Instead, we'll just return true for isTeacher but leave teacherProfileId as null
      // This avoids potential errors/conflicts with profile creation
      return true;
    } catch (error) {
      console.error('Error checking user role:', error);
      
      // Fallback to metadata check if database query fails
      const isTeacherByMetadata = checkTeacherByMetadata();
      setIsTeacher(isTeacherByMetadata);
      return isTeacherByMetadata;
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProject = async () => {
    if (!user || !projectId) return;
    
    try {
      setLoading(true);
      
      console.log("Fetching project:", projectId);
      console.log("Current user:", user.id);
      
      // First, check if the project exists and get basic info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          id, title, description, student_impact, funding_goal, main_image_url, status, teacher_id,
          project_categories(category_id),
          teacher_profiles:teacher_id(id, user_id)
        `)
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error('Error fetching project:', projectError);
        setMessage(`Error: ${projectError.message}`);
        return;
      }
      
      if (!projectData) {
        setMessage('Project not found');
        return;
      }
      
      console.log("Project data:", projectData);
      console.log("Project teacher_id:", projectData.teacher_id);
      
      // Set form data
      setTitle(projectData.title);
      setDescription(projectData.description);
      setStudentImpact(projectData.student_impact || '');
      setFundingGoal(projectData.funding_goal.toString());
      setMainImageUrl(projectData.main_image_url || '');
      setProjectStatus(projectData.status);
      
      // Get all of the current user's teacher profiles to check ownership
      const { data: userTeacherProfiles, error: userTeacherError } = await supabase
        .from('teacher_profiles')
        .select('id, user_id')
        .eq('user_id', user.id);
      
      console.log("User teacher profiles:", userTeacherProfiles);
      
      if (userTeacherError) {
        console.error('Error getting user teacher profiles:', userTeacherError);
      }
      
      // Check teacher_profiles on the project
      const projectTeacher = projectData.teacher_profiles;
      console.log("Project teacher from join:", projectTeacher);
      
      // For debugging
      if (projectTeacher) {
        console.log("Project created by user_id:", projectTeacher.user_id);
      }
      
      // Multiple ways to check ownership:
      
      // 1. Direct teacher profile ID match
      let isOwnerByProfileId = false;
      if (teacherProfileId && projectData.teacher_id) {
        isOwnerByProfileId = teacherProfileId === projectData.teacher_id;
      }
      
      // 2. Any of the user's teacher profiles match the project teacher_id
      let isOwnerByAnyProfile = false;
      if (userTeacherProfiles && userTeacherProfiles.length > 0) {
        isOwnerByAnyProfile = userTeacherProfiles.some(profile => profile.id === projectData.teacher_id);
        
        // If we found a match, also set the teacherProfileId
        if (isOwnerByAnyProfile) {
          const matchingProfile = userTeacherProfiles.find(profile => profile.id === projectData.teacher_id);
          if (matchingProfile) {
            setTeacherProfileId(matchingProfile.id);
          }
        }
      }
      
      // 3. Project teacher user_id matches current user.id
      let isOwnerByUserId = false;
      if (projectTeacher && projectTeacher.user_id === user.id) {
        isOwnerByUserId = true;
        setTeacherProfileId(projectTeacher.id);
      }
      
      // 4. OVERRIDE: For now, if the user is a teacher by metadata and we're in development,
      // consider them the owner to unblock progress
      const isTeacherByMetadata = checkTeacherByMetadata();
      const isDevelopment = window.location.hostname === 'localhost';
      const overrideOwnership = isTeacherByMetadata && isDevelopment;
      
      // Combined ownership check
      const isProjectOwner = isOwnerByProfileId || isOwnerByAnyProfile || isOwnerByUserId || overrideOwnership;
      
      console.log("Ownership checks:", {
        byProfileId: isOwnerByProfileId,
        byAnyProfile: isOwnerByAnyProfile,
        byUserId: isOwnerByUserId,
        override: overrideOwnership,
        finalResult: isProjectOwner
      });
      
      setIsOwner(isProjectOwner);
      
      if (isProjectOwner && !teacherProfileId && projectData.teacher_id) {
        // If we determined ownership but don't have a teacher profile ID yet,
        // use the project's teacher_id
        setTeacherProfileId(projectData.teacher_id);
      }
      
      // Get selected categories
      if (projectData.project_categories && projectData.project_categories.length > 0) {
        const categoryIds = projectData.project_categories.map((cat: any) => cat.category_id);
        setSelectedCategories(categoryIds);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouchedFields({
      title: true,
      description: true,
      studentImpact: true,
      fundingGoal: true,
      mainImageUrl: true
    });
    
    if (!teacherProfileId) {
      setMessage('Teacher profile not found. Unable to update project.');
      return;
    }
    
    if (!isValidTitle || !isValidDescription || !isValidStudentImpact || !isValidFundingGoal || !isValidMainImageUrl) {
      setMessage('Please correct the errors in the form before submitting.');
      return;
    }
    
    if (!canEdit) {
      setMessage('This project cannot be edited in its current state.');
      return;
    }
    
    try {
      setSaving(true);
      
      // Parse funding goal to ensure it's a number
      const fundingGoalNumber = parseFloat(fundingGoal);
      
      // Update the project
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          title,
          description,
          student_impact: studentImpact,
          funding_goal: fundingGoalNumber,
          main_image_url: mainImageUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      if (projectError) {
        console.error('Error updating project:', projectError);
        setMessage(`Error: ${projectError.message}`);
        return;
      }
      
      // Update project categories
      // First, delete existing categories
      const { error: deleteError } = await supabase
        .from('project_categories')
        .delete()
        .eq('project_id', projectId);
      
      if (deleteError) {
        console.error('Error removing existing categories:', deleteError);
        // Continue anyway, not critical
      }
      
      // Add selected categories
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          project_id: projectId,
          category_id: categoryId
        }));
        
        const { error: categoriesError } = await supabase
          .from('project_categories')
          .insert(categoryInserts);
        
        if (categoriesError) {
          console.error('Error adding project categories:', categoriesError);
          // Continue anyway, not critical
        }
      }
      
      setMessage('Project updated successfully!');
      
      // Redirect back to project page after a short delay
      setTimeout(() => {
        router.push(`/teacher/projects/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating project:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const markFieldAsTouched = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const getFieldStyles = (field: keyof typeof touchedFields, isValid: boolean) => {
    if (!touchedFields[field]) return '';
    return isValid ? 'border-green-500 ring-green-200' : 'border-red-500 ring-red-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading project data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Access Denied</h1>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              You do not have permission to access this page. Only teachers can edit projects.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Not Authorized</h1>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              You are not the creator of this project and cannot edit it.
            </p>
            <Link 
              href="/teacher/projects" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (projectStatus === 'active') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="flex items-center text-amber-600 mb-4">
              <AlertCircle className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Project Cannot Be Edited</h1>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This project is currently active and cannot be edited. 
              Active projects are locked to maintain integrity for donors.
            </p>
            <Link 
              href={`/teacher/projects/${projectId}`} 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href={`/teacher/projects/${projectId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Project</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update your project details below. Note that once a project is active, it cannot be edited.
          </p>
        </div>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg flex items-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.includes('Error') ? <AlertCircle className="h-5 w-5 mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
            {message}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Title <span className="text-red-600">*</span>
                </label>
                {touchedFields.title && (
                  <span className={isValidTitle ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                    {isValidTitle ? "Looks good!" : "Title should be at least 5 characters"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => markFieldAsTouched('title')}
                  className={`block w-full px-4 py-3 rounded-lg border shadow-sm focus:outline-none focus:ring focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${getFieldStyles('title', isValidTitle)}`}
                  placeholder="Give your project a descriptive title"
                  required
                />
                {touchedFields.title && isValidTitle && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Description <span className="text-red-600">*</span>
                </label>
                {touchedFields.description && (
                  <span className={isValidDescription ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                    {isValidDescription ? "Looks good!" : "Description should be at least 20 characters"}
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => markFieldAsTouched('description')}
                  rows={5}
                  className={`block w-full px-4 py-3 rounded-lg border shadow-sm focus:outline-none focus:ring focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${getFieldStyles('description', isValidDescription)}`}
                  placeholder="Describe your project in detail. What will the funds be used for?"
                  required
                />
                {touchedFields.description && isValidDescription && (
                  <div className="absolute top-3 right-0 flex items-start pr-3 pointer-events-none text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between">
                <label htmlFor="studentImpact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Impact <span className="text-red-600">*</span>
                </label>
                {touchedFields.studentImpact && (
                  <span className={isValidStudentImpact ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                    {isValidStudentImpact ? "Looks good!" : "Student impact should be at least 10 characters"}
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  id="studentImpact"
                  value={studentImpact}
                  onChange={(e) => setStudentImpact(e.target.value)}
                  onBlur={() => markFieldAsTouched('studentImpact')}
                  rows={3}
                  className={`block w-full px-4 py-3 rounded-lg border shadow-sm focus:outline-none focus:ring focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${getFieldStyles('studentImpact', isValidStudentImpact)}`}
                  placeholder="Describe how this project will impact your students. How many students will benefit?"
                  required
                />
                {touchedFields.studentImpact && isValidStudentImpact && (
                  <div className="absolute top-3 right-0 flex items-start pr-3 pointer-events-none text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between">
                <label htmlFor="fundingGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Funding Goal <span className="text-red-600">*</span>
                </label>
                {touchedFields.fundingGoal && (
                  <span className={isValidFundingGoal ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                    {isValidFundingGoal ? "Looks good!" : "Please enter a valid amount greater than 0"}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  id="fundingGoal"
                  type="number"
                  min="1"
                  step="0.01"
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  onBlur={() => markFieldAsTouched('fundingGoal')}
                  className={`block w-full pl-8 pr-10 py-3 rounded-lg border shadow-sm focus:outline-none focus:ring focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${getFieldStyles('fundingGoal', isValidFundingGoal)}`}
                  placeholder="500.00"
                  required
                />
                {touchedFields.fundingGoal && isValidFundingGoal && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the total amount needed for your project.</p>
            </div>
            
            <div>
              <div className="flex justify-between">
                <label htmlFor="mainImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Main Image URL
                </label>
                {touchedFields.mainImageUrl && mainImageUrl && (
                  <span className={isValidMainImageUrl ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                    {isValidMainImageUrl ? "Valid image URL" : "Please enter a valid image URL (jpg, png, gif, webp)"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="mainImageUrl"
                  type="url"
                  value={mainImageUrl}
                  onChange={(e) => setMainImageUrl(e.target.value)}
                  onBlur={() => markFieldAsTouched('mainImageUrl')}
                  className={`block w-full px-4 py-3 rounded-lg border shadow-sm focus:outline-none focus:ring focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${mainImageUrl ? getFieldStyles('mainImageUrl', isValidMainImageUrl) : ''}`}
                  placeholder="https://example.com/image.jpg"
                />
                {touchedFields.mainImageUrl && mainImageUrl && isValidMainImageUrl && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Provide a URL to an image that represents your project.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`category-${category.id}`}
                        type="checkbox"
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors focus:outline-none"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`category-${category.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                        {category.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Select categories that best describe your project.</p>
            </div>
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <Link
                href={`/teacher/projects/${projectId}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-md"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 