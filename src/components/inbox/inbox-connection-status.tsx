"use client";

import { useInboxSafe } from "@/hooks/use-inbox-safe";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

interface InboxConnectionStatusProps {
  showText?: boolean;
  className?: string;
}

/**
 * Component to show the real-time connection status for inbox updates
 * Can be placed anywhere in the app to show connection health
 */
export function InboxConnectionStatus({
  showText = true,
  className = "",
}: InboxConnectionStatusProps) {
  const { isConnected, error } = useInboxSafe();

  if (error) {
    return (
      <div className={`flex items-center gap-1 text-red-600 ${className}`}>
        <AlertCircle size={14} />
        {showText && <span className="text-xs">Connection error</span>}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 ${
        isConnected ? "text-green-600" : "text-orange-600"
      } ${className}`}
    >
      {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      {showText && (
        <span className="text-xs">
          {isConnected ? "Live updates" : "Connecting..."}
        </span>
      )}
    </div>
  );
}
