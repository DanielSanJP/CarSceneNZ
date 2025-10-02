import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function ContactInfo() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Get in Touch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <a
            href="mailto:support@carscene.co.nz"
            className="text-lg font-semibold mb-2 text-primary hover:underline block"
          >
            support@carscene.co.nz
          </a>
          <p className="text-sm text-muted-foreground">
            We&apos;re here to help with any questions or support needs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
