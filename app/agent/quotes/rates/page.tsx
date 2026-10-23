import { requireEmployeeSession } from "@/lib/internalAuth";
import RateAdmin from "@/components/quotes/RateAdmin";

export default async function QuoteRatesPage() {
  const session = await requireEmployeeSession("/agent/quotes/rates");
  return <RateAdmin currentUser={session.user} />;
}
