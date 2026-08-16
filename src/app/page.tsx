import Link from 'next/link';
import { db } from '@/lib/data';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allTenants = await db.tenant.findMany({ orderBy: { name: 'asc' } });
  const allNotices = await db.officialNotice.findMany({});
  
  // Compter les notices par ville DIRECTEMENT depuis la liste complète
  const countByTenant: Record<string, number> = {};
  for (const n of allNotices as any[]) {
    const tid = n.tenantId || '?';
    countByTenant[tid] = (countByTenant[tid] || 0) + 1;
  }

  const tenantWithCounts = allTenants
    .filter((t: any) => (countByTenant[t.id] || 0) > 0)
    .map((t: any) => ({ tenant: t, count: countByTenant[t.id] || 0 }))
    .sort((a: any, b: any) => b.count - a.count);

  const totalNotices = allNotices.length;
  const totalCitiesWithData = tenantWithCounts.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          L&apos;information municipale simplifiée
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Arrêtés municipaux, délibérations, travaux, événements —
          retrouvez les informations officielles de votre commune en open data.
        </p>
      </section>

      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalCitiesWithData}</p>
          <p className="text-sm text-gray-500 mt-1">Communes suivies</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalNotices.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Informations référencées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">Open data</p>
          <p className="text-sm text-gray-500 mt-1">Sources officielles</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Communes disponibles</h2>
        <p className="text-sm text-gray-400 mb-6">
          Données issues des portails open data officiels
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantWithCounts.map(({ tenant, count }: any) => (
            <Link key={tenant.id} href={`/commune/${tenant.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.postCode} {tenant.cityName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">{count}</p>
                <p className="text-xs text-gray-400">infos</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}