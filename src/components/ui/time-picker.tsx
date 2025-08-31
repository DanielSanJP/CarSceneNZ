"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "HH:MM AM",
  className,
  id,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hour12, setHour12] = React.useState(value ? getHour12(value) : "");
  const [minute, setMinute] = React.useState(value ? value.split(":")[1] : "");
  const [ampm, setAmpm] = React.useState(value ? getAmpm(value) : "AM");

  function getHour12(time24: string): string {
    const [hour] = time24.split(":");
    const hourNum = parseInt(hour, 10);
    if (hourNum === 0) return "12";
    if (hourNum > 12) return (hourNum - 12).toString();
    return hourNum.toString();
  }

  function getAmpm(time24: string): string {
    const [hour] = time24.split(":");
    const hourNum = parseInt(hour, 10);
    return hourNum >= 12 ? "PM" : "AM";
  }

  function convertTo24(hour12: string, ampm: string): string {
    let hour24 = parseInt(hour12, 10);
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;
    if (ampm === "AM" && hour24 === 12) hour24 = 0;
    return hour24.toString().padStart(2, "0");
  }

  React.useEffect(() => {
    if (value) {
      const [, m] = value.split(":");
      setHour12(getHour12(value));
      setMinute(m);
      setAmpm(getAmpm(value));
    } else {
      setHour12("");
      setMinute("");
      setAmpm("AM");
    }
  }, [value]);

  const handleConfirm = () => {
    if (hour12 && minute) {
      const hour24 = convertTo24(hour12, ampm);
      onChange?.(`${hour24}:${minute}`);
    }
    setOpen(false);
  };

  const displayValue = value ? `${hour12}:${minute} ${ampm}` : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {displayValue}
          <ClockIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 sm:p-4 min-w-[280px] sm:min-w-[320px]"
        align="start"
      >
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Select value={hour12} onValueChange={setHour12}>
              <SelectTrigger className="w-full sm:w-20 flex-1">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {(i + 1).toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm font-medium">:</span>
            <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger className="w-full sm:w-20 flex-1">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }, (_, i) => (
                  <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                    {i.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={ampm} onValueChange={setAmpm}>
            <SelectTrigger className="w-full sm:w-20">
              <SelectValue placeholder="AM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end mt-2">
          <Button onClick={handleConfirm} size="sm">
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
