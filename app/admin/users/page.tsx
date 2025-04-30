'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  UserPlus, 
  Search,
  Loader2,
  Mail,
  User,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/AuthProvider';

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'user'
  });
  const [processing, setProcessing] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    if (authLoading) return;
    
    async function checkAdminAndLoadUsers() {
      if (!user) {
        router.push('/auth');
        return;
      }
      
      try {
        // Check for admin role in profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profileData || profileData.role !== 'admin') {
          // Fallback to users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', user.id)
            .single();
            
          if (userError || !userData || userData.role !== 'admin') {
            setIsAdmin(false);
            setLoading(false);
            return;
          }
        }
        
        setIsAdmin(true);
        loadUsers();
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminAndLoadUsers();
  }, [user, authLoading, router, supabase]);

  async function loadUsers() {
    try {
      setLoading(true);
      
      // First try to get users from users table (with auth data)
      const { data: authUsers, error: authError } = await supabase
        .from('users')
        .select('*, profiles(*)');
      
      if (!authError && authUsers) {
        // Format user data
        const formattedUsers = authUsers.map((user) => ({
          id: user.id,
          auth_id: user.auth_id,
          email: user.email,
          name: user.name || user.profiles?.name || 'Unknown',
          role: user.role || user.profiles?.role || 'user',
          created_at: user.created_at || user.profiles?.created_at,
          last_sign_in: user.last_sign_in || 'Never',
          status: user.verified || user.profiles?.verified ? 'Verified' : 'Unverified'
        }));
        
        setUsers(formattedUsers);
      } else {
        // Fallback to profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (profilesError) {
          throw new Error('Error loading users');
        }
        
        if (profilesData) {
          setUsers(profilesData);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "There was a problem loading the user list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function addUser() {
    try {
      setProcessing(true);
      
      // Create user in auth
      const { data, error } = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        }),
      }).then(res => res.json());
      
      if (error) {
        throw new Error(error.message || 'Error creating user');
      }
      
      toast({
        title: "User created",
        description: "User has been successfully created and invited.",
        variant: "default",
      });
      
      setShowAddUserDialog(false);
      setNewUser({ email: '', name: '', role: 'user' });
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error creating user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function updateUser() {
    if (!currentUser) return;
    
    try {
      setProcessing(true);
      
      // Update user in database
      let result;
      
      if (currentUser.auth_id) {
        // Update in users table
        result = await supabase
          .from('users')
          .update({
            name: currentUser.name,
            role: currentUser.role
          })
          .eq('id', currentUser.id);
      } else {
        // Update in profiles table
        result = await supabase
          .from('profiles')
          .update({
            name: currentUser.name,
            role: currentUser.role
          })
          .eq('id', currentUser.id);
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast({
        title: "User updated",
        description: "User information has been successfully updated.",
        variant: "default",
      });
      
      setShowEditUserDialog(false);
      setCurrentUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error updating user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      setProcessing(true);
      
      // Delete user from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "User deleted",
        description: "User has been successfully deleted from the system.",
        variant: "default",
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-indigo-300 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-blue-300 animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto mt-12 border border-slate-100 dark:border-slate-700">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center">
            <AlertTriangle className="w-8 h-8 mr-2" />
            Access Denied
          </h1>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            You do not have permission to access the user management area. This area is restricted to administrators only.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            If you believe you should have admin access, please contact the system administrator.
          </p>
        </div>
        <Button asChild variant="default">
          <a href="/" className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Return to Home
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your platform users, roles, and permissions.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-full md:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account and send an invitation email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger id="role" aria-label="Select user role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Roles</SelectLabel>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="donor">Donor</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>Cancel</Button>
                <Button 
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                  onClick={addUser} 
                  disabled={processing || !newUser.email || !newUser.name}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <CardTitle className="text-xl font-semibold">User Directory</CardTitle>
          <CardDescription>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                      {searchTerm ? (
                        <div className="flex flex-col items-center">
                          <Search className="h-8 w-8 mb-2 text-slate-400" />
                          <p>No users match your search criteria.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <User className="h-8 w-8 mb-2 text-slate-400" />
                          <p>No users found in the system.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="ml-3">
                            <p className="text-slate-900 dark:text-white font-medium">{user.name || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-slate-400" />
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : user.role === 'teacher'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : user.role === 'donor'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          <UserCheck className="h-3 w-3 mr-1" />
                          {user.role || 'user'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.status === 'Verified' ? (
                          <div className="inline-flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Unverified
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <span className="sr-only">Open options</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentUser(user);
                                setShowEditUserDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredUsers.length} of {users.length} users displayed
          </p>
        </CardFooter>
      </Card>

      {/* Edit User Dialog */}
      {currentUser && (
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={currentUser.email}
                  disabled
                />
                <p className="text-xs text-slate-500">Email address cannot be changed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">User Role</Label>
                <Select 
                  value={currentUser.role} 
                  onValueChange={(value) => setCurrentUser({ ...currentUser, role: value })}
                >
                  <SelectTrigger id="edit-role" aria-label="Select user role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="donor">Donor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancel</Button>
              <Button 
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                onClick={updateUser} 
                disabled={processing || !currentUser.name}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Update User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 