import { redirect } from "next/navigation";
import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/dal";

export default async function MyEventsPage() {
  // Server-side auth check
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return <MyEventsView />;
}
