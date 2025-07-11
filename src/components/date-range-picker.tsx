
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
  storageKey: string;
}

export function DateRangePicker({ className, dateRange, setDateRange, storageKey }: DateRangePickerProps) {
  const [storedDate, setStoredDate] = useLocalStorage<DateRange | undefined>(storageKey, dateRange);

  React.useEffect(() => {
    // On component mount, try to set the date from localStorage
    if (storedDate?.from && storedDate?.to) {
        // Ensure values from localStorage are valid Date objects
        const fromDate = new Date(storedDate.from);
        const toDate = new Date(storedDate.to);
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
            setDateRange({ from: fromDate, to: toDate });
        }
    }
  // We only want to run this once on mount, so dependencies are carefully chosen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, setDateRange]);

  const handleDateSelect = (newDate: DateRange | undefined) => {
      setDateRange(newDate);
      // Persist the new date range to localStorage
      setStoredDate(newDate);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
