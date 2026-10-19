// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GoogleAdsTag from '@/components/GoogleAdsTag';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.driveapexcoverage.com'),
  title: 'Apex Coverage | Modified Vehicle Protection and Auto Coverage',
  description:
    'Apex Coverage helps drivers explore modified vehicle protection for eligible aftermarket parts and auto coverage options with guidance from a real agent.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f4f8ff] text-slate-950">
        <GoogleAdsTag />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
