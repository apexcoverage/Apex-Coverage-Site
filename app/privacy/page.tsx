import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Apex Coverage",
  description: "How Apex Coverage collects, uses, and protects customer information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="border-b bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <span className="text-sm font-semibold tracking-wide text-[#cc0000]">
            PRIVACY
          </span>
          <h1 className="mt-2 text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-4 text-gray-600">
            Apex Coverage collects only the information needed to review your
            coverage request, help you submit documents, communicate with you,
            and support active customers.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-4 py-12 leading-7 text-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
          <p className="mt-3">
            We may collect your name, contact information, vehicle details,
            build details, uploaded documents, claim details, and messages you
            send through our website or while speaking with an Apex agent.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">How We Use It</h2>
          <p className="mt-3">
            We use customer information to review eligibility, prepare coverage
            options, contact you about next steps, process document uploads,
            support active coverage, and improve Apex workflows.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sharing</h2>
          <p className="mt-3">
            We may share information with trusted service providers, coverage
            partners, payment processors, or support teams when needed to serve
            your request. We do not sell customer information.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security</h2>
          <p className="mt-3">
            We use reasonable safeguards to protect information submitted to
            Apex. No online system is perfect, so please avoid sending sensitive
            documents unless an Apex agent requests them.
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <h2 className="text-xl font-bold text-gray-900">Questions</h2>
          <p className="mt-2">
            Contact Apex at{" "}
            <a className="font-semibold text-[#cc0000]" href="mailto:support@driveapexcoverage.com">
              support@driveapexcoverage.com
            </a>{" "}
            or review the{" "}
            <Link className="font-semibold text-[#cc0000]" href="/terms">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="font-semibold text-[#cc0000]" href="/legal">
              Legal
            </Link>{" "}
            pages.
          </p>
        </div>
      </section>
    </main>
  );
}
