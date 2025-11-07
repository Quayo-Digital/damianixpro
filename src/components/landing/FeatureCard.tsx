
import { LucideIcon } from "lucide-react";
import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, features }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-green-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        {icon}
        <h4 className="text-xl font-semibold">{title}</h4>
      </div>
      <p className="mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
