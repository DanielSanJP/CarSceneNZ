import type { Car } from "@/types/car";

interface PaintFinishProps {
  paintFinish: Car["paint_finish"];
}

export function PaintFinish({ paintFinish }: PaintFinishProps) {
  if (!paintFinish) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Paint & Finish</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {paintFinish.paint_color && (
          <div>
            <p className="text-muted-foreground">Paint Color</p>
            <p className="font-medium">{paintFinish.paint_color}</p>
          </div>
        )}
        {paintFinish.paint_finish && (
          <div>
            <p className="text-muted-foreground">Finish Type</p>
            <p className="font-medium">{paintFinish.paint_finish}</p>
          </div>
        )}
        {paintFinish.wrap_brand && (
          <div>
            <p className="text-muted-foreground">Wrap</p>
            <p className="font-medium">
              {paintFinish.wrap_brand} - {paintFinish.wrap_color}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
