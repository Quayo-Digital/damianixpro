import React from 'react';
import {
  Home,
  Users,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Video,
  Wrench,
  Database,
  MessageSquare,
  Calendar,
  Wallet,
} from 'lucide-react';
import { FeatureCard } from './FeatureCard';

interface UserGroupProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const UserGroup: React.FC<UserGroupProps> = ({ icon, title, children }) => {
  const childrenArray = React.Children.toArray(children);
  const hasThreeCards = childrenArray.length === 3;

  return (
    <div className="mb-20">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-full bg-green-100 p-3 dark:bg-primary/20">{icon}</div>
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      </div>
      <div className={`grid gap-8 ${hasThreeCards ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {children}
      </div>
    </div>
  );
};

export const UserGroupsSection = () => {
  return (
    <section id="features" className="border-y border-border bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Solutions for{' '}
            <span className="text-green-600 dark:text-green-400">Every Stakeholder</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Our platform addresses specific pain points for each user group in the Nigerian real
            estate ecosystem.
          </p>
        </div>

        {/* Landlords Section */}
        <UserGroup icon={<Home className="h-8 w-8 text-green-600" />} title="For Landlords">
          <FeatureCard
            icon={<Calendar className="h-10 w-10 text-green-500" />}
            title="Short-Let Management System"
            description="Maximize your property income with our comprehensive short-let platform. Manage bookings, availability, and payments all in one place."
            features={[
              'Calendar-based availability management',
              'Instant booking and manual approval options',
              'Automated payout system with Flutterwave integration',
            ]}
          />
          <FeatureCard
            icon={<CreditCard className="h-10 w-10 text-green-500" />}
            title="Automated Rent Collection"
            description="Integrate with Flutterwave for seamless, automated rent collection directly to your bank account."
            features={[
              'Real-time payment notifications',
              'Automatic payment reminders to tenants',
              'Detailed financial reporting',
            ]}
          />
          <FeatureCard
            icon={<ShieldCheck className="h-10 w-10 text-green-500" />}
            title="Tenant Screening Tools"
            description="Vet potential tenants through our comprehensive background verification system."
            features={[
              'Identity verification',
              'Employment and income verification',
              'Previous landlord references',
            ]}
          />
        </UserGroup>

        {/* Tenants Section */}
        <UserGroup icon={<Users className="h-8 w-8 text-green-600" />} title="For Tenants">
          <FeatureCard
            icon={<Home className="h-10 w-10 text-green-500" />}
            title="Discover Short-Let Properties"
            description="Find and book short-let accommodations across Nigeria. Search by location, dates, and amenities with instant booking options."
            features={[
              'Advanced search and filtering',
              'Real-time availability calendar',
              'Secure payment processing with Flutterwave',
            ]}
          />
          <FeatureCard
            icon={<Video className="h-10 w-10 text-green-500" />}
            title="Verified Property Listings"
            description="Browse properties with confidence through our verified listings and 3D virtual tours."
            features={[
              'Immersive 3D virtual property tours',
              'Verified property details',
              'Transparent pricing information',
            ]}
          />
          <FeatureCard
            icon={<Wrench className="h-10 w-10 text-green-500" />}
            title="Maintenance Ticketing System"
            description="Report and track maintenance issues easily through our streamlined ticketing system."
            features={[
              'Photo and description submissions',
              'Real-time status updates',
              'Direct communication with managers',
            ]}
          />
        </UserGroup>

        {/* Property Managers Section */}
        <UserGroup
          icon={<Briefcase className="h-8 w-8 text-green-600" />}
          title="For Property Managers"
        >
          <FeatureCard
            icon={<Database className="h-10 w-10 text-green-500" />}
            title="Centralized Management Dashboard"
            description="Manage all properties, tenants, and transactions from a single intuitive dashboard."
            features={[
              'Property portfolio overview',
              'Tenant management',
              'Financial tracking and reporting',
            ]}
          />
          <FeatureCard
            icon={<MessageSquare className="h-10 w-10 text-green-500" />}
            title="Maintenance Tracking & Communication"
            description="Efficiently handle maintenance requests and communicate with tenants and service providers."
            features={[
              'Task assignment and scheduling',
              'Service provider management',
              'Automated status updates to tenants',
            ]}
          />
        </UserGroup>
      </div>
    </section>
  );
};
