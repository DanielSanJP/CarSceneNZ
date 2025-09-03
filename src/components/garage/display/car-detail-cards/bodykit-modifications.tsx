import type { Car } from "@/types/car";

interface BodykitModificationsProps {
  bodykitModifications: Car["bodykit_modifications"];
}

export function BodykitModifications({
  bodykitModifications,
}: BodykitModificationsProps) {
  if (!bodykitModifications) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Bodykit</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {bodykitModifications.front_bumper && (
          <div>
            <p className="text-muted-foreground">Front Bumper</p>
            <p className="font-medium">{bodykitModifications.front_bumper}</p>
          </div>
        )}
        {bodykitModifications.rear_bumper && (
          <div>
            <p className="text-muted-foreground">Rear Bumper</p>
            <p className="font-medium">{bodykitModifications.rear_bumper}</p>
          </div>
        )}
        {bodykitModifications.side_skirts && (
          <div>
            <p className="text-muted-foreground">Side Skirts</p>
            <p className="font-medium">{bodykitModifications.side_skirts}</p>
          </div>
        )}
        {bodykitModifications.rear_spoiler && (
          <div>
            <p className="text-muted-foreground">Rear Spoiler</p>
            <p className="font-medium">{bodykitModifications.rear_spoiler}</p>
          </div>
        )}
      </div>
    </div>
  );
}
