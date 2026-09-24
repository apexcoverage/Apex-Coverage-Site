import { requireEmployeeSession } from "@/lib/internalAuth";
import QuotesDashboard from "@/components/quotes/QuotesDashboard";

export default function AgentQuotesPage() {
  const session = requireEmployeeSession("/agent/quotes");
  return <QuotesDashboard currentUser={session.user} />;
}
