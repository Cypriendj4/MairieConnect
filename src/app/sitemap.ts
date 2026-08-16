import { db } from '@/lib/data';
import type { MetadataRoute } from 'next';

const BASE = 'https://mairie-connect-ifcn.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenants = await db.tenant.findMany({ orderBy: { name: 'asc' } });
  const notices = await db.officialNotice.findMany({});

  const communeEntries = tenants.map((t: any) => ({
    url: `${BASE}/commune/${t.slug}`,
    lastModified: t.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const noticeEntries = notices.map((n: any) => ({
    url: `${BASE}/commune/${n.tenantSlug || 'ville'}/${n.id}`,
    lastModified: n.modifiedAt || n.publishedAt || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...communeEntries,
    ...noticeEntries,
  ];
}