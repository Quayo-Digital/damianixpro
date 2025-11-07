
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    Icon: LucideIcon;
}

export const StatCard = ({ title, value, Icon }: StatCardProps) => {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center">
                    <Icon className="h-5 w-5 text-muted-foreground mr-2" />
                    <span className="text-2xl font-bold">
                        {value}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
