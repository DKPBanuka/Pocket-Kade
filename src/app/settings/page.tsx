
"use client";

import { AppearanceSettings } from "@/components/appearance-settings";
import { OrganizationSettings } from "@/components/organization-settings";
import { PasswordSettings } from "@/components/password-settings";
import { ProfileSettings } from "@/components/profile-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Building, Lock, Paintbrush, UserCircle } from "lucide-react";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const canViewOrgSettings = user?.activeRole === 'owner' || user?.activeRole === 'admin';

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground">{t("settings.desc")}</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <div className="w-full overflow-x-auto pb-2 mb-6">
            <TabsList className="w-max">
            <TabsTrigger value="profile">
                <UserCircle className="mr-2 h-4 w-4" />
                {t("settings.profile.title")}
            </TabsTrigger>
            <TabsTrigger value="password">
                <Lock className="mr-2 h-4 w-4" />
                {t("settings.password.title")}
            </TabsTrigger>
            {canViewOrgSettings && (
                <TabsTrigger value="organization">
                    <Building className="mr-2 h-4 w-4" />
                    {t("settings.organization.title")}
                </TabsTrigger>
            )}
            <TabsTrigger value="appearance">
                <Paintbrush className="mr-2 h-4 w-4" />
                {t("settings.appearance.title")}
            </TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="password">
          <PasswordSettings />
        </TabsContent>
        {canViewOrgSettings && (
            <TabsContent value="organization">
             <OrganizationSettings />
            </TabsContent>
        )}
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
