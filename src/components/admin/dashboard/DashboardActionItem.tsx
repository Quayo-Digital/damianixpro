import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface DashboardActionItemProps {
  title: string;
  description: string;
  buttonText: string;
  linkTo: string;
}

export function DashboardActionItem({
  title,
  description,
  buttonText,
  linkTo,
}: DashboardActionItemProps) {
  return (
    <div className="flex items-center justify-between rounded bg-muted/40 p-2">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" asChild>
        <Link to={linkTo}>
          {buttonText}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
