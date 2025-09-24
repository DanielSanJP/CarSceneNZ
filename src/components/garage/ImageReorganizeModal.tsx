"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, GripVertical } from "lucide-react";
import { CustomScrollbar } from "@/components/ui/custom-scrollbar";
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Presentational Image Item (for DragOverlay)
interface ModalImageItemProps {
  imageUrl: string;
  index: number;
  failedImages: Set<string>;
  onImageError: (imageUrl: string) => void;
  isDragOverlay?: boolean;
}

const ModalImageItem = React.forwardRef<HTMLDivElement, ModalImageItemProps>(
  (
    { imageUrl, index, failedImages, onImageError, isDragOverlay = false },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          relative group overflow-hidden rounded-lg border-2 transition-all select-none
          ${
            isDragOverlay
              ? "shadow-2xl scale-105 rotate-2 border-primary bg-background"
              : "border-muted hover:border-primary/50"
          }
        `}
      >
        <div className="relative aspect-square">
          {failedImages.has(imageUrl) ? (
            <div className="aspect-square bg-muted flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              onError={() => onImageError(imageUrl)}
              draggable={false}
            />
          )}

          {/* Drag handle */}
          {!isDragOverlay && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-md opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Image number */}
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
            {index + 1}
          </div>

          {/* Main image indicator */}
          {index === 0 && (
            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
              Main
            </div>
          )}
        </div>
      </div>
    );
  }
);

ModalImageItem.displayName = "ModalImageItem";

// Sortable Image Item for the modal
interface SortableModalImageItemProps {
  imageUrl: string;
  index: number;
  failedImages: Set<string>;
  onImageError: (imageUrl: string) => void;
}

function SortableModalImageItem({
  imageUrl,
  index,
  failedImages,
  onImageError,
}: SortableModalImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: imageUrl,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing touch-manipulation"
      {...attributes}
    >
      <div
        {...listeners}
        className="w-full h-full"
        style={{
          touchAction: "none", // Disable all touch actions for better drag control
          userSelect: "none", // Prevent text selection during drag
          WebkitUserSelect: "none", // Safari support
          msUserSelect: "none", // IE support
        }}
      >
        <ModalImageItem
          imageUrl={imageUrl}
          index={index}
          failedImages={failedImages}
          onImageError={onImageError}
        />
      </div>
    </div>
  );
}

interface ImageReorganizeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  onApply: (reorderedImages: string[]) => void;
  failedImages: Set<string>;
  onImageError: (imageUrl: string) => void;
  isLoading?: boolean;
}

export function ImageReorganizeModal({
  isOpen,
  onOpenChange,
  images,
  onApply,
  failedImages,
  onImageError,
  isLoading = false,
}: ImageReorganizeModalProps) {
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Ref for the scrollable container
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Hide native scrollbar with CSS
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .hidden-scrollbar {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
      }
      .hidden-scrollbar::-webkit-scrollbar {
        display: none; /* Chrome/Safari */
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Optimized @dnd-kit sensors with better activation constraints for mobile touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Even shorter distance for immediate response
        delay: 50, // Very short delay to prevent scroll interference
        tolerance: 2, // Very tight tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize temp images when modal opens or images change
  useEffect(() => {
    if (isOpen) {
      setTempImages([...images]);
    }
  }, [isOpen, images]);

  // Handle modal open/close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveId(null);
      // Ensure scroll is restored when modal closes
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    onOpenChange(open);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Prevent scrolling during drag
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tempImages.findIndex((image) => image === active.id);
      const newIndex = tempImages.findIndex((image) => image === over.id);

      const newImages = arrayMove(tempImages, oldIndex, newIndex);
      setTempImages(newImages);
    }

    setActiveId(null);

    // Restore scrolling after drag
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  };

  const applyReorganization = () => {
    onApply(tempImages);
    handleOpenChange(false);
  };

  const cancelReorganization = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full md:max-w-4xl max-h-full md:max-h-[95vh] w-screen md:w-auto h-screen md:h-auto flex flex-col rounded-none md:rounded-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Reorganize Images</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 flex-1 overflow-hidden pb-6">
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder your images. On mobile, press and hold on
            an image then drag to move it to a new position. The first image
            will be your main image.
          </p>

          {tempImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No images to reorganize</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tempImages}
                strategy={rectSortingStrategy}
              >
                {/* Gallery with external scrollbar */}
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl flex items-start">
                    {/* Image gallery - full width, no scrollbar padding */}
                    <div
                      ref={scrollContainerRef}
                      className="hidden-scrollbar grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] md:max-h-[50vh] overflow-y-auto overscroll-y-contain flex-1"
                      style={{
                        touchAction: activeId ? "none" : "auto",
                        overflowY: activeId ? "hidden" : "auto",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {tempImages.map((imageUrl, index) => (
                        <SortableModalImageItem
                          key={imageUrl}
                          imageUrl={imageUrl}
                          index={index}
                          failedImages={failedImages}
                          onImageError={onImageError}
                        />
                      ))}
                    </div>

                    {/* External custom scrollbar */}
                    <CustomScrollbar
                      scrollContainerRef={scrollContainerRef}
                      dependencies={[tempImages]}
                    />
                  </div>
                </div>
              </SortableContext>
              {createPortal(
                <DragOverlay
                  adjustScale={false}
                  dropAnimation={null}
                  zIndex={9999}
                >
                  {activeId ? (
                    <ModalImageItem
                      imageUrl={activeId}
                      index={tempImages.indexOf(activeId)}
                      failedImages={failedImages}
                      onImageError={onImageError}
                      isDragOverlay
                    />
                  ) : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t flex-shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={cancelReorganization}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={applyReorganization} disabled={isLoading}>
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
