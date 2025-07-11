
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Archive,
  LineChart,
  Sparkles
} from 'lucide-react';
import Logo from './logo';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface WelcomeTourProps {
  onClose: () => void;
}

export default function WelcomeTour({ onClose }: WelcomeTourProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { t } = useLanguage();

  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true }));
  
  const features = [
    {
      icon: FileText,
      title: t('tour.feature1.title'),
      description: t('tour.feature1.desc'),
    },
    {
      icon: Archive,
      title: t('tour.feature2.title'),
      description: t('tour.feature2.desc'),
    },
    {
      icon: LineChart,
      title: t('tour.feature3.title'),
      description: t('tour.feature3.desc'),
    },
    {
      icon: Sparkles,
      title: t('tour.feature4.title'),
      description: t('tour.feature4.desc'),
    },
  ];

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => setCurrent(api.selectedScrollSnap()));
    api.on('reInit', () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 pb-2 text-center items-center space-y-2 flex-shrink-0">
          <Logo />
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline">
            {t('tour.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-2">
            <Carousel 
                setApi={setApi} 
                plugins={[plugin.current]} 
                opts={{ loop: true }}
                className="w-full"
            >
              <CarouselContent className="m-0">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <CarouselItem key={index} className="px-2 pt-0">
                        <div className="flex flex-col text-center items-center justify-center space-y-3 p-2 min-h-[16rem]">
                          <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
                            <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-base sm:text-lg">{feature.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-xs mx-auto">{feature.description}</p>
                          </div>
                        </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
                <div className="flex items-center justify-center gap-2 py-4">
                  <CarouselPrevious className="relative translate-y-0 -left-0 h-7 w-7"/>
                  <div className="flex items-center justify-center gap-2">
                    {features.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => api?.scrollTo(i)}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all duration-300",
                          i === current ? "w-4 bg-primary" : "bg-muted hover:bg-muted-foreground/50"
                        )}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                  <CarouselNext className="relative translate-y-0 -right-0 h-7 w-7"/>
                </div>
            </Carousel>
        </div>
        
        <DialogFooter className="p-4 border-t bg-muted/50 flex-shrink-0 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground max-w-[200px]">
                {t('tour.cta_prompt')}
            </p>
            <div className="flex items-center gap-2">
                <Button asChild>
                    <Link href="/signup">{t('tour.create_account')}</Link>
                </Button>
                <Button variant="ghost" onClick={onClose}>
                    {t('tour.skip')}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
