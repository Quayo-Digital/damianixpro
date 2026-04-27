import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeviceDetection, TouchUtils, NigerianMobileUtils } from '@/utils/mobile';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Search,
  Phone,
  Mail,
  MapPin,
  Heart,
  Share,
  Filter,
  Grid,
  List,
  Plus,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile-optimized Button with 44px minimum touch target
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const MobileButton: React.FC<MobileButtonProps> = ({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className,
  ...props
}) => {
  const { isMobile } = useDeviceDetection();

  const sizeClasses = {
    sm: 'h-10 px-3 text-sm', // 40px height, still touch-friendly
    md: 'h-11 px-4 text-base', // 44px height - perfect touch target
    lg: 'h-12 px-6 text-lg', // 48px height - extra comfortable
    xl: 'h-14 px-8 text-xl', // 56px height - very comfortable
  };

  return (
    <Button
      variant={variant}
      className={cn(
        sizeClasses[size],
        fullWidth && 'w-full',
        isMobile && 'min-h-[44px]', // Ensure minimum touch target
        'touch-manipulation', // Optimize for touch
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
};

// Mobile-optimized Input with better touch experience
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  currency?: boolean;
}

const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  helpText,
  icon,
  currency = false,
  className,
  ...props
}) => {
  const { isMobile } = useDeviceDetection();

  return (
    <div className="space-y-2">
      {label && (
        <Label
          className={cn(
            'text-base font-medium',
            isMobile && 'text-lg' // Larger labels on mobile
          )}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
            {icon}
          </div>
        )}
        {currency && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 transform font-medium text-muted-foreground">
            ₦
          </div>
        )}
        <Input
          className={cn(
            'h-12 text-base', // 48px height for comfortable touch
            (icon || currency) && 'pl-10',
            isMobile && 'text-16px', // Prevent zoom on iOS
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className="text-sm text-muted-foreground">{helpText}</p>}
    </div>
  );
};

// Mobile-optimized Textarea
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const MobileTextarea: React.FC<MobileTextareaProps> = ({
  label,
  error,
  helpText,
  className,
  ...props
}) => {
  const { isMobile } = useDeviceDetection();

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn('text-base font-medium', isMobile && 'text-lg')}>{label}</Label>
      )}
      <Textarea
        className={cn(
          'min-h-[100px] resize-none text-base',
          isMobile && 'text-16px min-h-[120px]', // Prevent zoom, larger on mobile
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className="text-sm text-muted-foreground">{helpText}</p>}
    </div>
  );
};

// Mobile-optimized Select with larger touch targets
interface MobileSelectProps {
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
}

const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  error,
}) => {
  const { isMobile } = useDeviceDetection();

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn('text-base font-medium', isMobile && 'text-lg')}>{label}</Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn('h-12 text-base', isMobile && 'text-16px')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                'h-12 text-base',
                isMobile && 'h-14 text-lg' // Larger touch targets on mobile
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Mobile-optimized Card for property listings
interface MobilePropertyCardProps {
  property: {
    id: string;
    title: string;
    price: number;
    location: string;
    bedrooms: number;
    bathrooms: number;
    image: string;
    type: string;
  };
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onClick?: (id: string) => void;
  isFavorited?: boolean;
}

