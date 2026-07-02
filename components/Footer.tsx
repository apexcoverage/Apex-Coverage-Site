import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded" style={{ background: '#cc0000' }} />
            <span className="font-semibold text-white">Apex Coverage</span>
          </Link>

          <p className="mt-3 text-sm">
            For those who drive, not just commute.
          </p>
        </div>

        <div>
          <div className="font-semibold text-white">Protection</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/build-review" className="hover:text-white">
                Build Review
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-white">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/tiers" className="hover:text-white">
                Coverage Tiers
              </Link>
            </li>
            <li>
              <Link href="/quote" className="hover:text-white">
                Auto Coverage
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-white">Support</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/claims" className="hover:text-white">
                File a Claim
              </Link>
            </li>
            <li>
              <a href="mailto:support@driveapexcoverage.com" className="hover:text-white">
                Help Center
              </a>
            </li>
            <li>
              <a href="mailto:claims@driveapexcoverage.com" className="hover:text-white">
                Claims Support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-white">Contact</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="tel:+15406990505" className="hover:text-white">
                (540) 699-0505
              </a>
            </li>
            <li>
              <a href="mailto:support@driveapexcoverage.com" className="hover:text-white">
                support@driveapexcoverage.com
              </a>
            </li>
            <li>Richmond, VA</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Apex Coverage. All rights reserved. Coverage eligibility,
          pricing, deductibles, claims, and approved parts are subject to review, documentation,
          and final approval.
          <Link href="/privacy" className="underline ml-2 hover:text-white">
            Privacy
          </Link>{' '}
          •{' '}
          <Link href="/terms" className="underline hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
