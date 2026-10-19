import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.driveapexcoverage.com';

const publicPages = [
  '/',
  '/build-review',
  '/protect-more-than-stock',
  '/tiers',
  '/how-it-works',
  '/quote',
  '/about',
  '/claims',
  '/privacy',
  '/terms',
  '/legal',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((path) => ({ url: `${siteUrl}${path}` }));
}
