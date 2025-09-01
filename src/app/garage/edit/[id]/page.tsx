"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getCarById } from "@/data";
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  X,
  Camera,
  GripVertical,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import Image from "next/image";
import type { Car } from "@/types";

interface WheelSpec {
  brand: string;
  size: string;
  offset: string;
}

interface EngineSpec {
  type: string;
  displacement: string;
  horsepower: string;
  torque: string;
  fuel_system: string;
  aspiration: string;
  engine_code: string;
  power_hp: number;
  torque_nm: number;
  modifications: {
    turbo: { brand: string };
    supercharger: { brand: string };
    intercooler: { brand: string };
    exhaust: { header: string; catback: string };
    intake: { brand: string };
    ecu: { brand: string; tuned_by: string };
    internals: {
      pistons: string;
      rods: string;
      valves: string;
      springs: string;
      cams: string;
    };
    fuel_system: { injectors: string; fuel_pump: string; fuel_rail: string };
  };
}

interface BrakeSpec {
  front: {
    brand: string;
    size: string;
    type: string;
    caliper: string;
    disc_size: string;
    disc_type: string;
    pads: string;
  };
  rear: {
    brand: string;
    size: string;
    type: string;
    caliper: string;
    disc_size: string;
    disc_type: string;
    pads: string;
  };
  brake_lines: string;
  master_cylinder: string;
}

interface SuspensionSpec {
  front: {
    brand: string;
    type: string;
    spring_rate: string;
    damper: string;
    model: string;
    camber: number;
    toe: string;
    caster: string;
  };
  rear: {
    brand: string;
    type: string;
    spring_rate: string;
    damper: string;
    model: string;
    camber: number;
    toe: string;
    caster: string;
  };
}

interface ExteriorSpec {
  paint: {
    color: string;
    type: string;
    finish: string;
  };
  body_kit: {
    front_bumper: string;
    rear_bumper: string;
    side_skirts: string;
    rear_wing: string;
  };
  wheels: string;
  exhaust: string;
  spoiler: string;
  lighting: {
    headlights: string;
    taillights: string;
    indicators: string;
  };
  other: string;
}

interface InteriorSpec {
  seats: {
    front: string;
    rear: string;
  };
  steering_wheel: {
    brand: string;
    model: string;
    size: string;
  };
  dashboard: string;
  carpet: string;
  gauges: string[];
  audio_system: string;
  roll_cage: {
    material: string;
  };
  audio: {
    head_unit: string;
    speakers: string;
    subwoofer: string;
  };
  other: string;
}

interface PerformanceModsSpec {
  intake: string;
  exhaust: string;
  turbo: string;
  intercooler: string;
  fuel_system: string;
  ignition: string;
  weight_reduction: string[];
  aero: string[];
  chassis: string[];
  cooling: string[];
  other: string;
}

interface CarFormData {
  brand: string;
  model: string;
  year: number | "";
  suspension_type: string;
  wheel_specs: {
    front: WheelSpec;
    rear: WheelSpec;
  };
  tire_specs: {
    front: string;
    rear: string;
  };
  images: string[];
  engine: EngineSpec;
  brakes: BrakeSpec;
  suspension: SuspensionSpec;
  exterior: ExteriorSpec;
  interior: InteriorSpec;
  performance_mods: PerformanceModsSpec;
}

