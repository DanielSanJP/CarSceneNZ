import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";
import { getUserCars } from "@/lib/server/cars";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

// Cache for 2 minutes since user's garage doesn't change frequently
export const revalidate = 120;

export default async function MyGaragePage() {
  // Server-side auth check - this will redirect if not authenticated
  const user = await getUser();

  // Fetch user's cars using optimized cached function
  const userCars = await getUserCars(user.id);

  return <MyGarageView cars={userCars} />;
}
