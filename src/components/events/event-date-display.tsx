import { Calendar, Clock } from "lucide-react";

interface EventDateDisplayProps {
  dailySchedule: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
  }>;
}

/**
 * Reusable component for displaying event date and time consistently
 * Used across events-gallery, my-events-view, and attending-events-view
 */
export function EventDateDisplay({ dailySchedule }: EventDateDisplayProps) {
  const formatEventDateTime = (
    schedule: Array<{
      date: string;
      start_time?: string;
      end_time?: string;
    }>
  ) => {
    if (!schedule || schedule.length === 0) {
      return { day: "", date: "", time: "", full: "TBD" };
    }

    const firstDay = schedule[0];
    const lastDay = schedule[schedule.length - 1];

    const startDate = new Date(
      `${firstDay.date}T${firstDay.start_time || "00:00"}`
    );
    const date = startDate.toLocaleDateString("en-NZ", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Convert times to 12-hour format
    const formatTime = (timeString: string) => {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-NZ", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const time =
      firstDay.start_time && lastDay.end_time
        ? `${formatTime(firstDay.start_time)} - ${formatTime(lastDay.end_time)}`
        : firstDay.start_time
        ? formatTime(firstDay.start_time)
        : "";

    return {
      day: date,
      date,
      time,
      full: time ? `${date} at ${time}` : date,
    };
  };

  const dateInfo = formatEventDateTime(dailySchedule);

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="font-medium text-sm">{dateInfo.full}</div>
        <div className="text-muted-foreground text-sm flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {dateInfo.time}
        </div>
      </div>
    </div>
  );
}
