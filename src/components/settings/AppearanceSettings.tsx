
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

export const AppearanceSettings = () => {
  const { setTheme } = useTheme();
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('vite-ui-theme');
    if (savedTheme && savedTheme !== 'system') return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [compactView, setCompactView] = useState(localStorage.getItem('compact-view') === 'true');
  
  const handleDarkModeChange = (isDark: boolean) => {
    setDarkMode(isDark);
    setTheme(isDark ? 'dark' : 'light');
    toast({
      title: "Appearance updated",
      description: `Theme set to ${isDark ? 'dark' : 'light'} mode.`,
    });
  };

  const handleCompactViewChange = (isCompact: boolean) => {
    setCompactView(isCompact);
    localStorage.setItem('compact-view', isCompact.toString());
    toast({
      title: "Appearance updated",
      description: `Compact view ${isCompact ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application. Changes are saved automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="dark-mode">Dark mode</Label>
            <p className="text-sm text-muted-foreground">
              Use dark theme for the application
            </p>
          </div>
          <Switch 
            id="dark-mode" 
            checked={darkMode}
            onCheckedChange={handleDarkModeChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="compact-view">Compact view</Label>
            <p className="text-sm text-muted-foreground">
              Use compact view for tables and lists
            </p>
          </div>
          <Switch 
            id="compact-view" 
            checked={compactView}
            onCheckedChange={handleCompactViewChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
