'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/#coverages', label: 'Coverages' },
  { href: '/#why',       label: 'Why Apex' },
  { href: '/#reviews',   label: 'Reviews' },
  { href: '/about',      label: 'About' },
  { href: '/#faq',       label: 'FAQ' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      {/* top bar */}
      <div className="bg-black text-white text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span><span>Call for a FREE quote • Apex Coverage</span>
          </div>
          <a href="tel:+15406990505" className="hover:opacity-90">(540) 699-0505</a>
        </div>
      </div>

      {/* main nav */}
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded" style={{ background: '#cc0000' }} />
          <span className="font-semibold tracking-tight">
            Apex <span style={{ color: '#cc0000' }}>Coverage</span>
          </span>
        </Link>

        {/* desktop */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href === '/about' && pathname?.startsWith('/about'));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`hover:text-[#cc0000] ${active ? 'text-[#cc0000]' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="/quote"
            className="hidden sm:inline-flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
          >
            Get a Quote
          </a>
          {/* mobile toggle */}
          <button className="md:hidden p-2 border rounded-md" onClick={() => setOpen(!open)} aria-label="Open menu">
            ☰
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <ul className="max-w-7xl mx-auto px-4 py-2 text-sm">
            {NAV.map((item) => (
              <li key={item.href} className="py-2 border-b last:border-none">
                <Link href={item.href} onClick={() => setOpen(false)} className="block">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="py-2">
              <a href="/quote" onClick={() => setOpen(false)} className="block font-semibold text-[#cc0000]">Get a Quote</a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
