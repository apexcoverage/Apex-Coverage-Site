'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Modified Vehicle Protection' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/tiers', label: 'Tiers' },
  { href: '/quote', label: 'Auto Coverage' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      {/* top bar */}
      <div className="bg-black text-white text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Call for a FREE quote • Apex Coverage</span>
          </div>

          <a href="tel:+15406990505" className="hover:opacity-90 whitespace-nowrap">
            (540) 699-0505
          </a>
        </div>
      </div>

      {/* main nav */}
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="h-8 w-8 rounded" style={{ background: '#cc0000' }} />
          <span className="font-semibold tracking-tight">
            Apex <span style={{ color: '#cc0000' }}>Coverage</span>
          </span>
        </Link>

        {/* desktop */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((item) => {
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`hover:text-[#cc0000] ${
                    active ? 'text-[#cc0000] font-semibold' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/build-review"
            className="hidden sm:inline-flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
          >
            Get a Quote
          </Link>

          {/* mobile toggle */}
          <button
            className="md:hidden p-2 border rounded-md"
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <ul className="max-w-7xl mx-auto px-4 py-2 text-sm">
            {NAV.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href} className="py-2 border-b last:border-none">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block ${active ? 'text-[#cc0000] font-semibold' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li className="py-2">
              <Link
                href="/build-review"
                onClick={() => setOpen(false)}
                className="block font-semibold text-[#cc0000]"
              >
                Get a Quote
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
