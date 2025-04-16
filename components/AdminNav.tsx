'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function AdminNav() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
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
        return;
      }
      
      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center">
            <span className="font-bold text-sm mr-4 text-white">Admin Controls:</span>
            <nav className="flex space-x-4">
              <Link href="/admin/projects" className="px-3 py-1 text-sm rounded-md text-white font-bold hover:bg-white/25 hover:text-white transition-colors">
                Pending Projects
              </Link>
              <Link href="/admin/teachers" className="px-3 py-1 text-sm rounded-md text-white font-bold hover:bg-white/25 hover:text-white transition-colors">
                Teacher Verification
              </Link>
              <Link href="/admin/categories" className="px-3 py-1 text-sm rounded-md text-white font-bold hover:bg-white/25 hover:text-white transition-colors">
                Manage Categories
              </Link>
              <Link href="/admin/dashboard" className="px-3 py-1 text-sm rounded-md text-white font-bold hover:bg-white/25 hover:text-white transition-colors">
                Admin Dashboard
              </Link>
            </nav>
          </div>
          <div>
            <Link
              href="/admin/dashboard"
              className="btn btn-sm bg-white/30 hover:bg-white/50 backdrop-blur-sm transition-colors text-indigo-100 hover:text-white font-bold shadow-sm"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 