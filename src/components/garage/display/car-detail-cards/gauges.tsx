import type { Car } from "@/types/car";

interface GaugesProps {
  gauges: Car["gauges"];
}

export function Gauges({ gauges }: GaugesProps) {
  // Handle case where gauges might be an object instead of array
  const gaugeArray = Array.isArray(gauges) ? gauges : [];

  if (!gauges || gaugeArray.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Gauges</h4>
      <div className="flex flex-wrap gap-2">
        {gaugeArray.map((gauge) => (
          <span
            key={gauge.id}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
          >
            {gauge.gauge_type}
            {gauge.brand && ` - ${gauge.brand}`}
          </span>
        ))}
      </div>
    </div>
  );
}
