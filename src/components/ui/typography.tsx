import * as React from 'react';
import { cn } from '@/lib/utils';

type TextEl = HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement;

interface TypographyProps extends React.HTMLAttributes<TextEl> {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function PageTitle({ as = 'h1', className, ...props }: TypographyProps) {
  const Comp = as;
  return (
    <Comp
      className={cn(
        'text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl',
        className
      )}
      {...props}
    />
  );
}

export function SectionTitle({ as = 'h2', className, ...props }: TypographyProps) {
  const Comp = as;
  return (
    <Comp
      className={cn(
        'text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl',
        className
      )}
      {...props}
    />
  );
}

export function BodyText({ as = 'p', className, ...props }: TypographyProps) {
  const Comp = as;
  return (
    <Comp
      className={cn('text-pretty text-sm leading-6 text-muted-foreground sm:text-base', className)}
      {...props}
    />
  );
}
