import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

export default async function MyGaragePage() {
  // Server-side auth check - this will redirect if not authenticated
  await getUser();

  return <MyGarageView />;
}
