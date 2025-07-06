
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/language-context";
import { Sun, Moon, Monitor, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { updateOrganizationThemeAction } from "@/app/actions";

export function AppearanceSettings() {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    if (!user || !user.activeTenantId) {
      toast({ title: "Error", description: "Could not save theme.", variant: "destructive" });
      return;
    }
    
    // Optimistically update the UI
    setTheme(newTheme);
    setIsSaving(true);
    
    const result = await updateOrganizationThemeAction(user.activeTenantId, newTheme);
    
    if (!result.success) {
      toast({ title: "Error", description: result.error || "Failed to save theme.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>{t("settings.appearance.theme.title")}</CardTitle>
                <CardDescription>{t("settings.appearance.theme.desc")}</CardDescription>
            </div>
            {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
          className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-3"
          disabled={isSaving}
        >
          {/* Light Theme */}
          <div>
            <RadioGroupItem value="light" id="light" className="peer sr-only" />
            <Label
              htmlFor="light"
              className={cn(
                "block w-full cursor-pointer rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t("settings.appearance.theme.light")}</span>
                <Sun className="h-5 w-5" />
              </div>
            </Label>
          </div>
          {/* Dark Theme */}
          <div>
            <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
            <Label
              htmlFor="dark"
              className={cn(
                "block w-full cursor-pointer rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t("settings.appearance.theme.dark")}</span>
                <Moon className="h-5 w-5" />
              </div>
            </Label>
          </div>
          {/* System Theme */}
           <div>
            <RadioGroupItem value="system" id="system" className="peer sr-only" />
            <Label
              htmlFor="system"
              className={cn(
                "block w-full cursor-pointer rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">System</span>
                <Monitor className="h-5 w-5" />
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
