import { FileText, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-primary drop-shadow-sm">
      <div className="relative">
        <FileText className="h-7 w-7" />
        <Feather className="absolute -bottom-1 -right-2 h-4 w-4 text-primary/80" />
      </div>
      <span className="text-xl font-bold font-headline text-foreground group-data-[collapsible=icon]:hidden">
        Pocket <span className="text-primary text-2xl">කඩේ</span>
      </span>
    </div>
  );
}
