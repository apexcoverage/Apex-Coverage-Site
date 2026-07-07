import Link from "next/link";

export const metadata = {
  title: "Legal Information | Apex Coverage",
  description: "Important coverage review and modified vehicle protection disclaimers.",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="border-b bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <span className="text-sm font-semibold tracking-wide text-[#cc0000]">
            LEGAL
          </span>
          <h1 className="mt-2 text-4xl font-bold">Legal Information</h1>
          <p className="mt-4 text-gray-600">
            Apex Coverage helps customers review modified vehicle protection and
            auto coverage options. Final availability depends on review,
            documentation, underwriting, location, and program rules.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-4 py-12 leading-7 text-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coverage Is Not Bound Online</h2>
          <p className="mt-3">
            Website forms start a review. They do not bind coverage, change
            active coverage, guarantee payment, or confirm eligibility. An Apex
            agent will confirm next steps with the customer.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Build Review Limits</h2>
          <p className="mt-3">
            Modified vehicle protection may require receipts, install records,
            photos, mileage details, VIN details, title information, and
            confirmation that parts were installed correctly. Some vehicles,
            uses, locations, or modifications may not qualify.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Claims</h2>
          <p className="mt-3">
            Claim submission confirms that Apex received information for review.
            Claim outcomes depend on active coverage, documentation, facts of
            loss, exclusions, deductibles, and any applicable partner review.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">No Legal Advice</h2>
          <p className="mt-3">
            Website content is informational and should not be treated as legal,
            tax, financial, or coverage advice for a specific situation.
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <h2 className="text-xl font-bold text-gray-900">Need Help?</h2>
          <p className="mt-2">
            Contact{" "}
            <a className="font-semibold text-[#cc0000]" href="mailto:support@driveapexcoverage.com">
              support@driveapexcoverage.com
            </a>{" "}
            or start with{" "}
            <Link className="font-semibold text-[#cc0000]" href="/how-it-works">
              How It Works
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
