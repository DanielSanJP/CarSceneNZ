import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/nav";
import { Calendar, Car, Users, Trophy } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <Badge variant="secondary" className="mb-4">
            Connecting NZ Car Enthusiasts
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground">
            Strengthen the Car
            <br />
            <span className="text-primary">Community</span> in NZ
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover car meets, showcase your ride, join clubs, and connect with
            fellow car enthusiasts across New Zealand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg" className="text-lg px-8">
                Explore Events
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Join Community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From finding the next car meet to showcasing your build, Car Scene
            NZ has all the tools to connect with the community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Find Events</CardTitle>
              <CardDescription>
                Discover car meets and events happening across New Zealand
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Car className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Showcase Cars</CardTitle>
              <CardDescription>
                Build your virtual garage and show off your rides to the
                community
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Join Clubs</CardTitle>
              <CardDescription>
                Connect with like-minded enthusiasts and build lasting
                friendships
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Compete</CardTitle>
              <CardDescription>
                Participate in leaderboards and showcase the best builds in NZ
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className=" border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Car className="h-6 w-6" />
              <span className="font-semibold">Car Scene NZ</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Car Scene NZ. Connecting the car community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
