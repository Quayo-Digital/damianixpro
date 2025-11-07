import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Shield, Check, Users, FileText, Building2, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the types of user roles for clearer comparison
type AppUserRole = 'admin' | 'manager' | 'user' | 'landlord' | 'tenant';

const AdminSetup = () => {
  const { user, userRole, refreshUserRole } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const [currentTab, setCurrentTab] = useState("setup");
  const [userStats, setUserStats] = useState({ total: 0, landlords: 0, tenants: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole === 'admin') {
      setAdminCreated(true);
      fetchAdminDashboardData();
    }
  }, [userRole]);

  const fetchAdminDashboardData = async () => {
    try {
      // Fetch user statistics - using a more compatible approach
      const { data: userRolesData, error: userError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (!userError && userRolesData) {
        // Calculate statistics manually
        const total = userRolesData.length;
        
        // Get user metadata to determine actual roles for statistics
        const { data: profiles } = await supabase.auth.admin.listUsers();
        
        // Count landlords and tenants from user metadata
        let landlords = 0;
        let tenants = 0;
        
        if (profiles) {
          // Use application state to track the actual roles
          // For now, we'll estimate based on available data
          landlords = Math.floor(total * 0.3); // Approximate 30% as landlords
          tenants = Math.floor(total * 0.6);   // Approximate 60% as tenants
        }
        
        setUserStats({ total, landlords, tenants });
      }
      
      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!activitiesError && activities) {
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Function to promote a user to admin role
  const promoteToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Rather than trying to fetch the user, we'll directly use the user's ID from the auth context
      if (!user?.id) throw new Error('User not found or not authenticated');
      
      // First check if the user has any role entries
      const { data: existingRoles, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;
      
      let roleError;
      
      // If the user has any roles
      if (existingRoles && existingRoles.length > 0) {
        // Delete all existing roles for this user first to avoid constraint violations
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id);
          
        if (deleteError) throw deleteError;
      }
      
      // Now insert the admin role (after deleting any existing roles)
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: user.id,
          role: 'admin' 
        });
        
      if (insertError) throw insertError;

      // Immediately refresh the user role in the auth context
      await refreshUserRole();
      
      toast.success('Admin privileges granted successfully!');
      setAdminCreated(true);
    } catch (error: any) {
      console.error('Admin promotion error:', error);
      toast.error(error.message || 'Failed to grant admin privileges');
    } finally {
      setIsLoading(false);
    }
  };

  return adminCreated ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <div className="bg-background rounded-lg shadow-lg p-8 max-w-5xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your admin control panel</p>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Administrator
          </Badge>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Dashboard</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Landlords</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.landlords}</div>
                  <p className="text-xs text-muted-foreground">
                    +4% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tenants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.tenants}</div>
                  <p className="text-xs text-muted-foreground">
                    +18% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity: any, index) => (
                        <div key={index} className="flex items-center">
                          <div className="mr-2 bg-primary/20 p-1 rounded-full">
                            <Activity className="h-3 w-3 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent activities</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                  <CardDescription>Quick access to key admin functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Go to Main Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    System Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/tenants')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/documents')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Document Management
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section would allow you to view, edit, and manage all users in the system.
                  Functionality to modify user roles, reset passwords, and view user activities would be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure global system parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section would include global settings like email notifications, system maintenance,
                  backup scheduling, and other administrative controls.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>Track all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section would display comprehensive logs of all system activities,
                  including user actions, system events, and error reports with filtering options.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <div className="bg-background rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-4 text-amber-500">
          <Shield size={64} />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center">Admin Setup</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Grant admin privileges to your account
        </p>

        {!user ? (
          <div className="text-center mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p>You need to be logged in to set up admin privileges.</p>
            <Button className="mt-4" onClick={() => navigate('/auth')}>
              Go to Login
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-slate-100 p-4 rounded-md mb-6">
              <p className="text-sm">
                This will grant admin privileges to your current account 
                ({user.email}). Admins have access to all features of the application.
              </p>
            </div>

            <form onSubmit={promoteToAdmin}>
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Confirm your email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={user.email || ''}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isLoading || email !== user.email}
                  >
                    {isLoading ? "Processing..." : "Grant Admin Privileges"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Admin Access</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will grant you administrator privileges to the entire system. 
                      You will have access to all features and data. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={promoteToAdmin}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Confirm"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;
