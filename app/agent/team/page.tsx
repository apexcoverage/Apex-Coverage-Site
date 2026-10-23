import { redirect } from "next/navigation";
import { requireEmployeeSession } from "@/lib/internalAuth";
import TeamManager from "@/components/agent/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireEmployeeSession("/agent/team");
  if (session.user.role !== "ADMIN") redirect("/agent");
  return <TeamManager currentEmail={session.user.email} />;
}
