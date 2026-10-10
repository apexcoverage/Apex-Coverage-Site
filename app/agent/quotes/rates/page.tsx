import { requireEmployeeSession } from "@/lib/internalAuth";
import RateAdmin from "@/components/quotes/RateAdmin";

export default function QuoteRatesPage() {
  const session = requireEmployeeSession("/agent/quotes/rates");
  return <RateAdmin currentUser={session.user} />;
}
