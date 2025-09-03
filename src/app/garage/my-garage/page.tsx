import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";
import { getCarsByOwner } from "@/lib/server/cars";

export default async function MyGaragePage() {
  // Server-side auth check
  const user = await getUser();

  // Fetch data on server
  const userCars = await getCarsByOwner(user.id);

  return <MyGarageView cars={userCars} />;
}
