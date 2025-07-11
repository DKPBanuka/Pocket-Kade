
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from '@/contexts/auth-context';
import { completeUserOnboardingAction, addSampleProductForTour, deleteSampleProductForTour } from '@/app/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';

export default function LoggedInTour() {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const pathname = usePathname();
    const { t } = useLanguage();
    const [sampleProductId, setSampleProductId] = useState<string | null>(null);
    const driverRef = useRef<Driver | null>(null);

    // This function will be called to clean up the tour
    const finishOnboarding = useCallback(async (completed = false) => {
        if (driverRef.current?.isActive()) {
            driverRef.current.destroy();
        }
        if (sampleProductId) {
            await deleteSampleProductForTour(sampleProductId);
            setSampleProductId(null);
        }
        if (user && completed) {
            await completeUserOnboardingAction(user.uid);
        }
        driverRef.current = null;
    }, [user, sampleProductId]);


    // The main function to define and run the tour
    const runInteractiveTour = useCallback(async () => {
        if (!user?.activeTenantId || driverRef.current?.isActive()) return;

        // Add sample product for the tour
        const result = await addSampleProductForTour(user.activeTenantId);
        if (result.success && result.productId) {
            setSampleProductId(result.productId);
        } else {
            console.error("Failed to create sample product for tour");
            return; // Don't start tour if sample product fails
        }
        
        let tourCompleted = false;

        const driverObj = driver({
            allowClose: true,
            onDestroyStarted: () => {
                if (!tourCompleted) {
                   finishOnboarding(false);
                }
            },
            steps: [
                {
                    popover: {
                        title: t('tour.feature1.title'),
                        description: t('tour.feature1.desc'),
                        showButtons: ['close', 'next'],
                        nextBtnText: t('tour.feature1.start_btn'),
                    }
                },
                {
                    element: isMobile ? '#mobile-inventory-link' : '#sidebar-inventory-link',
                    popover: {
                        title: t('tour.feature2.title'),
                        description: t('tour.feature2.desc'),
                        showButtons: ['close'],
                    },
                    onHighlightClick: () => {
                        driverObj.moveNext();
                    }
                },
                {
                    element: `[data-tour-id="sample-product-${isMobile ? 'card' : 'row'}"]`,
                    popover: {
                        title: t('tour.feature3.title'),
                        description: t('tour.feature3.desc'),
                        showButtons: ['close', 'next'],
                    }
                },
                {
                    element: isMobile ? '#mobile-invoices-link' : '#sidebar-invoices-link',
                    popover: {
                        title: t('tour.feature4.title'),
                        description: t('tour.feature4.desc'),
                        showButtons: ['close'],
                    },
                    onHighlightClick: () => {
                        driverObj.moveNext();
                    }
                },
                {
                    element: '#new-invoice-button',
                    popover: {
                        title: t('tour.feature5.title'),
                        description: t('tour.feature5.desc'),
                        showButtons: ['close'],
                    },
                     onHighlightClick: () => {
                        driverObj.moveNext();
                    }
                },
                {
                    popover: {
                        title: t('tour.feature6.title'),
                        description: t('tour.feature6.desc'),
                        showButtons: ['close', 'done'],
                        doneBtnText: t('tour.feature6.done_btn'),
                    },
                     onDoneClick: () => {
                         tourCompleted = true;
                         finishOnboarding(true);
                    }
                }
            ].filter(Boolean) as DriveStep[]
        });
        
        driverRef.current = driverObj;
        driverObj.drive();

    }, [user, isMobile, finishOnboarding, t]);

    // Effect to start the tour when the component mounts and conditions are right
    useEffect(() => {
        // Run tour only on the main dashboard page
        if (pathname === '/') {
            const timeoutId = setTimeout(() => {
                runInteractiveTour();
            }, 500); // Small delay to ensure page elements are loaded
            
            return () => clearTimeout(timeoutId);
        }
    }, [pathname, runInteractiveTour]);


    // This component does not render anything itself, it just controls the tour
    return null;
}
