"use client";

import { Navigation } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateClubForm } from "@/components/create-club-form";

export default function CreateClubPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/clubs">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Create Your Club</h1>
              <p className="text-muted-foreground">
                Build your community and connect with fellow car enthusiasts
              </p>
            </div>
          </div>

          <CreateClubForm />
        </div>
      </div>
    </div>
  );
}
