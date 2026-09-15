import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { Analytics } from "@/components/analytics/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return <Analytics />;
}
