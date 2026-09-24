import { requireEmployeeSession } from "@/lib/internalAuth";
import AutoQuoteForm from "@/components/quotes/AutoQuoteForm";

export const dynamic = "force-dynamic";

export default function NewAutoQuotePage() {
  requireEmployeeSession("/agent/quotes/new/auto");
  return <AutoQuoteForm />;
}
