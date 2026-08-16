import Link from 'next/link';
import { db } from '@/lib/data';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allTenants = await db.tenant.findMany({ orderBy: { name: 'asc' } });
  const totalNotices = await db.officialNotice.count({ where: { isPublished: true } });

  // Compter les notices par ville et ne garder que celles qui en ont
  const tenantNoticeCounts = await Promise.all(
    allTenants.map(async (t: any) => ({
      tenant: t,
      count: await db.officialNotice.count({ where: { tenantId: t.id, isPublished: true } }),
    }))
  );

  const activeTenants = tenantNoticeCounts
    .filter((t: any) => t.count > 0)
    .sort((a: any, b: any) => b.count - a.count);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          L&apos;information municipale simplifiée
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Arrêtés municipaux, délibérations, travaux, événements —
          retrouvez toutes les informations officielles de votre commune.
        </p>
      </section>

      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">{activeTenants.length}</p>
          <p className="text-sm text-gray-500 mt-1">Communes suivies</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalNotices.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Informations référencées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">
            {((activeTenants.length / Math.max(allTenants.length, 1)) * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Couverture open data</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Communes disponibles</h2>
        <p className="text-sm text-gray-400 mb-6">
          Données issues des portails open data officiels (data.gouv.fr)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTenants.map(({ tenant, count }: any) => (
            <Link key={tenant.id} href={`/commune/${tenant.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.postCode} {tenant.cityName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">{count}</p>
                <p className="text-xs text-gray-400">{count > 1 ? 'infos' : 'info'}</p>
              </div>
            </Link>
          ))}
        </div>
        {allTenants.length > activeTenants.length && (
          <p className="text-sm text-gray-400 mt-6 text-center">
            {allTenants.length - activeTenants.length} communes supplémentaires arrivent bientôt
            (données open data en cours d&apos;import)
          </p>
        )}
      </section>
    </div>
  );
}