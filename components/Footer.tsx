import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#020914] text-blue-50/75">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_.8fr_.8fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/brand/apex-logo.svg"
              alt="Apex Coverage shield logo"
              className="h-11 w-11"
            />
            <span className="leading-tight text-white">
              <span className="block text-sm font-black tracking-[0.22em]">
                APEX
              </span>
              <span className="block text-[11px] font-bold tracking-[0.28em] text-blue-300">
                COVERAGE
              </span>
            </span>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-6">
            Coverage guidance built around the vehicle you actually drive.
          </p>
        </div>

        <div>
          <div className="font-black text-white">Coverage</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/protect-more-than-stock" className="hover:text-white">
                Get My Quote
              </Link>
            </li>
            <li>
              <Link href="/build-review" className="hover:text-white">
                Protect My Build
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
          <div className="font-black text-white">Support</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/status" className="hover:text-white">
                Check Status
              </Link>
            </li>
            <li>
              <Link href="/document-upload" className="hover:text-white">
                Upload Documents
              </Link>
            </li>
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
          </ul>
        </div>

        <div>
          <div className="font-black text-white">Contact</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="tel:+18443982739" className="hover:text-white">
                844-398-2739
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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-blue-50/55 md:flex-row md:items-center md:justify-between">
          <p>
            Copyright {new Date().getFullYear()} Apex Coverage. All rights reserved.
            Coverage availability and options may vary by driver and state.
          </p>
          <span className="inline-flex gap-3">
            <Link href="/privacy" className="underline hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="underline hover:text-white">
              Terms
            </Link>
            <Link href="/legal" className="underline hover:text-white">
              Legal
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
