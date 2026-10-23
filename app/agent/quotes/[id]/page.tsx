import { requireEmployeeSession } from "@/lib/internalAuth";
import QuoteReview from "@/components/quotes/QuoteReview";

export const dynamic = "force-dynamic";

export default async function QuoteReviewPage({ params }: { params: { id: string } }) {
  await requireEmployeeSession(`/agent/quotes/${params.id}`);
  return <QuoteReview quoteId={params.id} />;
}
