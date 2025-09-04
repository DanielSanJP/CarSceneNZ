import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OwnerDetailsProps {
  owner: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export function OwnerDetails({ owner }: OwnerDetailsProps) {
  return (
    <Link href={`/profile/${owner.username}`}>
      <Card className="transition-all hover:shadow-lg cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Owner Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-muted">
              {owner.profile_image_url ? (
                <Image
                  src={owner.profile_image_url}
                  alt={owner.display_name || owner.username}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={50}
                  priority={true}
                  unoptimized={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                  {(owner.display_name || owner.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg hover:underline">
                {owner.display_name || owner.username}
              </h3>
              <p className="text-muted-foreground">@{owner.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
