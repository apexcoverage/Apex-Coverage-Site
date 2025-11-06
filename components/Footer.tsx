export default function Footer() {
  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded" style={{ background: '#cc0000' }} />
            <span className="font-semibold text-white">Apex Coverage</span>
          </div>
          <p className="mt-3 text-sm">For those who drive, not just commute.</p>
        </div>
        <div>
          <div className="font-semibold text-white">Company</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="/about">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="/press">Press</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white">Support</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#">Make a claim</a></li>
            <li><a href="#">Billing</a></li>
            <li><a href="#">Help center</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white">Contact</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>(540) 699-0505</li>
            <li>support@driveapexcoverage.com</li>
            <li>Richmond, VA</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Apex Coverage. All rights reserved. Policy forms and rates subject to final approval.
          <a href="#" className="underline ml-2">Privacy</a> • <a href="#" className="underline">Terms</a>
        </div>
      </div>
    </footer>
  );
}
