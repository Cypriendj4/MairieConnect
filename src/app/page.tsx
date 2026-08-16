import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getData() {
  try {
    const [tenants, totalTenants, totalNotices] = await Promise.all([
      prisma.tenant.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.officialNotice.count({ where: { isPublished: true } }),
    ]);
    return { tenants, totalTenants, totalNotices };
  } catch {
    return {
      tenants: [],
      totalTenants: 0,
      totalNotices: 0,
    };
  }
}

export default async function HomePage() {
  const { tenants, totalTenants, totalNotices } = await getData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          L&apos;information municipale simplifiée
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Retrouvez tous les arrêtés, avis et informations de votre commune
          en un clic. Gratuit, sans publicité, open data.
        </p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto">
          <input
            type="search"
            placeholder="Recherchez une commune ou un code postal..."
            className="w-full px-6 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            hx-get="/api/tenants/search"
            hx-target="#results"
            hx-trigger="keyup changed delay:300ms"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalTenants.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Communes référencées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalNotices.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Informations publiées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-3xl font-bold text-blue-700">100%</p>
          <p className="text-sm text-gray-500 mt-1">Gratuit pour les citoyens</p>
        </div>
      </section>

      {/* City list */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Communes disponibles</h2>
        <div id="results" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/commune/${tenant.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3">
                {tenant.logoUrl && (
                  <img
                    src={tenant.logoUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-sm text-gray-500">{tenant.postCode} {tenant.cityName}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}