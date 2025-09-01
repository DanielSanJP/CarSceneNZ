"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BasicCarInfoData {
  brand: string;
  model: string;
  year: number | "";
}

interface BasicCarInfoProps {
  data: BasicCarInfoData;
  onChange: (updates: Partial<BasicCarInfoData>) => void;
  isLoading?: boolean;
}

export default function BasicCarInfo({
  data,
  onChange,
  isLoading,
}: BasicCarInfoProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleFieldChange = (
    field: keyof BasicCarInfoData,
    value: string | number
  ) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={data.brand}
              onChange={(e) => handleFieldChange("brand", e.target.value)}
              placeholder="e.g., Subaru"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={data.model}
              onChange={(e) => handleFieldChange("model", e.target.value)}
              placeholder="e.g., WRX STI"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={data.year.toString()}
              onValueChange={(value) =>
                handleFieldChange("year", parseInt(value))
              }
              disabled={isLoading}
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
  );
}
