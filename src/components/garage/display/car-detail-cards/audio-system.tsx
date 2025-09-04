import type { CarAudioSystem } from "@/types/car";

interface AudioSystemProps {
  audioSystem: CarAudioSystem | undefined;
}

export function AudioSystem({ audioSystem }: AudioSystemProps) {
  if (!audioSystem) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Audio System</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {audioSystem.head_unit && (
          <div>
            <p className="text-muted-foreground">Head Unit</p>
            <p className="font-medium">{audioSystem.head_unit}</p>
          </div>
        )}
        {audioSystem.speakers && (
          <div>
            <p className="text-muted-foreground">Speakers</p>
            <p className="font-medium">{audioSystem.speakers}</p>
          </div>
        )}
        {audioSystem.subwoofer && (
          <div>
            <p className="text-muted-foreground">Subwoofer</p>
            <p className="font-medium">{audioSystem.subwoofer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
