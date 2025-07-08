"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppearanceSettings } from "@/components/appearance-settings";
import { OrganizationSettings } from "@/components/organization-settings";
import { PasswordSettings } from "@/components/password-settings";
import { ProfileSettings } from "@/components/profile-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Building, Lock, Paintbrush, UserCircle, Loader2 } from "lucide-react";

function ProfilePageContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  
  const canViewOrgSettings = user?.activeRole === 'owner' || user?.activeRole === 'admin';

  const validTabs = ['profile', 'password', 'organization', 'appearance'];
  let defaultTab = 'profile';

  if (tab && validTabs.includes(tab)) {
    if (tab === 'organization' && canViewOrgSettings) {
      defaultTab = tab;
    } else if (tab !== 'organization') {
      defaultTab = tab;
    }
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
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
  );
}

export default function ProfilePage() {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                {t("settings.title")}
                </h1>
                <p className="text-muted-foreground">{t("settings.desc")}</p>
            </div>
            <Suspense fallback={<div className="flex h-48 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <ProfilePageContent />
            </Suspense>
        </div>
    )
}
