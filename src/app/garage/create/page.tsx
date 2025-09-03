import { getCurrentUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { CreateCarForm } from "@/components/garage";

export default async function CreateCarPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CreateCarForm user={user} />
        </div>
      </div>
    </div>
  );
}
