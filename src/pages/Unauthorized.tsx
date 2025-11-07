import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { ShieldAlert, Home, ArrowLeft, AlertCircle } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { userRole, refreshUserRole } = useAuth();

  console.log("Unauthorized page - Current user role:", userRole);

  // Try to refresh user role to ensure we have the latest
  const handleRefreshAndRetry = async () => {
    await refreshUserRole();
    navigate(-1); // Go back to previous page after refreshing role
  };

  // Determine the correct dashboard based on user role
  const getDashboardPath = () => {
    switch(userRole) {
      case 'tenant':
        return '/tenant/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'owner':
        return '/owner/dashboard'; // Corrected from '/dashboard'
      case 'agent':
        return '/agent/dashboard'; // agent dashboard
      case 'vendor':
        return '/vendor/dashboard'; // vendor dashboard
      default:
        return '/'; // fallback to home page if role is unknown
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-yellow-50 flex items-center justify-center">
            <ShieldAlert size={36} className="text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        
        <p className="text-gray-600 mb-4 text-lg">
          You don't have sufficient permissions to access this page.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-md text-md text-blue-800 mb-6 flex items-start">
          <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium">Your current role: <span className="font-bold">{userRole || 'unknown'}</span></p>
            <p className="mt-2">Different features are available based on your role. If you believe this is an error, please contact support.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate(getDashboardPath())} 
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 h-auto"
          >
            <Home size={20} className="mr-2" />
            Go to Your Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleRefreshAndRetry} 
            className="w-full border border-gray-300 bg-white text-gray-700 py-3 h-auto"
          >
            <AlertCircle size={20} className="mr-2" />
            Refresh Role & Retry
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="w-full border border-gray-300 bg-white text-gray-700 py-3 h-auto"
          >
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
