import { redirect } from "next/navigation";
import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/dal";
import { getCarsByOwner } from "@/lib/server/cars";

export default async function MyGaragePage() {
  // Server-side auth check
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch data on server
  const userCars = await getCarsByOwner(user.id);

  return <MyGarageView cars={userCars} user={user} />;
}
