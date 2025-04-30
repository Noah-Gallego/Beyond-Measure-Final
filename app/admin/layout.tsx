'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  PanelLeft, 
  LogOut,
  BookOpen,
  GraduationCap,
  DollarSign,
  Heart,
  Star,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Handle hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Projects',
      href: '/admin/projects',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Teachers',
      href: '/admin/teachers',
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      title: 'Donors',
      href: '/admin/donors',
      icon: <Heart className="h-5 w-5" />,
    },
    {
      title: 'Donations',
      href: '/admin/donations',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: 'Resources',
      href: '/admin/resources',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: 'Featured',
      href: '/admin/featured',
      icon: <Star className="h-5 w-5" />,
    },
    {
      title: 'Reports',
      href: '/admin/reports',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  if (!isMounted) {
    return null;
  }

  function NavLink({ href, label, icon, isActive, onClick }: { href: string; label: string; icon: React.ReactNode; isActive: boolean; onClick?: () => void }) {
    return (
      <Link 
        href={href} 
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
          isActive 
            ? 'bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400 dark:from-indigo-500/20 dark:to-blue-500/20 font-medium' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
        } transition-colors`}
      >
        <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}>
          {icon}
        </span>
        {label}
      </Link>
    );
  }

  const Sidebar = ({ className, closeMobile }: { className?: string; closeMobile?: () => void }) => (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="px-3 py-4">
        <div className="mb-4 px-1">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 grid place-items-center text-white font-bold text-base">
              BM
            </div>
            <span>Beyond Measure</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 ml-11">Admin Portal</div>
        </div>
        <div className="mb-2 px-1">
          <Button 
            variant="outline" 
            className="w-full justify-start text-left font-normal border-dashed"
          >
            <PanelLeft className="mr-2 h-4 w-4" />
            Return to Site
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="px-2 py-1">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Menu</h3>
            </div>
            <nav className="grid gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.title}
                  icon={item.icon}
                  isActive={pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href))}
                  onClick={closeMobile}
                />
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>

      {user && (
        <div className="mt-auto p-3">
          <Separator className="my-4 opacity-50" />
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500/20 to-blue-500/20 grid place-items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              {user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrator
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 z-10 w-72 border-r bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <Sidebar />
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-900">
          <Sidebar closeMobile={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile header bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-10 flex h-14 items-center gap-4 border-b bg-white dark:bg-slate-900 px-4 sm:px-6 border-slate-200 dark:border-slate-800">
        <div className="flex-1 flex justify-between">
          <div className="flex items-center text-lg font-semibold text-slate-900 dark:text-white">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-blue-500 grid place-items-center text-white font-bold text-sm mr-2">
              BM
            </div>
            Admin Portal
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 lg:pl-72">
        <div className="h-full px-4 py-6 lg:px-8 pt-14 lg:pt-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 