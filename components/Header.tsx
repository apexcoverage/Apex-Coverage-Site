'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/build-review', label: 'Build Protection' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/tiers', label: 'Tiers' },
  { href: '/quote', label: 'Auto Coverage' },
  { href: '/status', label: 'Status' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#031326]/95 text-white shadow-[0_18px_45px_rgba(2,6,23,.25)] backdrop-blur">
      <div className="border-b border-white/10 bg-[#020914] text-xs sm:text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-2 text-white/85">
            <span className="font-black text-white">Apex Coverage</span>
            <span className="hidden sm:inline">
              For those who drive, not just commute.
            </span>
          </div>

          <a href="tel:+18443982739" className="font-bold hover:text-blue-300 whitespace-nowrap">
            844-398-2739
          </a>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src="/brand/apex-logo.svg"
            alt="Apex Coverage shield logo"
            className="h-10 w-10"
          />
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-[0.22em]">
              APEX
            </span>
            <span className="block text-[11px] font-bold tracking-[0.28em] text-blue-300">
              COVERAGE
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-6 text-sm font-bold md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`transition hover:text-blue-300 ${
                    active ? 'text-blue-300' : 'text-white/80'
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
            href="/protect-more-than-stock"
            className="hidden items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 sm:inline-flex"
          >
            Get My Quote
          </Link>

          <button
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            Menu
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-[#031326] md:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-2 text-sm font-bold">
            {NAV.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href} className="border-b border-white/10 py-3 last:border-none">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block ${active ? 'text-blue-300' : 'text-white/85'}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li className="py-3">
              <Link
                href="/protect-more-than-stock"
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-blue-600 px-4 py-3 text-center font-black text-white"
              >
                Get My Quote
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
