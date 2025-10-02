import Link from "next/link";
import { Car, Mail, Shield, FileText, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Car className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Car Scene NZ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting car enthusiasts across New Zealand. Share your
                passion, discover events, and build lasting connections in the
                car community.
              </p>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Explore</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/events"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/garage"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cars
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clubs"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clubs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/leaderboards"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Leaderboards
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Search
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Community</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/garage/create"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Add Your Car
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events/create"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Create Event
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clubs"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Join a Club
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Join Community
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Support & Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@carscene.co.nz"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Support Email
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Car Scene NZ</span>
            </div>

            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-muted-foreground">
              <p>© {currentYear} Car Scene NZ. All rights reserved.</p>
              <p>Connecting the car community across New Zealand.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
