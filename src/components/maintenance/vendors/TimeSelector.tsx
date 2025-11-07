
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock } from "lucide-react";

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
}

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  // Create time options at 30 minute intervals
  const timeOptions = [];
  for (let hour = 8; hour < 18; hour++) {
    const hourString = hour.toString().padStart(2, "0");
    timeOptions.push(`${hourString}:00`);
    timeOptions.push(`${hourString}:30`);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <Clock className="mr-2 h-4 w-4" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <div className="max-h-[200px] overflow-y-auto p-1">
          {timeOptions.map((timeOption) => (
            <Button
              key={timeOption}
              variant="ghost"
              className="w-full justify-start font-normal"
              onClick={() => onChange(timeOption)}
            >
              {timeOption}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
