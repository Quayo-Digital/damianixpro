import { LucideIcon } from 'lucide-react';
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, features }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-card-foreground shadow-md transition-shadow hover:shadow-lg">
      <div className="mb-4 flex items-center gap-4">
        {icon}
        <h4 className="text-xl font-semibold tracking-tight text-foreground">{title}</h4>
      </div>
      <p className="mb-4 text-pretty leading-relaxed text-muted-foreground">{description}</p>
      <ul className="space-y-2.5 rounded-lg border border-border bg-muted/50 px-3 py-3 dark:bg-muted/30">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm leading-snug">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-600 dark:bg-green-400"
              aria-hidden
            />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
