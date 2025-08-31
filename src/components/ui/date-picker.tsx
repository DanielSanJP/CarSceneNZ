"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: (date: Date) => boolean;
  fromDate?: Date;
  toDate?: Date;
  fromYear?: number;
  toYear?: number;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "dd/mm/yyyy",
  className,
  id,
  disabled,
  fromDate,
  toDate,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className={cn(
            "w-full justify-between font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? date.toLocaleDateString("en-GB") : placeholder}
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden p-0"
        align="start"
        side="top"
        sideOffset={4}
        avoidCollisions={false}
        sticky="always"
      >
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          disabled={disabled}
          fromDate={fromDate}
          toDate={toDate}
          fromYear={
            fromYear || fromDate?.getFullYear() || new Date().getFullYear()
          }
          toYear={
            toYear || toDate?.getFullYear() || new Date().getFullYear() + 20
          }
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
