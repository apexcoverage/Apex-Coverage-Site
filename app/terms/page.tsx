import Link from "next/link";

export const metadata = {
  title: "Terms | Apex Coverage",
  description: "Terms for using the Apex Coverage website and customer forms.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="border-b bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <span className="text-sm font-semibold tracking-wide text-[#cc0000]">
            TERMS
          </span>
          <h1 className="mt-2 text-4xl font-bold">Website Terms</h1>
          <p className="mt-4 text-gray-600">
            These terms explain the basic rules for using Apex Coverage website
            forms, status tools, and document upload tools.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-4 py-12 leading-7 text-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">No Automatic Approval</h2>
          <p className="mt-3">
            Submitting a build review, auto coverage review, claim form, status
            lookup, or document upload does not guarantee coverage, approval,
            pricing, claim payment, or policy changes.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accurate Information</h2>
          <p className="mt-3">
            You agree to provide accurate information and update Apex if
            anything changes. Coverage options may depend on vehicle details,
            title status, mileage, documentation, use, location, and other
            review factors.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Uploads</h2>
          <p className="mt-3">
            Use the document upload page only when an Apex agent asks for files
            or when you are providing records tied to an active review or claim.
            Do not upload documents you are not authorized to share.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Website Availability</h2>
          <p className="mt-3">
            Apex may update, pause, or change website features at any time.
            If a form is unavailable, contact support directly.
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <h2 className="text-xl font-bold text-gray-900">Related Pages</h2>
          <p className="mt-2">
            Review our{" "}
            <Link className="font-semibold text-[#cc0000]" href="/privacy">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link className="font-semibold text-[#cc0000]" href="/legal">
              Legal Information
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