export default function EditCarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [car, setCar] = useState<Car | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<CarFormData>({
    brand: "",
    model: "",
    year: "",
    suspension_type: "",
    wheel_specs: {
      front: { brand: "", size: "", offset: "" },
      rear: { brand: "", size: "", offset: "" },
    },
    tire_specs: {
      front: "",
      rear: "",
    },
    images: [],
    engine: {
      type: "",
      displacement: "",
      horsepower: "",
      torque: "",
      fuel_system: "",
      aspiration: "",
      engine_code: "",
      power_hp: 0,
      torque_nm: 0,
      modifications: {
        turbo: { brand: "" },
        supercharger: { brand: "" },
        intercooler: { brand: "" },
        exhaust: { header: "", catback: "" },
        intake: { brand: "" },
        ecu: { brand: "", tuned_by: "" },
        internals: { pistons: "", rods: "", valves: "", springs: "", cams: "" },
        fuel_system: { injectors: "", fuel_pump: "", fuel_rail: "" },
      },
    },
    brakes: {
      front: {
        brand: "",
        size: "",
        type: "",
        caliper: "",
        disc_size: "",
        disc_type: "",
        pads: "",
      },
      rear: {
        brand: "",
        size: "",
        type: "",
        caliper: "",
        disc_size: "",
        disc_type: "",
        pads: "",
      },
      brake_lines: "",
      master_cylinder: "",
    },
    suspension: {
      front: {
        brand: "",
        type: "",
        spring_rate: "",
        damper: "",
        model: "",
        camber: 0,
        toe: "",
        caster: "",
      },
      rear: {
        brand: "",
        type: "",
        spring_rate: "",
        damper: "",
        model: "",
        camber: 0,
        toe: "",
        caster: "",
      },
    },
    exterior: {
      paint: { color: "", type: "", finish: "" },
      body_kit: {
        front_bumper: "",
        rear_bumper: "",
        side_skirts: "",
        rear_wing: "",
      },
      wheels: "",
      exhaust: "",
      spoiler: "",
      lighting: { headlights: "", taillights: "", indicators: "" },
      other: "",
    },
    interior: {
      seats: { front: "", rear: "" },
      steering_wheel: { brand: "", model: "", size: "" },
      dashboard: "",
      carpet: "",
      gauges: [],
      audio_system: "",
      roll_cage: { material: "" },
      audio: { head_unit: "", speakers: "", subwoofer: "" },
      other: "",
    },
    performance_mods: {
      intake: "",
      exhaust: "",
      turbo: "",
      intercooler: "",
      fuel_system: "",
      ignition: "",
      weight_reduction: [],
      aero: [],
      chassis: [],
      cooling: [],
      other: "",
    },
  });

  useEffect(() => {
    const loadCar = async () => {
      try {
        const foundCar = await getCarById(carId);
        if (foundCar) {
          setCar(foundCar);
          setFormData({
            brand: foundCar.brand,
            model: foundCar.model,
            year: foundCar.year,
            suspension_type: foundCar.suspension_type || "",
            wheel_specs: {
              front:
                foundCar.wheel_specs?.front &&
                typeof foundCar.wheel_specs.front === "object" &&
                foundCar.wheel_specs.front !== null &&
                "brand" in foundCar.wheel_specs.front
                  ? (foundCar.wheel_specs.front as WheelSpec)
                  : {
                      brand: "",
                      size: "",
                      offset: "",
                    },
              rear:
                foundCar.wheel_specs?.rear &&
                typeof foundCar.wheel_specs.rear === "object" &&
                foundCar.wheel_specs.rear !== null &&
                "brand" in foundCar.wheel_specs.rear
                  ? (foundCar.wheel_specs.rear as WheelSpec)
                  : {
                      brand: "",
                      size: "",
                      offset: "",
                    },
            },
            tire_specs: {
              front:
                foundCar.tire_specs?.front &&
                typeof foundCar.tire_specs.front === "string"
                  ? foundCar.tire_specs.front
                  : "",
              rear:
                foundCar.tire_specs?.rear &&
                typeof foundCar.tire_specs.rear === "string"
                  ? foundCar.tire_specs.rear
                  : "",
            },
            images: foundCar.images || [],
            engine: foundCar.engine
              ? {
                  type: foundCar.engine.type || "",
                  displacement: foundCar.engine.displacement || "",
                  horsepower: String(foundCar.engine.horsepower || ""),
                  torque: String(foundCar.engine.torque || ""),
                  fuel_system: "",
                  aspiration: "",
                  engine_code: "",
                  power_hp: foundCar.engine.horsepower || 0,
                  torque_nm: foundCar.engine.torque || 0,
                  modifications: {
                    turbo: { brand: "" },
                    supercharger: { brand: "" },
                    intercooler: { brand: "" },
                    exhaust: { header: "", catback: "" },
                    intake: { brand: "" },
                    ecu: { brand: "", tuned_by: "" },
                    internals: {
                      pistons: "",
                      rods: "",
                      valves: "",
                      springs: "",
                      cams: "",
                    },
                    fuel_system: {
                      injectors: "",
                      fuel_pump: "",
                      fuel_rail: "",
                    },
                  },
                }
              : {
                  type: "",
                  displacement: "",
                  horsepower: "",
                  torque: "",
                  fuel_system: "",
                  aspiration: "",
                  engine_code: "",
                  power_hp: 0,
                  torque_nm: 0,
                  modifications: {
                    turbo: { brand: "" },
                    supercharger: { brand: "" },
                    intercooler: { brand: "" },
                    exhaust: { header: "", catback: "" },
                    intake: { brand: "" },
                    ecu: { brand: "", tuned_by: "" },
                    internals: {
                      pistons: "",
                      rods: "",
                      valves: "",
                      springs: "",
                      cams: "",
                    },
                    fuel_system: {
                      injectors: "",
                      fuel_pump: "",
                      fuel_rail: "",
                    },
                  },
                },
            brakes: foundCar.brakes
              ? {
                  front: {
                    brand: foundCar.brakes.brand || "",
                    size: "",
                    type: foundCar.brakes.type || "",
                    caliper: "",
                    disc_size: "",
                    disc_type: "",
                    pads: "",
                  },
                  rear: {
                    brand: foundCar.brakes.brand || "",
                    size: "",
                    type: foundCar.brakes.type || "",
                    caliper: "",
                    disc_size: "",
                    disc_type: "",
                    pads: "",
                  },
                  brake_lines: "",
                  master_cylinder: "",
                }
              : {
                  front: {
                    brand: "",
                    size: "",
                    type: "",
                    caliper: "",
                    disc_size: "",
                    disc_type: "",
                    pads: "",
                  },
                  rear: {
                    brand: "",
                    size: "",
                    type: "",
                    caliper: "",
                    disc_size: "",
                    disc_type: "",
                    pads: "",
                  },
                  brake_lines: "",
                  master_cylinder: "",
                },
            suspension: foundCar.suspension
              ? {
                  front: {
                    brand: foundCar.suspension.brand || "",
                    type: foundCar.suspension.type || "",
                    spring_rate: "",
                    damper: "",
                    model: "",
                    camber: 0,
                    toe: "",
                    caster: "",
                  },
                  rear: {
                    brand: foundCar.suspension.brand || "",
                    type: foundCar.suspension.type || "",
                    spring_rate: "",
                    damper: "",
                    model: "",
                    camber: 0,
                    toe: "",
                    caster: "",
                  },
                }
              : {
                  front: {
                    brand: "",
                    type: "",
                    spring_rate: "",
                    damper: "",
                    model: "",
                    camber: 0,
                    toe: "",
                    caster: "",
                  },
                  rear: {
                    brand: "",
                    type: "",
                    spring_rate: "",
                    damper: "",
                    model: "",
                    camber: 0,
                    toe: "",
                    caster: "",
                  },
                },
            exterior: foundCar.exterior
              ? {
                  paint: {
                    color: foundCar.exterior.color || "",
                    type: "",
                    finish: "",
                  },
                  body_kit: {
                    front_bumper: "",
                    rear_bumper: "",
                    side_skirts: "",
                    rear_wing: "",
                  },
                  wheels: "",
                  exhaust: "",
                  spoiler: "",
                  lighting: { headlights: "", taillights: "", indicators: "" },
                  other: "",
                }
              : {
                  paint: { color: "", type: "", finish: "" },
                  body_kit: {
                    front_bumper: "",
                    rear_bumper: "",
                    side_skirts: "",
                    rear_wing: "",
                  },
                  wheels: "",
                  exhaust: "",
                  spoiler: "",
                  lighting: { headlights: "", taillights: "", indicators: "" },
                  other: "",
                },
            interior: foundCar.interior
              ? {
                  seats: {
                    front: foundCar.interior.seats || "",
                    rear: "",
                  },
                  steering_wheel: { brand: "", model: "", size: "" },
                  dashboard: "",
                  carpet: "",
                  gauges: Array.isArray(foundCar.interior.gauges)
                    ? foundCar.interior.gauges
                    : [],
                  audio_system: "",
                  roll_cage: { material: "" },
                  audio: { head_unit: "", speakers: "", subwoofer: "" },
                  other: "",
                }
              : {
                  seats: { front: "", rear: "" },
                  steering_wheel: { brand: "", model: "", size: "" },
                  dashboard: "",
                  carpet: "",
                  gauges: [],
                  audio_system: "",
                  roll_cage: { material: "" },
                  audio: { head_unit: "", speakers: "", subwoofer: "" },
                  other: "",
                },
            performance_mods: foundCar.performance_mods
              ? {
                  intake: foundCar.performance_mods.intake || "",
                  exhaust: foundCar.performance_mods.exhaust || "",
                  turbo: "",
                  intercooler: "",
                  fuel_system: "",
                  ignition: "",
                  weight_reduction: Array.isArray(
                    foundCar.performance_mods.other
                  )
                    ? foundCar.performance_mods.other
                    : [],
                  aero: [],
                  chassis: [],
                  cooling: [],
                  other: "",
                }
              : {
                  intake: "",
                  exhaust: "",
                  turbo: "",
                  intercooler: "",
                  fuel_system: "",
                  ignition: "",
                  weight_reduction: [],
                  aero: [],
                  chassis: [],
                  cooling: [],
                  other: "",
                },
          });
        }
      } catch (error) {
        console.error("Error loading car:", error);
      }
    };
    loadCar();
  }, [carId]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to edit cars.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Car Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The car you&apos;re trying to edit doesn&apos;t exist.
            </p>
            <Link href="/garage" className="mt-4 inline-block">
              <Button>Back to Garage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this car
  if (car.owner_id !== user.id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to edit this car.
            </p>
            <Link href="/garage" className="mt-4 inline-block">
              <Button>Back to Garage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWheelSpecChange = (
    position: "front" | "rear",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      wheel_specs: {
        ...prev.wheel_specs,
        [position]: {
          ...prev.wheel_specs[position],
          [field]: value,
        },
      },
    }));
  };

  const handleTireSpecChange = (position: "front" | "rear", value: string) => {
    setFormData((prev) => ({
      ...prev,
      tire_specs: {
        ...prev.tire_specs,
        [position]: value,
      },
    }));
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleDeleteImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageUrl),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImageCount = formData.images.length;
    const maxImages = 10;
    const remainingSlots = maxImages - currentImageCount;

    if (remainingSlots <= 0) {
      alert(`You can only upload a maximum of ${maxImages} images.`);
      e.target.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(
        `You can only add ${remainingSlots} more image(s). Only the first ${remainingSlots} image(s) will be uploaded.`
      );
    }

    // In a real app, you would upload these files to your server/cloud storage
    // For now, we'll simulate adding them as URLs
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData((prev) => {
          // Double-check we don't exceed the limit
          if (prev.images.length >= maxImages) {
            return prev;
          }
          return {
            ...prev,
            images: [...prev.images, imageUrl],
          };
        });
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    e.target.value = "";
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...formData.images];
    const draggedImage = newImages[draggedIndex];

    // Remove the dragged image from its original position
    newImages.splice(draggedIndex, 1);

    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedImage);

    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleBackClick = () => {
    // Use browser back to return to wherever user came from, but replace current edit page
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback: if no history, go to garage
      router.replace("/garage");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this would be an API call
      console.log("Updating car:", formData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use replace instead of push to remove edit page from history
      router.replace(`/garage/${carId}`);
    } catch (error) {
      console.error("Error updating car:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this car? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        console.log("Deleting car:", carId);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Redirect to garage
        router.push("/garage");
      } catch (error) {
        console.error("Error deleting car:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Car</h1>
              <p className="text-muted-foreground">
                Update your {car.year} {car.brand} {car.model}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Car Images */}
            <Card>
              <CardHeader>
                <CardTitle>Car Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Images */}
                {formData.images.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {formData.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative group overflow-hidden rounded-lg border cursor-move transition-all ${
                          draggedIndex === index
                            ? "opacity-50 scale-95 rotate-2"
                            : "hover:shadow-lg"
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="relative aspect-square">
                          {failedImages.has(imageUrl) ? (
                            <div className="aspect-square bg-muted flex items-center justify-center">
                              <Camera className="h-12 w-12 text-muted-foreground" />
                            </div>
                          ) : (
                            <Image
                              src={imageUrl}
                              alt={`Car image ${index + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              onError={() => handleImageError(imageUrl)}
                            />
                          )}

                          {/* Drag handle */}
                          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4" />
                          </div>

                          {/* Delete button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteImage(imageUrl)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          {/* Main image indicator */}
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                              Main Image
                            </div>
                          )}

                          {/* Image number */}
                          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No images uploaded yet
                    </p>
                  </div>
                )}

                {/* Upload new images */}
                <div className="space-y-2">
                  <Label htmlFor="image-upload">
                    Add Images ({formData.images.length}/10)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                      disabled={formData.images.length >= 10}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={formData.images.length >= 10}
                    >
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can upload up to 10 images. Drag and drop images to
                    reorder them. The first image will be used as the main
                    image.
                    {formData.images.length >= 10 && " Maximum images reached."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Car Information */}
            <Card>
              <CardHeader>
                <CardTitle>Car Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      placeholder="e.g., Toyota, Honda, Mazda"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      placeholder="e.g., Supra, Civic, RX-7"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) =>
                        handleInputChange("year", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engine Details */}
            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="engine-details">
                    <AccordionTrigger>Engine Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Engine Code</Label>
                            <Input
                              value={formData.engine.engine_code}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  engine: {
                                    ...prev.engine,
                                    engine_code: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., 2JZ-GTE"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Displacement</Label>
                            <Input
                              value={formData.engine.displacement}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  engine: {
                                    ...prev.engine,
                                    displacement: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., 3.0L"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Aspiration</Label>
                            <Input
                              value={formData.engine.aspiration}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  engine: {
                                    ...prev.engine,
                                    aspiration: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., twin turbo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Power (HP)</Label>
                            <Input
                              type="number"
                              value={formData.engine.power_hp}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  engine: {
                                    ...prev.engine,
                                    power_hp: Number(e.target.value),
                                  },
                                }))
                              }
                              placeholder="e.g., 320"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Torque (Nm)</Label>
                            <Input
                              type="number"
                              value={formData.engine.torque_nm}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  engine: {
                                    ...prev.engine,
                                    torque_nm: Number(e.target.value),
                                  },
                                }))
                              }
                              placeholder="e.g., 407"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Engine Modifications */}
            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="engine-modifications">
                    <AccordionTrigger>Engine Modifications</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Turbo */}
                        <div className="space-y-2">
                          <Label>Turbo</Label>
                          <Input
                            value={
                              formData.engine.modifications?.turbo?.brand || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    turbo: {
                                      ...prev.engine.modifications?.turbo,
                                      brand: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Garrett GT2860"
                          />
                        </div>
                        {/* Supercharger */}
                        <div className="space-y-2">
                          <Label>Supercharger</Label>
                          <Input
                            value={
                              formData.engine.modifications?.supercharger
                                ?.brand || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    supercharger: {
                                      ...prev.engine.modifications
                                        ?.supercharger,
                                      brand: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Eaton M90"
                          />
                        </div>
                        {/* Intercooler */}
                        <div className="space-y-2">
                          <Label>Intercooler</Label>
                          <Input
                            value={
                              formData.engine.modifications?.intercooler
                                ?.brand || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    intercooler: {
                                      ...prev.engine.modifications?.intercooler,
                                      brand: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Mishimoto top mount"
                          />
                        </div>
                        {/* Exhaust Header */}
                        <div className="space-y-2">
                          <Label>Exhaust Header</Label>
                          <Input
                            value={
                              formData.engine.modifications?.exhaust?.header ||
                              ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    exhaust: {
                                      ...prev.engine.modifications?.exhaust,
                                      header: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., OEM header"
                          />
                        </div>
                        {/* Exhaust Catback */}
                        <div className="space-y-2">
                          <Label>Exhaust Catback</Label>
                          <Input
                            value={
                              formData.engine.modifications?.exhaust?.catback ||
                              ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    exhaust: {
                                      ...prev.engine.modifications?.exhaust,
                                      catback: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Magnaflow catback"
                          />
                        </div>
                        {/* Intake */}
                        <div className="space-y-2">
                          <Label>Intake</Label>
                          <Input
                            value={
                              formData.engine.modifications?.intake?.brand || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    intake: {
                                      ...prev.engine.modifications?.intake,
                                      brand: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., AEM intake"
                          />
                        </div>
                        {/* ECU */}
                        <div className="space-y-2">
                          <Label>ECU</Label>
                          <Input
                            value={
                              formData.engine.modifications?.ecu?.brand || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    ecu: {
                                      ...prev.engine.modifications?.ecu,
                                      brand: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Haltech Elite 1500"
                          />
                        </div>
                        {/* ECU Tuned By */}
                        <div className="space-y-2">
                          <Label>ECU Tuned By</Label>
                          <Input
                            value={
                              formData.engine.modifications?.ecu?.tuned_by || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    ecu: {
                                      ...prev.engine.modifications?.ecu,
                                      tuned_by: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Performance Tuning"
                          />
                        </div>
                        {/* Internals Header */}
                        <div className="col-span-3">
                          <h4 className="font-medium mt-4 mb-2">Internals</h4>
                        </div>
                        {/* Internals Inputs */}
                        <div className="space-y-2">
                          <Label>Pistons</Label>
                          <Input
                            value={
                              formData.engine.modifications?.internals
                                ?.pistons || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    internals: {
                                      ...prev.engine.modifications?.internals,
                                      pistons: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., OEM pistons"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rods</Label>
                          <Input
                            value={
                              formData.engine.modifications?.internals?.rods ||
                              ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    internals: {
                                      ...prev.engine.modifications?.internals,
                                      rods: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., OEM rods"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valves</Label>
                          <Input
                            value={
                              formData.engine.modifications?.internals
                                ?.valves || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    internals: {
                                      ...prev.engine.modifications?.internals,
                                      valves: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., OEM valves"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Springs</Label>
                          <Input
                            value={
                              formData.engine.modifications?.internals
                                ?.springs || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    internals: {
                                      ...prev.engine.modifications?.internals,
                                      springs: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Upgraded springs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cams</Label>
                          <Input
                            value={
                              formData.engine.modifications?.internals?.cams ||
                              ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    internals: {
                                      ...prev.engine.modifications?.internals,
                                      cams: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Upgraded cams"
                          />
                        </div>
                        {/* Fuel System Header */}
                        <div className="col-span-3">
                          <h4 className="font-medium mt-4 mb-2">Fuel System</h4>
                        </div>
                        {/* Fuel System Inputs */}
                        <div className="space-y-2">
                          <Label>Injectors</Label>
                          <Input
                            value={
                              formData.engine.modifications?.fuel_system
                                ?.injectors || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    fuel_system: {
                                      ...prev.engine.modifications?.fuel_system,
                                      injectors: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Bosch 440cc injectors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Pump</Label>
                          <Input
                            value={
                              formData.engine.modifications?.fuel_system
                                ?.fuel_pump || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    fuel_system: {
                                      ...prev.engine.modifications?.fuel_system,
                                      fuel_pump: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., Deatschwerks fuel pump"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Rail</Label>
                          <Input
                            value={
                              formData.engine.modifications?.fuel_system
                                ?.fuel_rail || ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                engine: {
                                  ...prev.engine,
                                  modifications: {
                                    ...prev.engine.modifications,
                                    fuel_system: {
                                      ...prev.engine.modifications?.fuel_system,
                                      fuel_rail: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            placeholder="e.g., OEM fuel rail"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Brakes */}

            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="brakes-details">
                    <AccordionTrigger>Brakes</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Front Brakes</h4>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Caliper</Label>
                              <Input
                                value={formData.brakes.front.caliper}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    brakes: {
                                      ...prev.brakes,
                                      front: {
                                        ...prev.brakes.front,
                                        caliper: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="e.g., Brembo 6-pot"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Disc Size</Label>
                              <Input
                                value={formData.brakes.front.disc_size}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    brakes: {
                                      ...prev.brakes,
                                      front: {
                                        ...prev.brakes.front,
                                        disc_size: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="e.g., 355mm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Disc Type</Label>
                              <Input
                                value={formData.brakes.front.disc_type}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    brakes: {
                                      ...prev.brakes,
                                      front: {
                                        ...prev.brakes.front,
                                        disc_type: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="e.g., vented/drilled"
                              />
                            </div>
                          </div>
                          <div className="space-y-2 mt-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Pads</Label>
                                <Input
                                  value={formData.brakes.front.pads}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      brakes: {
                                        ...prev.brakes,
                                        front: {
                                          ...prev.brakes.front,
                                          pads: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="e.g., Project Mu Club Racer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div>
                          <h4 className="font-medium mb-2">Rear Brakes</h4>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Caliper</Label>
                              <Input
                                value={formData.brakes.rear.caliper}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    brakes: {
                                      ...prev.brakes,
                                      rear: {
                                        ...prev.brakes.rear,
                                        caliper: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="e.g., Brembo 4-pot"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Disc Size</Label>
                              <Input
                                value={formData.brakes.rear.disc_size}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    brakes: {
                                      ...prev.brakes,
                                      rear: {
                                        ...prev.brakes.rear,
                                        disc_size: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="e.g., 330mm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Disc Type</Label>
                              <Input
                                value={formData.brakes.rear.disc_type}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    brakes: {
                                      ...prev.brakes,
                                      rear: {
                                        ...prev.brakes.rear,
                                        disc_type: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="e.g., vented/drilled"
                              />
                            </div>
                          </div>
                          <div className="space-y-2 mt-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Pads</Label>
                                <Input
                                  value={formData.brakes.rear.pads}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      brakes: {
                                        ...prev.brakes,
                                        rear: {
                                          ...prev.brakes.rear,
                                          pads: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="e.g., Project Mu Club Racer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Brake Lines</Label>
                            <Input
                              value={formData.brakes.brake_lines}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  brakes: {
                                    ...prev.brakes,
                                    brake_lines: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., stainless steel braided"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Master Cylinder</Label>
                            <Input
                              value={formData.brakes.master_cylinder}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  brakes: {
                                    ...prev.brakes,
                                    master_cylinder: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., Brembo upgraded"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Suspension Details */}
            <Card>
              {" "}
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="suspension-details">
                    <AccordionTrigger>Suspension Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="suspension">Suspension Type</Label>
                        <Select
                          value={formData.suspension_type}
                          onValueChange={(value) =>
                            handleInputChange("suspension_type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select suspension type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="air suspension">
                              Air Suspension
                            </SelectItem>
                            <SelectItem value="coilovers">Coilovers</SelectItem>
                            <SelectItem value="lowering springs">
                              Lowering Springs
                            </SelectItem>
                            <SelectItem value="stock">Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Front Suspension</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Brand</Label>
                            <Input
                              value={formData.suspension.front.brand}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    front: {
                                      ...prev.suspension.front,
                                      brand: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., BC Racing"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Model</Label>
                            <Input
                              value={formData.suspension.front.model}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    front: {
                                      ...prev.suspension.front,
                                      model: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., BR Series"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Spring Rate</Label>
                            <Input
                              value={formData.suspension.front.spring_rate}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    front: {
                                      ...prev.suspension.front,
                                      spring_rate: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 8K"
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3 mt-4">
                          <div className="space-y-2">
                            <Label>Camber</Label>
                            <Input
                              type="number"
                              value={formData.suspension.front.camber}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    front: {
                                      ...prev.suspension.front,
                                      camber: Number(e.target.value),
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., -3.2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Toe</Label>
                            <Input
                              value={formData.suspension.front.toe}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    front: {
                                      ...prev.suspension.front,
                                      toe: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 0.5°"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Caster</Label>
                            <Input
                              value={formData.suspension.front.caster}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    front: {
                                      ...prev.suspension.front,
                                      caster: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 6.2°"
                            />
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="font-medium mb-2">Rear Suspension</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Brand</Label>
                            <Input
                              value={formData.suspension.rear.brand}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    rear: {
                                      ...prev.suspension.rear,
                                      brand: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., BC Racing"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Model</Label>
                            <Input
                              value={formData.suspension.rear.model}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    rear: {
                                      ...prev.suspension.rear,
                                      model: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., BR Series"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Spring Rate</Label>
                            <Input
                              value={formData.suspension.rear.spring_rate}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    rear: {
                                      ...prev.suspension.rear,
                                      spring_rate: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 6K"
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3 mt-4">
                          <div className="space-y-2">
                            <Label>Camber</Label>
                            <Input
                              type="number"
                              value={formData.suspension.rear.camber}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    rear: {
                                      ...prev.suspension.rear,
                                      camber: Number(e.target.value),
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., -2.8"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Toe</Label>
                            <Input
                              value={formData.suspension.rear.toe}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    rear: {
                                      ...prev.suspension.rear,
                                      toe: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 0.2°"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Caster</Label>
                            <Input
                              value={formData.suspension.rear.caster}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  suspension: {
                                    ...prev.suspension,
                                    rear: {
                                      ...prev.suspension.rear,
                                      caster: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 6.2°"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Wheel Specifications */}
            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="wheel-specifications">
                    <AccordionTrigger>Wheel Specifications</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        {/* Front Wheels */}
                        <div>
                          <h4 className="font-medium mb-3">Front Wheels</h4>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Brand</Label>
                              <Input
                                value={formData.wheel_specs.front.brand}
                                onChange={(e) =>
                                  handleWheelSpecChange(
                                    "front",
                                    "brand",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Rays, Work, BBS"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Size</Label>
                              <Input
                                value={formData.wheel_specs.front.size}
                                onChange={(e) =>
                                  handleWheelSpecChange(
                                    "front",
                                    "size",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 18x9.5"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Offset</Label>
                              <Input
                                value={formData.wheel_specs.front.offset}
                                onChange={(e) =>
                                  handleWheelSpecChange(
                                    "front",
                                    "offset",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., +22"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Rear Wheels */}
                        <div>
                          <h4 className="font-medium mb-3">Rear Wheels</h4>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Brand</Label>
                              <Input
                                value={formData.wheel_specs.rear.brand}
                                onChange={(e) =>
                                  handleWheelSpecChange(
                                    "rear",
                                    "brand",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Rays, Work, BBS"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Size</Label>
                              <Input
                                value={formData.wheel_specs.rear.size}
                                onChange={(e) =>
                                  handleWheelSpecChange(
                                    "rear",
                                    "size",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 18x10.5"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Offset</Label>
                              <Input
                                value={formData.wheel_specs.rear.offset}
                                onChange={(e) =>
                                  handleWheelSpecChange(
                                    "rear",
                                    "offset",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., +15"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Tire Specifications */}
            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tire-specifications">
                    <AccordionTrigger>Tire Specifications</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="front-tires">Front Tires</Label>
                          <Input
                            id="front-tires"
                            value={formData.tire_specs.front}
                            onChange={(e) =>
                              handleTireSpecChange("front", e.target.value)
                            }
                            placeholder="e.g., 265/35R18"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rear-tires">Rear Tires</Label>
                          <Input
                            id="rear-tires"
                            value={formData.tire_specs.rear}
                            onChange={(e) =>
                              handleTireSpecChange("rear", e.target.value)
                            }
                            placeholder="e.g., 295/30R18"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Exterior Details */}

            <Card>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="exterior-details">
                    <AccordionTrigger>Exterior Details</AccordionTrigger>
                    <AccordionContent>
                      <div>
                        <h4 className="font-medium mb-2">Body Kit</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Front Bumper</Label>
                            <Input
                              value={formData.exterior.body_kit.front_bumper}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    body_kit: {
                                      ...prev.exterior.body_kit,
                                      front_bumper: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Ridox"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rear Bumper</Label>
                            <Input
                              value={formData.exterior.body_kit.rear_bumper}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    body_kit: {
                                      ...prev.exterior.body_kit,
                                      rear_bumper: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Ridox"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Side Skirts</Label>
                            <Input
                              value={formData.exterior.body_kit.side_skirts}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    body_kit: {
                                      ...prev.exterior.body_kit,
                                      side_skirts: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Ridox"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rear Wing</Label>
                            <Input
                              value={formData.exterior.body_kit.rear_wing}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    body_kit: {
                                      ...prev.exterior.body_kit,
                                      rear_wing: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., custom carbon GT wing"
                            />
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="font-medium mb-2">Paint & Lighting</h4>
                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Paint Color</Label>
                            <Input
                              value={formData.exterior.paint.color}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    paint: {
                                      ...prev.exterior.paint,
                                      color: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Renaissance Red"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Paint Type</Label>
                            <Input
                              value={formData.exterior.paint.type}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    paint: {
                                      ...prev.exterior.paint,
                                      type: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., factory"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Finish</Label>
                            <Input
                              value={formData.exterior.paint.finish}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    paint: {
                                      ...prev.exterior.paint,
                                      finish: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., metallic"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Headlights</Label>
                            <Input
                              value={formData.exterior.lighting.headlights}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    lighting: {
                                      ...prev.exterior.lighting,
                                      headlights: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., pop-up LED conversion"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Taillights</Label>
                            <Input
                              value={formData.exterior.lighting.taillights}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    lighting: {
                                      ...prev.exterior.lighting,
                                      taillights: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., clear LED"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Indicators</Label>
                            <Input
                              value={formData.exterior.lighting.indicators}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  exterior: {
                                    ...prev.exterior,
                                    lighting: {
                                      ...prev.exterior.lighting,
                                      indicators: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., clear"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Interior Details */}

            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="interior-details">
                    <AccordionTrigger>Interior Details</AccordionTrigger>
                    <AccordionContent>
                      {/* Seats Section */}
                      <div>
                        <h4 className="font-medium mb-2">Seats</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Front Seats</Label>
                            <Input
                              value={formData.interior?.seats?.front || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    seats: {
                                      ...prev.interior?.seats,
                                      front: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Recaro bucket"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rear Seats</Label>
                            <Input
                              value={formData.interior?.seats?.rear || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    seats: {
                                      ...prev.interior?.seats,
                                      rear: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., removed"
                            />
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      {/* Gauges Section */}
                      <div>
                        <h4 className="font-medium mb-2">Gauges</h4>
                        <div className="space-y-2">
                          {(formData.interior?.gauges || []).map(
                            (gauge, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={gauge}
                                  onChange={(e) => {
                                    const newGauges = [
                                      ...(formData.interior?.gauges || []),
                                    ];
                                    newGauges[idx] = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      interior: {
                                        ...prev.interior,
                                        gauges: newGauges,
                                      },
                                    }));
                                  }}
                                  placeholder="e.g., Defi Link Meter BF"
                                />
                                {idx !== 0 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        interior: {
                                          ...prev.interior,
                                          gauges: (
                                            prev.interior?.gauges || []
                                          ).filter((_, i) => i !== idx),
                                        },
                                      }));
                                    }}
                                    aria-label="Remove Gauge"
                                  >
                                    &times;
                                  </Button>
                                )}
                              </div>
                            )
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                interior: {
                                  ...prev.interior,
                                  gauges: [
                                    ...(prev.interior?.gauges || []),
                                    "",
                                  ],
                                },
                              }));
                            }}
                          >
                            Add Gauge
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      {/* Other Interior Section */}
                      <div>
                        <h4 className="font-medium mb-2">Other Interior</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Steering Wheel Brand */}
                          <div className="space-y-2">
                            <Label>Steering Wheel Brand</Label>
                            <Input
                              value={
                                formData.interior?.steering_wheel?.brand || ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    steering_wheel: {
                                      ...prev.interior?.steering_wheel,
                                      brand: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., MOMO"
                            />
                          </div>
                          {/* Steering Wheel Model */}
                          <div className="space-y-2">
                            <Label>Steering Wheel Model</Label>
                            <Input
                              value={
                                formData.interior?.steering_wheel?.model || ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    steering_wheel: {
                                      ...prev.interior?.steering_wheel,
                                      model: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Race"
                            />
                          </div>
                          {/* Steering Wheel Size */}
                          <div className="space-y-2">
                            <Label>Steering Wheel Size</Label>
                            <Input
                              value={
                                formData.interior?.steering_wheel?.size || ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    steering_wheel: {
                                      ...prev.interior?.steering_wheel,
                                      size: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., 350mm"
                            />
                          </div>
                          {/* Roll Cage */}
                          <div className="space-y-2">
                            <Label>Roll Cage</Label>
                            <Input
                              value={
                                formData.interior?.roll_cage?.material || ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    roll_cage: {
                                      ...prev.interior?.roll_cage,
                                      material: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Custom"
                            />
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      {/* Audio Section */}
                      <div>
                        <h4 className="font-medium mb-2">Audio</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Head Unit</Label>
                            <Input
                              value={formData.interior?.audio?.head_unit || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    audio: {
                                      ...prev.interior?.audio,
                                      head_unit: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Sony"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Speakers</Label>
                            <Input
                              value={formData.interior?.audio?.speakers || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    audio: {
                                      ...prev.interior?.audio,
                                      speakers: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Zero Flex Speakers"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subwoofer</Label>
                            <Input
                              value={formData.interior?.audio?.subwoofer || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  interior: {
                                    ...prev.interior,
                                    audio: {
                                      ...prev.interior?.audio,
                                      subwoofer: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="e.g., Yamaha"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Performance Modifications */}
            <Card>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="performance-modifications">
                    <AccordionTrigger>
                      Performance Modifications
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Weight Reduction</Label>
                          <Input
                            value={
                              formData.performance_mods.weight_reduction.join(
                                ", "
                              ) ?? ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                performance_mods: {
                                  ...prev.performance_mods,
                                  weight_reduction: e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                },
                              }))
                            }
                            placeholder="e.g., air con removed, rear seat delete"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Aero</Label>
                          <Input
                            value={
                              formData.performance_mods.aero.join(", ") ?? ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                performance_mods: {
                                  ...prev.performance_mods,
                                  aero: e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                },
                              }))
                            }
                            placeholder="e.g., front splitter, rear diffuser"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Chassis</Label>
                          <Input
                            value={
                              formData.performance_mods.chassis.join(", ") ?? ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                performance_mods: {
                                  ...prev.performance_mods,
                                  chassis: e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                },
                              }))
                            }
                            placeholder="e.g., seam welding, roll cage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cooling</Label>
                          <Input
                            value={
                              formData.performance_mods.cooling.join(", ") ?? ""
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                performance_mods: {
                                  ...prev.performance_mods,
                                  cooling: e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                },
                              }))
                            }
                            placeholder="e.g., STI radiator, oil cooler"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Car
              </Button>

              <div className="flex space-x-4">
                <Link href={`/garage/${carId}`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
