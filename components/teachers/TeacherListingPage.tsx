'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Building, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface TeacherData {
  id: string;
  user_id: string;
  school_name: string;
  position_title: string;
  school_city: string;
  school_state: string;
  bio?: string;
  philosophy?: string;
  user: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
}

export default function TeacherListingPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data, error } = await supabase
          .from('teacher_profiles')
          .select(`
            id,
            user_id,
            school_name,
            position_title,
            school_city,
            school_state,
            bio,
            philosophy,
            users:user_id (
              id,
              first_name,
              last_name,
              profile_image_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching teachers:', error);
          return;
        }

        // Transform data to ensure user info is accessed properly
        const transformedData = data.map((teacher: any) => ({
          ...teacher,
          user: teacher.users || {}
        }));

        setTeachers(transformedData);
      } catch (err) {
        console.error('Error fetching teachers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.user?.first_name || ''} ${teacher.user?.last_name || ''}`.toLowerCase();
    const schoolName = (teacher.school_name || '').toLowerCase();
    const position = (teacher.position_title || '').toLowerCase();
    const location = `${teacher.school_city || ''} ${teacher.school_state || ''}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    return fullName.includes(searchLower) ||
           schoolName.includes(searchLower) ||
           position.includes(searchLower) ||
           location.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 mr-4"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by name, school, position, or location..."
          className="pl-10 py-6 bg-white border-gray-200 rounded-xl focus:ring-[#3AB5E9] focus:border-[#3AB5E9]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredTeachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const teacherName = teacher.user ? 
              `${teacher.user.first_name || ''} ${teacher.user.last_name || ''}`.trim() : 
              'Teacher';
            
            return (
              <Link 
                key={teacher.id} 
                href={`/teachers/${teacher.id}`}
                className="group"
              >
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#3AB5E9]/20 mr-4 transform transition-transform duration-300 group-hover:scale-105">
                      <ProfileAvatar 
                        userId={teacher.user_id || ''}
                        firstName={teacher.user?.first_name || ''}
                        lastName={teacher.user?.last_name || ''}
                        imageUrl={teacher.user?.profile_image_url}
                        size="md"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0E5D7F] group-hover:text-[#3AB5E9] transition-colors">
                        {teacherName}
                      </h3>
                      {teacher.position_title && (
                        <p className="text-sm text-gray-600">{teacher.position_title}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    {teacher.school_name && (
                      <div className="flex items-center text-sm text-gray-700">
                        <Building className="h-4 w-4 mr-2 text-[#3AB5E9]" />
                        <span>{teacher.school_name}</span>
                      </div>
                    )}
                    
                    {(teacher.school_city || teacher.school_state) && (
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="h-4 w-4 mr-2 text-[#3AB5E9]" />
                        <span>
                          {teacher.school_city}
                          {teacher.school_city && teacher.school_state ? ', ' : ''}
                          {teacher.school_state}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-[#3AB5E9] text-sm font-medium inline-flex items-center group-hover:underline">
                      View Profile
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl text-center border border-gray-100 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No teachers found</h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No teachers match your search for "${searchQuery}"`
              : 'No teacher profiles are available at this time'}
          </p>
        </div>
      )}
    </div>
  );
} 