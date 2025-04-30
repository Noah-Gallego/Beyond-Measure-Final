'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../../utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Content component that will be wrapped in Suspense
function CreateProjectContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  
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

  useEffect(() => {
    checkUserRole();
    fetchCategories();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsTeacher(false);
        return;
      }
      
      // Import the role helper
      const { getUserRole } = await import('@/utils/role-helpers');
      const role = await getUserRole(user);
      
      if (role !== 'teacher') {
        console.log(`User role is ${role}, not teacher`);
        setIsTeacher(false);
        setMessage('You do not have permission to access this page. Only teachers can create projects.');
        return;
      }
      
      // Set teacher status
      setIsTeacher(true);
      
      // Now get the teacher profile ID
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          teacher_profiles(id)
        `)
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching teacher profile:', error);
        setMessage('Error fetching your teacher profile. Please refresh and try again.');
        return;
      }
      
      // Get teacher profile ID
      let profileId = null;
      
      if (data.teacher_profiles) {
        // Handle both possible formats: array or object with id property
        if (Array.isArray(data.teacher_profiles) && data.teacher_profiles.length > 0) {
          profileId = data.teacher_profiles[0].id;
        } else if (data.teacher_profiles && typeof data.teacher_profiles === 'object' && 'id' in data.teacher_profiles) {
          profileId = data.teacher_profiles.id;
        }
      }
      
      if (profileId) {
        setTeacherProfileId(profileId);
      } else {
        // Try to create a teacher profile
        const { data: newProfile, error: createError } = await supabase
          .from('teacher_profiles')
          .insert({
            user_id: data.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating teacher profile:', createError);
          setMessage('Teacher profile not found and could not be created automatically. Please complete your profile setup.');
        } else if (newProfile) {
          setTeacherProfileId(newProfile.id);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsTeacher(false);
      setMessage('Error checking your access permissions. Please try again later.');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      setMessage('Teacher profile not found. Unable to create project.');
      return;
    }
    
    if (!isValidTitle || !isValidDescription || !isValidStudentImpact || !isValidFundingGoal || !isValidMainImageUrl) {
      setMessage('Please correct the errors in the form before submitting.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Parse funding goal to ensure it's a number
      const fundingGoalNumber = parseFloat(fundingGoal);
      
      // Insert the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          teacher_id: teacherProfileId,
          title,
          description,
          student_impact: studentImpact,
          funding_goal: fundingGoalNumber,
          main_image_url: mainImageUrl || null,
          status: 'draft'
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Error creating project:', projectError);
        setMessage(`Error: ${projectError.message}`);
        return;
      }
      
      // Add project categories if selected
      if (selectedCategories.length > 0 && projectData) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          project_id: projectData.id,
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
      
      setMessage('Project created successfully!');
      
      // Redirect to the project detail page
      setTimeout(() => {
        router.push(`/teacher/projects/${projectData.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating project:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Access Denied</h1>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{message || 'You do not have permission to access this page.'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/teacher/projects" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Fill out the form below to create a new funding project</p>
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
                    {isValidStudentImpact ? "Looks good!" : "Impact statement should be at least 10 characters"}
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
                  placeholder="How will this project benefit your students? How many students will it impact?"
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
                href="/teacher/projects"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-md"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function CreateProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <CreateProjectContent />
    </Suspense>
  );
} 