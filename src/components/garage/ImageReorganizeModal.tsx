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
import {
  DndContext,
  closestCenter,
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
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing">
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
          touchAction: "manipulation", // Allow scrolling but prevent browser zoom/pan
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

  // Optimized @dnd-kit sensors with better activation constraints (matching main CarImageManager)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15, // Require 15px movement before activating (increased for mobile)
        delay: 200, // 200ms delay before drag activates (helps with scrolling)
        tolerance: 5, // 5px tolerance for slight finger movement
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
    }
    onOpenChange(open);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
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
        <div className="space-y-4 flex-1 overflow-y-auto pb-6">
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder your images. On mobile, hold and drag to
            move images. The first image will be your main image.
          </p>

          {tempImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No images to reorganize</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tempImages}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] md:max-h-[50vh] overflow-y-auto overscroll-y-contain">
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
