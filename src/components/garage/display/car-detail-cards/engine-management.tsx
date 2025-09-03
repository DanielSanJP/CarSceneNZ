import type { Car } from "@/types/car";

interface EngineManagementProps {
  engineManagement: Car["engine_management"];
}

export function EngineManagement({ engineManagement }: EngineManagementProps) {
  if (
    !engineManagement ||
    (!engineManagement.ecu && !engineManagement.tuned_by)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium capitalize">Engine Management</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {engineManagement.ecu && (
          <div>
            <p className="text-muted-foreground">ECU</p>
            <p className="font-medium">{engineManagement.ecu}</p>
          </div>
        )}
        {engineManagement.tuned_by && (
          <div>
            <p className="text-muted-foreground">Tuned By</p>
            <p className="font-medium">{engineManagement.tuned_by}</p>
          </div>
        )}
      </div>
    </div>
  );
}
