"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface DailyScheduleItem {
  date: Date | undefined;
  start_time: string;
  end_time: string;
  description: string;
}

interface EventDateTimeData {
  daily_schedule: DailyScheduleItem[];
}

interface EventDateTimeProps {
  formData: EventDateTimeData;
  onFormDataChange: (data: Partial<EventDateTimeData>) => void;
}

export function EventDateTime({
  formData,
  onFormDataChange,
}: EventDateTimeProps) {
  const addScheduleItem = () => {
    const newItem: DailyScheduleItem = {
      date: undefined,
      start_time: "",
      end_time: "",
      description: "",
    };
    onFormDataChange({
      daily_schedule: [...formData.daily_schedule, newItem],
    });
  };

  const updateScheduleItem = (
    index: number,
    updates: Partial<DailyScheduleItem>
  ) => {
    const updatedSchedule = formData.daily_schedule.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    onFormDataChange({ daily_schedule: updatedSchedule });
  };

  const removeScheduleItem = (index: number) => {
    const updatedSchedule = formData.daily_schedule.filter(
      (_, i) => i !== index
    );
    onFormDataChange({ daily_schedule: updatedSchedule });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date & Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.daily_schedule.map((item, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg relative">
            {formData.daily_schedule.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Day {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeScheduleItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor={`event-date-${index}`}>
                Event Date {formData.daily_schedule.length === 1 ? "*" : ""}{" "}
                (Day {index + 1})
              </Label>
              <DatePicker
                id={`event-date-${index}`}
                date={item.date}
                onDateChange={(selectedDate) => {
                  updateScheduleItem(index, {
                    date: selectedDate || new Date(),
                  });
                }}
                placeholder="Select event date"
              />
            </div>

            {/* Start and End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor={`start_time-${index}`}>
                  Start Time {formData.daily_schedule.length === 1 ? "*" : ""}{" "}
                  (Day {index + 1})
                </Label>
                <TimePicker
                  id={`start_time-${index}`}
                  value={item.start_time}
                  onChange={(value) =>
                    updateScheduleItem(index, { start_time: value })
                  }
                  placeholder="Select start time (12h)"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor={`end_time-${index}`}>
                  End Time {formData.daily_schedule.length === 1 ? "*" : ""}{" "}
                  (Day {index + 1})
                </Label>
                <TimePicker
                  id={`end_time-${index}`}
                  value={item.end_time}
                  onChange={(value) =>
                    updateScheduleItem(index, { end_time: value })
                  }
                  placeholder="Select end time (12h)"
                />
              </div>
            </div>

            {/* Schedule Description */}
            <div className="space-y-2">
              <Label htmlFor={`schedule_description-${index}`}>
                Schedule Description (Day {index + 1})
              </Label>
              <Textarea
                id={`schedule_description-${index}`}
                value={item.description}
                onChange={(e) =>
                  updateScheduleItem(index, { description: e.target.value })
                }
                placeholder="Optional: Describe the schedule for this day, activities, etc."
                rows={3}
              />
            </div>
          </div>
        ))}

        {/* Add Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={addScheduleItem}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Day
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
