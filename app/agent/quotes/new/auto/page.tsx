import { requireEmployeeSession } from "@/lib/internalAuth";
import AutoQuoteForm from "@/components/quotes/AutoQuoteForm";

export const dynamic = "force-dynamic";

export default async function NewAutoQuotePage() {
  await requireEmployeeSession("/agent/quotes/new/auto");
  return <AutoQuoteForm />;
}
