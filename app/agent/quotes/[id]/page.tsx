import { requireEmployeeSession } from "@/lib/internalAuth";
import QuoteReview from "@/components/quotes/QuoteReview";

export const dynamic = "force-dynamic";

export default function QuoteReviewPage({ params }: { params: { id: string } }) {
  requireEmployeeSession(`/agent/quotes/${params.id}`);
  return <QuoteReview quoteId={params.id} />;
}
