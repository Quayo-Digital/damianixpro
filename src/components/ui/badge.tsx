import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/12 text-primary shadow-none ring-1 ring-inset ring-primary/15',
        solid:
          'border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary:
          'border-transparent bg-muted text-muted-foreground ring-1 ring-inset ring-border/60',
        destructive:
          'border-transparent bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/20',
        outline: 'border-border/80 bg-background text-foreground shadow-sm',
        success:
          'border-transparent bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400',
        highlight:
          'border-transparent bg-highlight/12 text-highlight shadow-none ring-1 ring-inset ring-highlight/20 dark:bg-highlight/25 dark:text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
