import { requireEmployeeSession } from "@/lib/internalAuth";
import QuotesDashboard from "@/components/quotes/QuotesDashboard";

export default async function AgentQuotesPage() {
  const session = await requireEmployeeSession("/agent/quotes");
  return <QuotesDashboard currentUser={session.user} />;
}
