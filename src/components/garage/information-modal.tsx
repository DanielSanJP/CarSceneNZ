"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export function InformationModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Info className="h-4 w-4" />
          <span className="sr-only">Form information</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Form Information
          </DialogTitle>
          <DialogDescription>
            You don&apos;t need to fill out every field! Only add what you have
            available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="font-medium text-foreground">
              You don&apos;t need to fill out every field!
            </div>
          </div>

          <div className="space-y-3">
            <div>
              Only add the information you have available. You can always come
              back later to update your car&apos;s details as you make
              modifications or remember additional specs.
            </div>

            <div className="space-y-2">
              <div>
                <strong className="text-green-600 dark:text-green-400">
                  Required fields:
                </strong>{" "}
                Brand, Model, and Year are the only mandatory fields to create
                your car profile.
              </div>

              <div>
                <strong className="text-blue-600 dark:text-blue-400">
                  Optional sections:
                </strong>{" "}
                All modification details, specifications, and images can be
                added whenever you have the information.
              </div>
            </div>

            <div className="text-sm text-muted-foreground italic">
              Tip: Start with the basics and build your car&apos;s profile over
              time!
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
