
"use client";

import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';

export default function LanguagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { changeLocale, locale } = useLanguage();

  const handleSelect = async (selectedLocale: 'en' | 'si') => {
    changeLocale(selectedLocale);
    
    // For staff, onboarding ends here.
    if (user?.activeRole === 'staff') {
      if (user.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { onboardingCompleted: true });
      }
      router.push('/');
    } else {
      // For admin/owner, move to the next step.
      router.push('/setup/theme');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Select Your Language</CardTitle>
        <CardDescription>Choose the primary language for your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant={locale === 'en' ? 'default' : 'outline'}
          className="h-24 text-lg"
          onClick={() => handleSelect('en')}
        >
          English
        </Button>
        <Button
          variant={locale === 'si' ? 'default' : 'outline'}
          className="h-24 text-lg"
          onClick={() => handleSelect('si')}
        >
          සිංහල
        </Button>
      </CardContent>
    </Card>
  );
}
