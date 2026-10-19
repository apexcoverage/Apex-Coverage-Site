import ApexCoverageSite from '@/components/ApexCoverageSite';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Apex Coverage | Modified Vehicle Protection and Auto Coverage',
    description:
      'Coverage guidance for daily drivers and modified builds. Explore options for eligible aftermarket parts, DIY builds, and auto coverage.',
    url: '/',
    siteName: 'Apex Coverage',
    type: 'website',
    images: ['/brand/apex-city-build.png'],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Apex Coverage',
            url: 'https://www.driveapexcoverage.com/',
            logo: 'https://www.driveapexcoverage.com/Apex_Logo.png',
            telephone: '+1-844-398-2739',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              telephone: '+1-844-398-2739',
              email: 'support@driveapexcoverage.com',
            },
          }),
        }}
      />
      <ApexCoverageSite />
    </>
  );
}
