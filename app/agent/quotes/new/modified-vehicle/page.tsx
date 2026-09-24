import { requireEmployeeSession } from "@/lib/internalAuth";
import ModifiedVehicleQuoteForm from "@/components/quotes/ModifiedVehicleQuoteForm";

export const dynamic = "force-dynamic";

export default function NewModifiedVehicleQuotePage() {
  requireEmployeeSession("/agent/quotes/new/modified-vehicle");
  return <ModifiedVehicleQuoteForm />;
}
