import { redirect } from "next/navigation";
import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/dal";

export default async function MyGaragePage() {
  // Server-side auth check
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return <MyGarageView />;
}
