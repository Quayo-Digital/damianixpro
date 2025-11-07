
import React from 'react';
import { Home, Users, Briefcase, CreditCard, ShieldCheck, Video, Wrench, Database, MessageSquare } from "lucide-react";
import { FeatureCard } from './FeatureCard';

interface UserGroupProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const UserGroup: React.FC<UserGroupProps> = ({ icon, title, children }) => (
  <div className="mb-20">
    <div className="flex items-center gap-4 mb-8">
      <div className="bg-green-100 p-3 rounded-full">
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
    </div>
    <div className="grid md:grid-cols-2 gap-8">
      {children}
    </div>
  </div>
);

export const UserGroupsSection = () => {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Solutions for <span className="text-green-600">Every Stakeholder</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform addresses specific pain points for each user group in the Nigerian real estate ecosystem.
          </p>
        </div>
        
        {/* Landlords Section */}
        <UserGroup icon={<Home className="h-8 w-8 text-green-600" />} title="For Landlords">
          <FeatureCard
            icon={<CreditCard className="h-10 w-10 text-green-500" />}
            title="Automated Rent Collection"
            description="Integrate with Paystack for seamless, automated rent collection directly to your bank account."
            features={[
              "Real-time payment notifications",
              "Automatic payment reminders to tenants",
              "Detailed financial reporting",
            ]}
          />
          <FeatureCard
            icon={<ShieldCheck className="h-10 w-10 text-green-500" />}
            title="Tenant Screening Tools"
            description="Vet potential tenants through our comprehensive background verification system."
            features={[
              "Identity verification",
              "Employment and income verification",
              "Previous landlord references",
            ]}
          />
        </UserGroup>
        
        {/* Tenants Section */}
        <UserGroup icon={<Users className="h-8 w-8 text-green-600" />} title="For Tenants">
          <FeatureCard
            icon={<Video className="h-10 w-10 text-green-500" />}
            title="Verified Property Listings"
            description="Browse properties with confidence through our verified listings and 3D virtual tours."
            features={[
              "Immersive 3D virtual property tours",
              "Verified property details",
              "Transparent pricing information",
            ]}
          />
          <FeatureCard
            icon={<Wrench className="h-10 w-10 text-green-500" />}
            title="Maintenance Ticketing System"
            description="Report and track maintenance issues easily through our streamlined ticketing system."
            features={[
              "Photo and description submissions",
              "Real-time status updates",
              "Direct communication with managers",
            ]}
          />
        </UserGroup>
        
        {/* Property Managers Section */}
        <UserGroup icon={<Briefcase className="h-8 w-8 text-green-600" />} title="For Property Managers">
          <FeatureCard
            icon={<Database className="h-10 w-10 text-green-500" />}
            title="Centralized Management Dashboard"
            description="Manage all properties, tenants, and transactions from a single intuitive dashboard."
            features={[
              "Property portfolio overview",
              "Tenant management",
              "Financial tracking and reporting",
            ]}
          />
          <FeatureCard
            icon={<MessageSquare className="h-10 w-10 text-green-500" />}
            title="Maintenance Tracking & Communication"
            description="Efficiently handle maintenance requests and communicate with tenants and service providers."
            features={[
              "Task assignment and scheduling",
              "Service provider management",
              "Automated status updates to tenants",
            ]}
          />
        </UserGroup>
      </div>
    </section>
  );
};
