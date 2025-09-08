"use client";

import { useInboxSafe } from "@/hooks/use-inbox-safe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InboxUnreadBadge } from "@/components/inbox/inbox-unread-badge";
import { InboxConnectionStatus } from "@/components/inbox/inbox-connection-status";
import { Bell, RefreshCw, Eye } from "lucide-react";

/**
 * Debug component to test the real-time inbox functionality
 * Shows current state and allows manual testing
 */
export function InboxDebugPanel() {
  const { unreadCount, isConnected, error, refreshUnreadCount, markAsRead } =
    useInboxSafe();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Inbox Debug Panel
          <InboxUnreadBadge />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State */}
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Unread Count:</strong> {unreadCount}
          </div>
          <div className="flex items-center gap-2">
            <strong className="text-sm">Status:</strong>
            <InboxConnectionStatus />
          </div>
          {error && (
            <div className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Manual Actions */}
        <div className="space-y-2">
          <Button
            onClick={refreshUnreadCount}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!isConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Count
          </Button>

          <Button
            onClick={markAsRead}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={unreadCount === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Mark as Read
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <p>
            <strong>Test Instructions:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Send yourself a message from another account</li>
            <li>Watch the count update in real-time</li>
            <li>Visit /inbox to see auto-reset behavior</li>
            <li>Test with multiple browser tabs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
