import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Apex Coverage",
  description:
    "How Apex Coverage collects, uses, shares, and protects customer information, including SMS consent details.",
};

const collectedInfo = [
  "Contact details such as name, phone number, email address, ZIP code, and mailing or garaging location when provided.",
  "Vehicle details such as year, make, model, VIN, mileage, title status, use, and build information.",
  "Coverage review details such as parts value, documentation, deductible preferences, claims history, driving history, and requested services.",
  "Files or records you choose to upload, including receipts, photos, invoices, maintenance records, claim documents, or other supporting material.",
  "Messages, notes, call details, form submissions, and customer support communications with Apex.",
  "Basic website and form information, such as submission source, timestamps, and technical data needed to operate and secure the website.",
];

const useCases = [
  "Respond to your request and contact you about build protection, auto coverage reviews, claims, document uploads, or customer support.",
  "Review eligibility, documentation, pricing factors, deductible options, and coverage fit.",
  "Prepare customer records, agent notes, status updates, and follow-up tasks.",
  "Process claims, billing support, policy service, document requests, and customer care communications.",
  "Improve Apex workflows, website forms, customer experience, fraud prevention, and operational security.",
  "Comply with applicable legal, regulatory, audit, carrier, payment, or business record obligations.",
];

const sharingExamples = [
  "Service providers that help us operate the website, customer support, email, text messaging, document handling, payments, analytics, or business systems.",
  "Coverage partners, claims support resources, payment processors, or business vendors when needed to review, service, or support your request.",
  "Government, legal, regulatory, or law-enforcement recipients if required by law or necessary to protect rights, safety, customers, or Apex operations.",
];

const smsTerms = [
  "The messaging program consists of general customer care messaging to answer questions and provide support to customers. Messages will be sent from (844) 398-2739.",
  "You can cancel the SMS service at any time. Just text STOP to the phone number from which you received messages. After you send the SMS message STOP to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us. If you want to join again, just sign up as you did the first time and we will start sending SMS messages to you again.",
  "If you are experiencing issues with the messaging program you can reply with the keyword HELP for more assistance, or you can get help directly at admin@driveapexcoverage.com.",
  "Carriers are not liable for delayed or undelivered messages.",
  "As always, message and data rates may apply for any messages sent to you from us and to us from you. Message frequency will vary based on communication needs. If you have any questions about your text plan or data plan, it is best to contact your wireless provider.",
  "If you have any questions regarding privacy, please read our privacy policy details contained in the rest of this page or contact us at admin@driveapexcoverage.com.",
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc0000]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

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
            Apex Coverage collects and uses customer information to review
            coverage requests, support active customers, communicate with you,
            process documents, and provide customer care. This policy explains
            what we collect, how we use it, when it may be shared, and how SMS
            consent is handled.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Last updated: September 20, 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-10 px-4 py-12 leading-7 text-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
          <p className="mt-3">
            We collect information that you provide directly, information needed
            to review or service your request, and limited technical information
            needed to operate the website and customer support process.
          </p>
          <BulletList items={collectedInfo} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">How We Use Information</h2>
          <p className="mt-3">
            Apex uses customer information for business purposes tied to your
            request, your account, or support needs.
          </p>
          <BulletList items={useCases} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Sharing</h2>
          <p className="mt-3">
            Customer data is not shared with 3rd parties for promotional or
            marketing purposes.
          </p>
          <p className="mt-3">
            Mobile opt-in and consent are never shared with anyone for any
            purpose. Any information sharing that may be mentioned elsewhere in
            this policy excludes mobile opt-in data.
          </p>
          <p className="mt-3">
            We may share other customer information only when needed to operate,
            review, service, support, or protect Apex, customers, and related
            business processes.
          </p>
          <BulletList items={sharingExamples} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMS Consent and Messaging</h2>
          <p className="mt-3">
            If you provide a mobile phone number and consent to be contacted,
            Apex may use SMS messaging for customer care, support, follow-up,
            status updates, and questions related to your request. Consent is
            not required for purchase.
          </p>
          <p className="mt-3">
            We do not sell, rent, or share mobile opt-in information or SMS
            consent data with anyone for promotional or marketing purposes.
          </p>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Messaging Program Terms and Conditions
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5">
            {smsTerms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cookies and Website Data</h2>
          <p className="mt-3">
            Apex may use basic website technologies to help forms function,
            understand website performance, prevent abuse, and improve customer
            experience. Browser settings may allow you to limit cookies or other
            storage, but some website features may not work properly if disabled.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
          <p className="mt-3">
            We keep customer information for as long as reasonably needed to
            respond to requests, support customer relationships, keep business
            records, comply with legal or operational requirements, resolve
            disputes, and protect Apex and customers.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security</h2>
          <p className="mt-3">
            We use reasonable administrative, technical, and organizational
            safeguards to protect information submitted to Apex. No online
            system is perfect, so please avoid sending sensitive documents unless
            an Apex agent requests them or they are needed for your review,
            claim, or customer support request.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Choices</h2>
          <p className="mt-3">
            You may contact Apex to ask questions about your information, update
            contact details, request support, or ask to stop certain
            communications. You may unsubscribe from SMS by replying STOP to the
            number that sent the message.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Policy Updates</h2>
          <p className="mt-3">
            Apex may update this Privacy Policy from time to time. Changes will
            be posted on this page with an updated date. Continued use of the
            website or Apex services after changes are posted means the updated
            policy applies going forward.
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-5">
          <h2 className="text-xl font-bold text-gray-900">Questions</h2>
          <p className="mt-2">
            Contact Apex at{" "}
            <a className="font-semibold text-[#cc0000]" href="mailto:admin@driveapexcoverage.com">
              admin@driveapexcoverage.com
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
