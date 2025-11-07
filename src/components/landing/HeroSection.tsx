
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

export const HeroSection = () => {
  const { user } = useAuth();
  
  return (
    <section className="pt-24 min-h-[90vh] flex flex-col items-center justify-center p-6 text-center relative">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lovable-uploads/dd493e84-bac5-4924-9603-75ef76056640.png"
          alt="City skyline"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-600/80 to-green-900/90 mix-blend-multiply"></div>
      </div>
      
      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
          DamianixPro: Transforming Nigerian Property Management
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          A revolutionary platform connecting landlords, tenants, and property managers 
          with cutting-edge tools designed specifically for the Nigerian market.
        </p>
        
        <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 bg-white text-green-700 hover:bg-gray-100 hover:text-green-800 w-full md:w-auto">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 bg-white text-green-700 hover:bg-gray-100 hover:text-green-800 w-full md:w-auto">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <Link to="/public/properties">
            <Button size="lg" variant="outline" className="text-lg px-8 border-white bg-green-700/40 text-white hover:bg-white hover:text-green-800 font-medium w-full md:w-auto">
              Browse Properties
            </Button>
          </Link>
          <Link to="/shortlets">
            <Button size="lg" variant="outline" className="text-lg px-8 border-white bg-green-700/40 text-white hover:bg-white hover:text-green-800 font-medium w-full md:w-auto">
              Find Short-Lets
            </Button>
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-white max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">For Landlords</h3>
            <p className="text-sm">Simplify rent collection, screen tenants effortlessly, and manage your properties from anywhere.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">For Tenants</h3>
            <p className="text-sm">Find verified properties, request maintenance with ease, and make secure digital payments.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">For Managers</h3>
            <p className="text-sm">Centralize operations, track maintenance requests, and generate detailed financial reports.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
