import React from 'react';
import { cn } from '@/lib/utils';
import { 
  HelpCircle, 
  Info, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ChevronRight,
  Play,
  Book,
  MessageCircle,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Help Content Types
export interface HelpTip {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'tip' | 'warning' | 'success';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface HelpGuide {
  id: string;
  title: string;
  description: string;
  steps: HelpStep[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

export interface HelpStep {
  id: string;
  title: string;
  content: string;
  image?: string;
  video?: string;
  tips?: string[];
}

// Basic Tooltip Component
interface HelpTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const HelpTooltip = ({ 
  content, 
  children, 
  position = 'top',
  className 
}: HelpTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={position} className={className}>
        <p className="max-w-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Help Icon with Tooltip
interface HelpIconProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HelpIcon = ({ 
  content, 
  position = 'top', 
  size = 'sm',
  className 
}: HelpIconProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <HelpTooltip content={content} position={position}>
      <HelpCircle className={cn(
        'text-muted-foreground hover:text-foreground cursor-help transition-colors',
        sizeClasses[size],
        className
      )} />
    </HelpTooltip>
  );
};

// Contextual Help Popover
interface ContextualHelpProps {
  tip: HelpTip;
  children?: React.ReactNode;
}

export const ContextualHelp = ({ tip, children }: ContextualHelpProps) => {
  const getIcon = () => {
    switch (tip.type) {
      case 'tip': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (tip.type) {
      case 'tip': return 'bg-yellow-50 border-yellow-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className={cn('w-80', getBgColor())} side={tip.position || 'top'}>
        <div className="flex items-start space-x-2">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
            <p className="text-sm text-muted-foreground">{tip.content}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Interactive Tour Step
interface TourStepProps {
  step: HelpStep;
  stepNumber: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
}

export const TourStep = ({ 
  step, 
  stepNumber, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onClose 
}: TourStepProps) => (
  <Card className="w-80 shadow-lg border-primary">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{stepNumber} of {totalSteps}</Badge>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardTitle className="text-base">{step.title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">{step.content}</p>
      
      {step.image && (
        <img 
          src={step.image} 
          alt={step.title}
          className="w-full h-32 object-cover rounded-md"
        />
      )}
      
      {step.tips && step.tips.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">Tips:</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {step.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrevious}
          disabled={stepNumber === 1}
        >
          Previous
        </Button>
        <Button 
          size="sm" 
          onClick={onNext}
          disabled={stepNumber === totalSteps}
        >
          {stepNumber === totalSteps ? 'Finish' : 'Next'}
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Help Guide Component
interface HelpGuideProps {
  guide: HelpGuide;
  onStartTour?: () => void;
}

export const HelpGuide = ({ guide, onStartTour }: HelpGuideProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{guide.title}</CardTitle>
            <CardDescription className="mt-1">{guide.description}</CardDescription>
          </div>
          <Badge className={getDifficultyColor(guide.difficulty)}>
            {guide.difficulty}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>{guide.steps.length} steps</span>
          <span>{guide.estimatedTime}</span>
          <Badge variant="outline">{guide.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-medium text-sm">What you'll learn:</h4>
          <ul className="space-y-1">
            {guide.steps.slice(0, 3).map((step, index) => (
              <li key={step.id} className="flex items-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                {step.title}
              </li>
            ))}
            {guide.steps.length > 3 && (
              <li className="text-sm text-muted-foreground ml-5">
                +{guide.steps.length - 3} more steps
              </li>
            )}
          </ul>
          <Button onClick={onStartTour} className="w-full mt-4">
            <Play className="mr-2 h-4 w-4" />
            Start Guide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Help Center Component
interface HelpCenterProps {
  guides: HelpGuide[];
  onStartGuide?: (guide: HelpGuide) => void;
}

export const HelpCenter = ({ guides, onStartGuide }: HelpCenterProps) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  
  const categories = ['all', ...Array.from(new Set(guides.map(g => g.category)))];
  const filteredGuides = selectedCategory === 'all' 
    ? guides 
    : guides.filter(g => g.category === selectedCategory);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Book className="mr-2 h-4 w-4" />
          Help Center
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help Center</DialogTitle>
          <DialogDescription>
            Find guides and tutorials to help you make the most of Nigeria Homes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Guides' : category}
              </Button>
            ))}
          </div>
          
          {/* Guides Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGuides.map(guide => (
              <HelpGuide 
                key={guide.id} 
                guide={guide} 
                onStartTour={() => onStartGuide?.(guide)}
              />
            ))}
          </div>
          
          {filteredGuides.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No guides found for the selected category.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Quick Help Widget
export const QuickHelp = () => {
  const commonHelp = [
    {
      question: "How do I make a payment?",
      answer: "Go to your dashboard, click on 'Payments', then 'Make Payment'. Choose your preferred payment method and follow the instructions."
    },
    {
      question: "How do I submit a maintenance request?",
      answer: "Navigate to the 'Maintenance' tab in your dashboard, click 'New Request', fill in the details, and submit."
    },
    {
      question: "How do I update my profile?",
      answer: "Click on your profile picture in the top right corner, select 'Profile Settings', and update your information."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team via the chat widget, email at support@nigeriahomes.com, or phone at +234-XXX-XXXX."
    }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="fixed bottom-4 right-4 shadow-lg z-50"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Quick Help
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="top">
        <div className="space-y-4">
          <h4 className="font-medium">Frequently Asked Questions</h4>
          <div className="space-y-3">
            {commonHelp.map((item, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm font-medium">{item.question}</p>
                <p className="text-xs text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Need more help?</p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <MessageCircle className="mr-1 h-3 w-3" />
                Chat
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Mail className="mr-1 h-3 w-3" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Form Field with Help
interface FormFieldWithHelpProps {
  label: string;
  helpText: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}

export const FormFieldWithHelp = ({ 
  label, 
  helpText, 
  required, 
  children, 
  error 
}: FormFieldWithHelpProps) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <HelpIcon content={helpText} />
    </div>
    {children}
    {error && (
      <p className="text-sm text-red-600">{error}</p>
    )}
  </div>
);

// Onboarding Checklist
interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingChecklistProps {
  items: OnboardingItem[];
  onItemClick?: (item: OnboardingItem) => void;
}

export const OnboardingChecklist = ({ items, onItemClick }: OnboardingChecklistProps) => {
  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Getting Started
          <Badge variant="secondary">{completedCount}/{items.length}</Badge>
        </CardTitle>
        <CardDescription>
          Complete these steps to get the most out of Nigeria Homes
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map(item => (
            <div 
              key={item.id}
              className={cn(
                "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                item.completed 
                  ? "bg-green-50 border-green-200" 
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer"
              )}
              onClick={() => !item.completed && onItemClick?.(item)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={cn(
                  "font-medium text-sm",
                  item.completed ? "text-green-900" : "text-gray-900"
                )}>
                  {item.title}
                </h4>
                <p className={cn(
                  "text-sm mt-1",
                  item.completed ? "text-green-700" : "text-gray-600"
                )}>
                  {item.description}
                </p>
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Help Context Hook
export const useHelpContext = () => {
  const [activeGuide, setActiveGuide] = React.useState<HelpGuide | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [showHelp, setShowHelp] = React.useState(false);

  const startGuide = React.useCallback((guide: HelpGuide) => {
    setActiveGuide(guide);
    setCurrentStep(0);
    setShowHelp(true);
  }, []);

  const nextStep = React.useCallback(() => {
    if (activeGuide && currentStep < activeGuide.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [activeGuide, currentStep]);

  const previousStep = React.useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const closeGuide = React.useCallback(() => {
    setActiveGuide(null);
    setCurrentStep(0);
    setShowHelp(false);
  }, []);

  return {
    activeGuide,
    currentStep,
    showHelp,
    startGuide,
    nextStep,
    previousStep,
    closeGuide
  };
};
