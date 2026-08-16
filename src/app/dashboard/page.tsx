import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/data';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const isSuperAdmin = session.user.role === 'superadmin';
  const myTenant = session.user.tenantId
    ? await db.tenant.findUnique({ where: { id: session.user.tenantId } })
    : null;

  const tenantCount = await db.tenant.count();
  const noticeCount = await db.officialNotice.count();
  const recentNotices = await db.officialNotice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { tenant: { select: { name: true, slug: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {session.user.name ?? session.user.email}
          </h1>
          <p className="text-sm text-gray-500">
            {isSuperAdmin ? 'SuperAdmin' : myTenant?.name ?? 'Agent'}
          </p>
        </div>
        <a
          href="/api/auth/signout"
          className="text-sm text-red-600 hover:underline"
        >
          Déconnexion
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-2xl font-bold text-blue-700">{tenantCount}</p>
          <p className="text-sm text-gray-500">Communes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-2xl font-bold text-blue-700">{noticeCount}</p>
          <p className="text-sm text-gray-500">Informations publiées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-2xl font-bold text-blue-700">{recentNotices.length}</p>
          <p className="text-sm text-gray-500">Dernières mises à jour</p>
        </div>
      </div>

      {/* Recent notices */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières informations</h2>
        <div className="space-y-3">
          {recentNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{notice.title}</p>
                <p className="text-xs text-gray-500">
                  {notice.tenant.name} &middot; {new Date(notice.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {notice.category ?? 'Info'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}