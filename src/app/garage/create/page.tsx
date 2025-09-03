import { getUser } from "@/lib/auth";
import { CreateCarForm } from "@/components/garage";

export default async function CreateCarPage() {
  const user = await getUser();

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
