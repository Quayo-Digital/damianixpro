
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
  linkTo 
}: DashboardActionItemProps) {
  return (
    <div className="flex justify-between items-center p-2 bg-muted/40 rounded">
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