const MobilePropertyCard: React.FC<MobilePropertyCardProps> = ({
  property,
  onFavorite,
  onShare,
  onClick,
  isFavorited = false,
}) => {
  const { isMobile } = useDeviceDetection();

  return (
    <Card
      className={cn(
        'cursor-pointer overflow-hidden transition-all duration-200',
        'hover:shadow-lg active:scale-[0.98]', // Touch feedback
        isMobile && 'shadow-sm'
      )}
      onClick={() => onClick?.(property.id)}
    >
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className={cn('w-full object-cover', isMobile ? 'h-48' : 'h-40')}
        />
        <div className="absolute left-2 top-2">
          <Badge variant="secondary" className="border border-border bg-card/95 text-foreground">
            {property.type}
          </Badge>
        </div>
        <div className="absolute right-2 top-2 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(property.id);
            }}
            className={cn(
              'rounded-full border border-border bg-card/95 p-2 text-foreground transition-colors',
              'flex min-h-[44px] min-w-[44px] items-center justify-center', // Touch target
              isFavorited ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            <Heart className={cn('h-5 w-5', isFavorited && 'fill-current')} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(property.id);
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-card/95 p-2 text-muted-foreground transition-colors"
          >
            <Share className="h-5 w-5" />
          </button>
        </div>
      </div>

      <CardContent className={cn('p-4', isMobile && 'p-3')}>
        <div className="space-y-2">
          <h3 className={cn('line-clamp-2 font-semibold', isMobile ? 'text-lg' : 'text-base')}>
            {property.title}
          </h3>

          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            <span className={cn('text-sm', isMobile && 'text-base')}>{property.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">
              {NigerianMobileUtils.formatCurrencyForMobile(property.price)}
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <span>{property.bedrooms} bed</span>
              <span>{property.bathrooms} bath</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile-optimized Bottom Sheet for actions
interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const { isMobile } = useDeviceDetection();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 rounded-t-lg border-t border-border bg-card text-card-foreground',
          'max-h-[80vh] overflow-hidden',
          'duration-300 animate-in slide-in-from-bottom'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[calc(80vh-80px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Mobile-optimized Navigation Bar
interface MobileNavBarAction {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
}

interface MobileNavBarProps {
  title: string;
  onBack?: () => void;
  actions?: MobileNavBarAction[] | React.ReactNode;
  showBack?: boolean;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({
  title,
  onBack,
  onBackClick,
  actions,
  showBack = false,
  showBackButton = false,
}) => {
  const { isMobile } = useDeviceDetection();
  const shouldShowBack = showBack || showBackButton;
  const backHandler = onBackClick || onBack;

  const renderActions = () => {
    if (!actions) return null;

    // If actions is an array of action objects, render them as buttons
    if (Array.isArray(actions)) {
      return actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 hover:bg-gray-100"
          title={action.label}
        >
          {action.icon}
        </button>
      ));
    }

    // Otherwise, render as React node
    return actions;
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border bg-card p-4 text-card-foreground',
        'sticky top-0 z-40',
        isMobile && 'h-16' // Standard mobile nav height
      )}
    >
      <div className="flex items-center">
        {shouldShowBack && (
          <button
            onClick={backHandler}
            className="mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 hover:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <h1 className={cn('truncate font-semibold', isMobile ? 'text-lg' : 'text-xl')}>{title}</h1>
      </div>

      <div className="flex items-center space-x-2">{renderActions()}</div>
    </div>
  );
};

// Mobile-optimized Search Bar
interface MobileSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  placeholder = 'Search properties...',
  value,
  onChange,
  onSubmit,
  showFilter = false,
  onFilterClick,
}) => {
  const { isMobile } = useDeviceDetection();
  const [searchValue, setSearchValue] = useState(value || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(searchValue);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            onChange?.(e.target.value);
          }}
          className={cn(
            'h-12 pl-10 text-base',
            isMobile && 'text-16px' // Prevent zoom on iOS
          )}
        />
      </div>

      {showFilter && (
        <button
          type="button"
          onClick={onFilterClick}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card p-3 text-card-foreground"
        >
          <Filter className="h-5 w-5" />
        </button>
      )}
    </form>
  );
};

// Mobile-optimized Floating Action Button
interface MobileFABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const MobileFAB: React.FC<MobileFABProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 rounded-full bg-primary text-primary-foreground shadow-lg',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        'flex min-h-[56px] min-w-[56px] items-center justify-center',
        label ? 'px-4 py-3' : 'h-14 w-14',
        positionClasses[position]
      )}
    >
      {icon}
      {label && <span className="ml-2 font-medium">{label}</span>}
    </button>
  );
};

// Mobile-optimized Quantity Selector
interface MobileQuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

const MobileQuantitySelector: React.FC<MobileQuantitySelectorProps> = ({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}) => {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center space-x-4">
      {label && <Label className="text-base font-medium">{label}</Label>}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDecrease}
          disabled={value <= min}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-card p-2 text-card-foreground disabled:opacity-50"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="w-12 text-center">
          <span className="text-lg font-medium">{value}</span>
        </div>

        <button
          onClick={handleIncrease}
          disabled={value >= max}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-card p-2 text-card-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Export all mobile components
export {
  MobileButton,
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobilePropertyCard,
  MobileBottomSheet,
  MobileNavBar,
  MobileSearchBar,
  MobileFAB as MobileFloatingActionButton,
  MobileQuantitySelector,
  useDeviceDetection,
  TouchUtils,
  NigerianMobileUtils,
};
