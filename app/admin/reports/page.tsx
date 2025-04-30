'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  totalUsers: number;
  newUsers: number;
  userGrowthRate: number;
  totalSchools: number;
  newSchools: number;
  schoolGrowthRate: number;
  totalProjects: number;
  newProjects: number;
  projectGrowthRate: number;
  totalDonations: number;
  newDonations: number;
  donationGrowthRate: number;
}

interface TopPerformingSchool {
  name: string;
  completionRate: number;
  totalProjects: number;
  completedProjects: number;
}

interface DonationCategory {
  category: string;
  amount: number;
  color: string;
}

interface DailyActivity {
  name: string;
  value: number;
}

interface Activity {
  type: string;
  details: string;
  school: string;
  time: string;
  status: string;
  timeAgo: string;
}

export default function AdminReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccessChecked, setIsAccessChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('day');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1234,
    newUsers: 223,
    userGrowthRate: 12,
    totalSchools: 95,
    newSchools: 5,
    schoolGrowthRate: 6,
    totalProjects: 216,
    newProjects: 32,
    projectGrowthRate: 8,
    totalDonations: 106449,
    newDonations: 12500,
    donationGrowthRate: 16
  });
  
  const [topSchools, setTopSchools] = useState<TopPerformingSchool[]>([
    { name: 'Lincoln High School', completionRate: 75, totalProjects: 8, completedProjects: 6 },
    { name: 'Washington Elementary', completionRate: 80, totalProjects: 5, completedProjects: 4 },
    { name: 'Jefferson Middle School', completionRate: 67, totalProjects: 6, completedProjects: 4 },
    { name: 'Roosevelt High School', completionRate: 70, totalProjects: 10, completedProjects: 7 },
    { name: 'Kennedy Elementary', completionRate: 75, totalProjects: 4, completedProjects: 3 }
  ]);
  
  const [donationCategories, setDonationCategories] = useState<DonationCategory[]>([
    { category: 'Science & Technology', amount: 42500, color: '#3b82f6' },
    { category: 'Arts & Music', amount: 21200, color: '#8b5cf6' },
    { category: 'Sports & Recreation', amount: 15900, color: '#10b981' },
    { category: 'Library & Media', amount: 12800, color: '#f59e0b' },
    { category: 'General Facilities', amount: 14049, color: '#ef4444' }
  ]);
  
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([
    { name: 'Sun', value: 35 },
    { name: 'Mon', value: 58 },
    { name: 'Tue', value: 42 },
    { name: 'Wed', value: 30 },
    { name: 'Thu', value: 45 },
    { name: 'Fri', value: 55 },
    { name: 'Sat', value: 38 }
  ]);
  
  const [quarterlyData, setQuarterlyData] = useState<DailyActivity[]>([
    { name: 'Q1', value: 32000 },
    { name: 'Q2', value: 38000 },
    { name: 'Q3', value: 26000 },
    { name: 'Q4', value: 42000 }
  ]);

  const [recentActivities, setRecentActivities] = useState<Activity[]>([
    {
      type: 'Project',
      details: 'Library Renovation at Jefferson Middle School',
      school: 'Jefferson Middle School',
      time: '2 hours ago',
      status: 'Approved',
      timeAgo: '2 hours ago'
    },
    {
      type: 'Donation',
      details: '$1,200 for Science Lab Equipment',
      school: 'Lincoln High School',
      time: '5 hours ago',
      status: 'Received',
      timeAgo: '5 hours ago'
    },
    {
      type: 'Project',
      details: 'Science Lab Equipment by Lincoln High School',
      school: 'Lincoln High School',
      time: '1 day ago',
      status: 'Submitted',
      timeAgo: '1 day ago'
    },
    {
      type: 'User',
      details: 'Teacher John Doe from Washington Elementary',
      school: 'Washington Elementary',
      time: '2 days ago',
      status: 'Registered',
      timeAgo: '2 days ago'
    }
  ]);

  useEffect(() => {
    if (!authLoading) {
      // Redirect if not logged in
      if (!user) {
        router.push('/auth');
        return;
      }
      
      // Quick check if the user has admin role in their metadata
      const metadataRole = user.user_metadata?.role?.toLowerCase();
      if (metadataRole !== 'admin') {
        // Not an admin based on metadata, redirect to appropriate dashboard
        if (metadataRole === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/dashboard');
        }
        setIsAdmin(false);
        setIsAccessChecked(true);
        return;
      }
      
      // If we're here, continue with the database role check
      checkUserRole();
    }
  }, [user, authLoading, router]);

  const checkUserRole = async () => {
    try {
      if (!user) {
        setIsAdmin(false);
        setIsAccessChecked(true);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsAccessChecked(true);
        return;
      }
      
      const isAdminRole = data.role === 'admin';
      setIsAdmin(isAdminRole);
      setIsAccessChecked(true);
      
      if (isAdminRole) {
        fetchReportData();
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
      setIsAccessChecked(true);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Check database schema to see what tables are available
      console.log("Checking database schema...");
      try {
        const { data: schemaData, error: schemaError } = await supabase.rpc('execute_sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          `
        });
        
        if (schemaError) {
          console.error("Error checking schema:", schemaError);
        } else {
          const availableTables = schemaData.map(row => row.table_name);
          console.log("Available tables:", availableTables);
          
          // Check if we have the required tables
          const requiredTables = ['users', 'teacher_profiles', 'projects', 'donations'];
          const missingTables = requiredTables.filter(table => !availableTables.includes(table));
          
          if (missingTables.length > 0) {
            console.warn("Missing required tables:", missingTables);
            console.log("Will use sample data for missing tables");
          }
        }
      } catch (schemaCheckError) {
        console.error("Exception checking schema:", schemaCheckError);
      }
      
      // Initialize stats with default values
      const statsData = {
        totalUsers: 0,
        newUsers: 0,
        userGrowthRate: 0,
        totalSchools: 0,
        newSchools: 0,
        schoolGrowthRate: 0,
        totalProjects: 0,
        newProjects: 0,
        projectGrowthRate: 0,
        totalDonations: 0,
        newDonations: 0,
        donationGrowthRate: 0
      };
      
      // Try to fetch user stats
      try {
        const { data: userTableExists, error: userTableError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
          
        if (!userTableError) {
          // Get count of users
          const { count: totalUsers, error: usersError } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true });
            
          if (!usersError && totalUsers !== null) {
            statsData.totalUsers = totalUsers;
            
            // Get count of new users in the last month
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const { count: newUsers, error: newUsersError } = await supabase
              .from('users')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', oneMonthAgo.toISOString());
              
            if (!newUsersError && newUsers !== null) {
              statsData.newUsers = newUsers;
              statsData.userGrowthRate = totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0;
            }
          }
        } else {
          console.log('Users table does not exist or is empty. Using default user stats.');
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
      
      // Try to fetch school stats
      try {
        const { data: teacherTableExists, error: teacherTableError } = await supabase
          .from('teacher_profiles')
          .select('id')
          .limit(1);
          
        if (!teacherTableError) {
          // Get count of schools from teacher_profiles (each unique school)
          const { data: schoolsData, error: schoolsError } = await supabase
            .from('teacher_profiles')
            .select('school_name, created_at')
            .not('school_name', 'is', null);
            
          if (!schoolsError && schoolsData && schoolsData.length > 0) {
            // Count unique schools
            const uniqueSchools = new Set();
            schoolsData.forEach(teacher => {
              if (teacher.school_name) {
                uniqueSchools.add(teacher.school_name);
              }
            });
            
            statsData.totalSchools = uniqueSchools.size;
            
            // Count new schools in the last month
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const uniqueNewSchools = new Set();
            schoolsData.forEach(teacher => {
              if (teacher.school_name && teacher.created_at && new Date(teacher.created_at) >= oneMonthAgo) {
                uniqueNewSchools.add(teacher.school_name);
              }
            });
            
            statsData.newSchools = uniqueNewSchools.size;
            statsData.schoolGrowthRate = statsData.totalSchools > 0 ? 
              Math.round((statsData.newSchools / statsData.totalSchools) * 100) : 0;
          }
        } else {
          console.log('Teacher profiles table does not exist or is empty. Using default school stats.');
        }
      } catch (error) {
        console.error('Error fetching school stats:', error);
      }
      
      // Try to fetch project stats
      try {
        const { data: projectTableExists, error: projectTableError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
          
        if (!projectTableError) {
          // Get count of projects
          const { count: totalProjects, error: projectsError } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true });
            
          if (!projectsError && totalProjects !== null) {
            statsData.totalProjects = totalProjects;
            
            // Get count of new projects in the last month
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const { count: newProjects, error: newProjectsError } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', oneMonthAgo.toISOString());
              
            if (!newProjectsError && newProjects !== null) {
              statsData.newProjects = newProjects;
              statsData.projectGrowthRate = totalProjects > 0 ? 
                Math.round((newProjects / totalProjects) * 100) : 0;
            }
          }
        } else {
          console.log('Projects table does not exist or is empty. Using default project stats.');
        }
      } catch (error) {
        console.error('Error fetching project stats:', error);
      }
      
      // Try to fetch donation stats
      try {
        const { data: donationTableExists, error: donationTableError } = await supabase
          .from('donations')
          .select('id')
          .limit(1);
          
        if (!donationTableError) {
          // Get count and sum of donations
          const { data: donationsData, error: donationsError } = await supabase
            .from('donations')
            .select('amount, created_at');
            
          if (!donationsError && donationsData && donationsData.length > 0) {
            // Calculate total donations
            const totalDonations = donationsData.reduce((sum, donation) => 
              sum + (parseFloat(donation.amount) || 0), 0);
            
            statsData.totalDonations = totalDonations;
            
            // Get new donations in the last month
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const newDonations = donationsData
              .filter(donation => donation.created_at && new Date(donation.created_at) >= oneMonthAgo)
              .reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0);
            
            statsData.newDonations = newDonations;
            statsData.donationGrowthRate = totalDonations > 0 ? 
              Math.round((newDonations / totalDonations) * 100) : 0;
          }
        } else {
          console.log('Donations table does not exist or is empty. Using default donation stats.');
        }
      } catch (error) {
        console.error('Error fetching donation stats:', error);
      }
      
      // If no real data was found, use the sample data, otherwise use the real data
      if (statsData.totalUsers > 0 || statsData.totalProjects > 0 || 
          statsData.totalSchools > 0 || statsData.totalDonations > 0) {
        setStats(statsData);
      } else {
        console.log('Using sample stats data as no real data is available.');
      }
      
      // Fetch top performing schools
      const { data: schoolProjectsData, error: schoolProjectsError } = await supabase
        .from('teacher_profiles')
        .select(`
          school_name,
          projects:projects(
            id,
            status
          )
        `)
        .not('school_name', 'is', null);
        
      if (schoolProjectsError) {
        console.error('Error fetching school projects:', schoolProjectsError);
      }
      
      // Process schools data to get completion rates
      const schoolStats = {};
      
      if (schoolProjectsData) {
        schoolProjectsData.forEach(schoolData => {
          const schoolName = schoolData.school_name;
          
          if (!schoolName) return;
          
          if (!schoolStats[schoolName]) {
            schoolStats[schoolName] = {
              totalProjects: 0,
              completedProjects: 0
            };
          }
          
          if (schoolData.projects) {
            schoolData.projects.forEach(project => {
              schoolStats[schoolName].totalProjects++;
              if (project.status === 'completed') {
                schoolStats[schoolName].completedProjects++;
              }
            });
          }
        });
      }
      
      // Calculate top performing schools
      const topSchoolsArray = Object.entries(schoolStats)
        .map(([name, stats]) => ({
          name,
          totalProjects: stats.totalProjects,
          completedProjects: stats.completedProjects,
          completionRate: stats.totalProjects > 0 
            ? Math.round((stats.completedProjects / stats.totalProjects) * 100) 
            : 0
        }))
        .filter(school => school.totalProjects > 0)
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 5);
        
      setTopSchools(topSchoolsArray.length > 0 ? topSchoolsArray : topSchools);
      
      // Fetch donation categories
      let donationCategoriesArray = [];
      try {
        // First check if the donations table exists
        const { data: tableExists, error: checkError } = await supabase
          .from('donations')
          .select('id')
          .limit(1);

        console.log('Donations table check:', tableExists ? 'exists' : 'does not exist', checkError ? `(Error: ${JSON.stringify(checkError)})` : '');

        if (!checkError) {
          // Table exists, proceed with a simpler query without relations
          const { data: categoryDonations, error: categoryError } = await supabase
            .from('donations')
            .select('category, amount');
            
          console.log('Donation categories query result:', 
            categoryDonations ? `Found ${categoryDonations.length} donations` : 'No data', 
            categoryError ? `(Error: ${JSON.stringify(categoryError)})` : '');
          
          if (categoryError) {
            console.error('Error fetching donation categories:', categoryError);
          } else if (categoryDonations && categoryDonations.length > 0) {
            // Process donation categories
            const categories = {};
            const categoryColors = {
              'Science & Technology': '#3b82f6',
              'Arts & Music': '#8b5cf6', 
              'Sports & Recreation': '#10b981',
              'Library & Media': '#f59e0b',
              'General Facilities': '#ef4444',
              'Other': '#64748b'
            };
            
            categoryDonations.forEach(donation => {
              const category = donation.category || 'Other';
              if (!categories[category]) {
                categories[category] = 0;
              }
              categories[category] += donation.amount || 0;
            });
            
            donationCategoriesArray = Object.entries(categories)
              .map(([category, amount]) => ({
                category,
                amount,
                color: categoryColors[category] || '#64748b'
              }))
              .sort((a, b) => b.amount - a.amount);
          }
        }
      } catch (error) {
        console.error('Exception when fetching donation categories:', error);
        // Continue with sample data
      }
      
      // Add a fallback for donation categories using raw SQL if the client API fails
      if (categoryError || !categoryDonations || categoryDonations.length === 0) {
        console.log('Trying fallback SQL query for donation categories');
        // Try using raw SQL instead
        try {
          const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
            query: 'SELECT category, SUM(amount) as amount FROM donations GROUP BY category'
          });
          
          if (sqlError) {
            console.error('SQL fallback error:', sqlError);
          } else if (sqlData && sqlData.length > 0) {
            console.log('SQL fallback successful, found categories:', sqlData);
            
            // Process the data from SQL query
            const categories = {};
            const categoryColors = {
              'Science & Technology': '#3b82f6',
              'Arts & Music': '#8b5cf6', 
              'Sports & Recreation': '#10b981',
              'Library & Media': '#f59e0b',
              'General Facilities': '#ef4444',
              'Other': '#64748b'
            };
            
            sqlData.forEach(row => {
              const category = row.category || 'Other';
              categories[category] = parseFloat(row.amount) || 0;
            });
            
            donationCategoriesArray = Object.entries(categories)
              .map(([category, amount]) => ({
                category,
                amount,
                color: categoryColors[category] || '#64748b'
              }))
              .sort((a, b) => b.amount - a.amount);
          }
        } catch (fallbackError) {
          console.error('SQL fallback exception:', fallbackError);
        }
      }
      
      // Use real data if available, otherwise fall back to sample data
      setDonationCategories(donationCategoriesArray.length > 0 ? donationCategoriesArray : donationCategories);
      
      // Fetch daily activity with proper error handling
      try {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        // Check if projects table exists
        const { data: projectTableExists, error: projectTableError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
          
        if (!projectTableError) {
          // Table exists, proceed with query
          const { data: weeklyActivity, error: activityError } = await supabase
            .from('projects')
            .select('created_at')
            .gte('created_at', oneWeekAgo.toISOString());
            
          if (activityError) {
            console.error('Error fetching weekly activity:', activityError);
          } else if (weeklyActivity && weeklyActivity.length > 0) {
            // Process daily activity
            const dailyCount = days.map(() => 0);
            
            weeklyActivity.forEach(activity => {
              const date = new Date(activity.created_at);
              const dayIndex = date.getDay();
              dailyCount[dayIndex]++;
            });
            
            const dailyActivityData = days.map((day, index) => ({
              name: day,
              value: dailyCount[index]
            }));
            
            setDailyActivity(dailyActivityData);
          } else {
            console.log('No weekly activity data found. Using sample data.');
          }
        } else {
          console.log('Projects table does not exist or is empty. Using sample data for daily activity.');
        }
      } catch (error) {
        console.error('Exception when fetching daily activity:', error);
      }
      
      // Fetch quarterly donation data with proper error handling
      try {
        const currentYear = new Date().getFullYear();
        const quarters = [
          { name: 'Q1', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
          { name: 'Q2', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
          { name: 'Q3', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
          { name: 'Q4', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }
        ];
        
        // Check if donations table exists
        const { data: donationsTableExists, error: donationsTableError } = await supabase
          .from('donations')
          .select('id')
          .limit(1);
          
        if (!donationsTableError) {
          const quarterlyValues = [];
          let hasData = false;
          
          for (const quarter of quarters) {
            const { data: quarterDonations, error: quarterError } = await supabase
              .from('donations')
              .select('amount')
              .gte('created_at', quarter.start.toISOString())
              .lte('created_at', quarter.end.toISOString());
              
            if (quarterError) {
              console.error(`Error fetching ${quarter.name} donations:`, quarterError);
            }
            
            const quarterTotal = quarterDonations?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0;
            
            quarterlyValues.push({
              name: quarter.name,
              value: quarterTotal
            });
            
            if (quarterTotal > 0) {
              hasData = true;
            }
          }
          
          if (hasData) {
            setQuarterlyData(quarterlyValues);
          } else {
            console.log('No quarterly donation data found. Using sample data.');
          }
        } else {
          console.log('Donations table does not exist or is empty. Using sample data for quarterly data.');
        }
      } catch (error) {
        console.error('Exception when fetching quarterly donation data:', error);
      }
      
      // Fetch recent activities
      const recentActivitiesArray = [];
      
      // Check if the projects table exists before querying
      try {
        const { data: projectsExist, error: projectsCheckError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
        
        if (!projectsCheckError) {
          // Get recent projects
          const { data: recentProjects, error: recentProjectsError } = await supabase
            .from('projects')
            .select(`
              id,
              title,
              status,
              created_at,
              teacher_id,
              teacher_profiles(school_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (recentProjectsError) {
            console.error('Error fetching recent projects:', recentProjectsError);
          } else if (recentProjects && recentProjects.length > 0) {
            // Process projects
            recentProjects.forEach(project => {
              const timeAgo = formatTimeAgo(new Date(project.created_at));
              const schoolName = project.teacher_profiles?.school_name || 'N/A';
              
              recentActivitiesArray.push({
                type: 'Project',
                details: project.title,
                school: schoolName,
                time: project.created_at,
                status: capitalizeFirstLetter(project.status || 'pending'),
                timeAgo
              });
            });
          }
        } else {
          console.log('Projects table does not exist or is empty.');
        }
      } catch (error) {
        console.error('Exception when fetching recent projects:', error);
      }
      
      // Check if the donations table exists before querying
      try {
        const { data: donationsExist, error: donationsCheckError } = await supabase
          .from('donations')
          .select('id')
          .limit(1);
        
        if (!donationsCheckError) {
          // Get recent donations
          const { data: recentDonations, error: recentDonationsError } = await supabase
            .from('donations')
            .select(`
              id,
              amount,
              project_id,
              status,
              created_at,
              projects(
                title,
                teacher_profiles(school_name)
              )
            `)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (recentDonationsError) {
            console.error('Error fetching recent donations:', recentDonationsError);
          } else if (recentDonations && recentDonations.length > 0) {
            // Process donations
            recentDonations.forEach(donation => {
              const timeAgo = formatTimeAgo(new Date(donation.created_at));
              const amount = donation.amount ? `$${donation.amount.toLocaleString()}` : 'N/A';
              const projectTitle = donation.projects?.title || 'General Donation';
              const schoolName = donation.projects?.teacher_profiles?.school_name || 'N/A';
              
              recentActivitiesArray.push({
                type: 'Donation',
                details: `${amount} for ${projectTitle}`,
                school: schoolName,
                time: donation.created_at,
                status: donation.status || 'Received',
                timeAgo
              });
            });
          }
        } else {
          console.log('Donations table does not exist or is empty.');
        }
      } catch (error) {
        console.error('Exception when fetching recent donations:', error);
      }
      
      // Check if the users table exists before querying
      try {
        const { data: usersExist, error: usersCheckError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        console.log('Users table check:', usersExist ? 'exists' : 'does not exist', usersCheckError ? `(Error: ${JSON.stringify(usersCheckError)})` : '');

        if (!usersCheckError) {
          // First get basic user data without complex joins
          const { data: recentUsers, error: recentUsersError } = await supabase
            .from('users')
            .select('id, email, role, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
            
          console.log('Recent users query result:', 
            recentUsers ? `Found ${recentUsers.length} users` : 'No data', 
            recentUsersError ? `(Error: ${JSON.stringify(recentUsersError)})` : '');
          
          if (recentUsersError) {
            console.error('Error fetching recent users:', recentUsersError);
          } else if (recentUsers && recentUsers.length > 0) {
            // For users that are teachers, try to fetch their profile data separately
            for (const user of recentUsers) {
              if (user.role === 'teacher') {
                // Only fetch teacher profile if the user is a teacher
                try {
                  const { data: teacherProfile, error: profileError } = await supabase
                    .from('teacher_profiles')
                    .select('school_name, first_name, last_name')
                    .eq('user_id', user.id)
                    .single();
                  
                  const timeAgo = formatTimeAgo(new Date(user.created_at));
                  const teacherName = teacherProfile?.first_name && teacherProfile?.last_name 
                    ? `${teacherProfile.first_name} ${teacherProfile.last_name}`
                    : 'New Teacher';
                  const schoolName = teacherProfile?.school_name || 'N/A';
                  
                  recentActivitiesArray.push({
                    type: 'User',
                    details: `Teacher ${teacherName} from ${schoolName}`,
                    school: schoolName,
                    time: user.created_at,
                    status: 'Registered',
                    timeAgo
                  });
                } catch (profileError) {
                  console.error('Error fetching teacher profile:', profileError);
                  // Still add the user with limited information
                  recentActivitiesArray.push({
                    type: 'User',
                    details: `New Teacher (${user.email})`,
                    school: 'Unknown',
                    time: user.created_at,
                    status: 'Registered',
                    timeAgo: formatTimeAgo(new Date(user.created_at))
                  });
                }
              }
            }
          }
        } else {
          console.log('Users table does not exist or is empty.');
        }
      } catch (error) {
        console.error('Exception when fetching recent users:', error);
      }
      
      // Add a fallback for recent users using raw SQL if the client API fails
      if (recentUsersError || !recentUsers || recentUsers.length === 0) {
        console.log('Trying fallback SQL query for recent users');
        // Try using raw SQL instead
        try {
          const { data: sqlUserData, error: sqlUserError } = await supabase.rpc('execute_sql', {
            query: `
              SELECT u.id, u.email, u.role, u.created_at, 
                     tp.school_name, tp.first_name, tp.last_name
              FROM users u
              LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
              ORDER BY u.created_at DESC
              LIMIT 5
            `
          });
          
          if (sqlUserError) {
            console.error('SQL user fallback error:', sqlUserError);
          } else if (sqlUserData && sqlUserData.length > 0) {
            console.log('SQL user fallback successful, found users:', sqlUserData);
            
            sqlUserData.forEach(user => {
              if (user.role === 'teacher') {
                const timeAgo = formatTimeAgo(new Date(user.created_at));
                const teacherName = user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : 'New Teacher';
                const schoolName = user.school_name || 'N/A';
                
                recentActivitiesArray.push({
                  type: 'User',
                  details: `Teacher ${teacherName} from ${schoolName}`,
                  school: schoolName,
                  time: user.created_at,
                  status: 'Registered',
                  timeAgo
                });
              }
            });
          }
        } catch (fallbackError) {
          console.error('SQL user fallback exception:', fallbackError);
        }
      }
      
      // Sort all activities by time (newest first) if we have any
      if (recentActivitiesArray.length > 0) {
        recentActivitiesArray.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
        // Take the 10 most recent activities
        const mostRecentActivities = recentActivitiesArray.slice(0, 10);
        setRecentActivities(mostRecentActivities);
      } else {
        // If no real data, keep using the sample data
        console.log('Using sample activity data as no real data is available.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  if (!isAccessChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You do not have permission to access the admin reports. This area is restricted to administrators only.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              If you believe you should have admin access, please contact the system administrator.
            </p>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Reports</h1>
          <button 
            onClick={() => {
              // In a real implementation, we would generate a PDF or Excel report here
              alert('Generating report...');
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Generate Report
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-blue-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{stats.newUsers} new this month</div>
              <div className={`text-xs mt-2 ${stats.userGrowthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.userGrowthRate > 0 ? '↑' : '↓'} {Math.abs(stats.userGrowthRate)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-indigo-600">Total Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSchools.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{stats.newSchools} new this month</div>
              <div className={`text-xs mt-2 ${stats.schoolGrowthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.schoolGrowthRate > 0 ? '↑' : '↓'} {Math.abs(stats.schoolGrowthRate)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-purple-600">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProjects.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{stats.newProjects} new this month</div>
              <div className={`text-xs mt-2 ${stats.projectGrowthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.projectGrowthRate > 0 ? '↑' : '↓'} {Math.abs(stats.projectGrowthRate)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-orange-600">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.totalDonations.toLocaleString()}</div>
              <div className="text-sm text-gray-500">${stats.newDonations.toLocaleString()} this month</div>
              <div className={`text-xs mt-2 ${stats.donationGrowthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.donationGrowthRate > 0 ? '↑' : '↓'} {Math.abs(stats.donationGrowthRate)}%
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance Overview */}
        <Card className="bg-white dark:bg-gray-800 mb-8">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <p className="text-sm text-gray-500">Track system performance metrics over time</p>
            
            <div className="flex justify-end mt-4">
              <Tabs defaultValue="overview" className="w-[400px]">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="schools">Schools</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="ml-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
                  <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performing Schools */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Top Performing Schools</CardTitle>
              <p className="text-sm text-gray-500">Schools with the highest project completion rates</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topSchools.map((school) => (
                  <div key={school.name}>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>{school.name}</span>
                      <span>{school.completedProjects} of {school.totalProjects} projects</span>
                    </div>
                    <div className="relative pt-1">
                      <Progress value={school.completionRate} className="h-2" />
                      <div className="flex justify-end text-xs text-muted-foreground mt-1">
                        {school.completionRate}%
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center mt-6">
                  <Link href="/admin/schools" className="text-sm text-blue-600 hover:underline">
                    View All Schools
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Donation Distribution */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Donation Distribution</CardTitle>
              <p className="text-sm text-gray-500">Breakdown of donations by project category</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donationCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="category"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {donationCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 mt-4">
                {donationCategories.map((category) => (
                  <div key={category.category} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      <span>{category.category}</span>
                    </div>
                    <span className="font-medium">${category.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6">
                <Link href="/admin/donations" className="text-sm text-blue-600 hover:underline">
                  View Detailed Breakdown
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* System Activity */}
        <Card className="bg-white dark:bg-gray-800 mb-8">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <p className="text-sm text-gray-500">Daily activity and performance metrics</p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-gray-500">Latest platform activities and updates</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.details}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getActivityTypeColor(activity.type)}`}>
                          {activity.type.charAt(0)}
                        </div>
                        {activity.type}
                      </div>
                    </TableCell>
                    <TableCell>{activity.details}</TableCell>
                    <TableCell>{activity.school}</TableCell>
                    <TableCell>{activity.timeAgo}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.status)}`}>{activity.status}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
}

function capitalizeFirstLetter(string: string): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getActivityTypeColor(type: string): string {
  switch (type) {
    case 'Project':
      return 'bg-blue-100 text-blue-600';
    case 'Donation':
      return 'bg-purple-100 text-purple-600';
    case 'User':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'received':
      return 'bg-green-100 text-green-800';
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'registered':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 