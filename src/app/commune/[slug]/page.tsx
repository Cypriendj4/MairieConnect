import { db } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) return { title: 'Commune introuvable' };
  return {
    title: `${tenant.name} — MairieConnect`,
    description: `Retrouvez toutes les informations et alertes de ${tenant.name} (${tenant.postCode}).`,
  };
}

export default async function CommunePage({ params }: Props) {
  const { slug } = await params;
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const notices = await db.officialNotice.findMany({
    where: { tenantId: tenant.id, isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { modifiedAt: 'desc' }],
    include: { medias: { take: 3, orderBy: { sortOrder: 'asc' } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; Retour à l&apos;accueil
        </Link>
        <div className="flex items-center gap-4 mt-2">
          {tenant.logoUrl && (
            <img src={tenant.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-gray-500">{tenant.postCode} {tenant.cityName}</p>
          </div>
        </div>
        {tenant.address && (
          <p className="text-sm text-gray-400 mt-2">
            {tenant.address} &middot; {tenant.postCode} {tenant.cityName}
          </p>
        )}
      </div>

      {/* Notices */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Informations ({notices.length})
        </h2>
        {notices.length === 0 ? (
          <p className="text-gray-500">Aucune information publiée pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex items-start gap-2 mb-2">
                  {notice.signType && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {notice.signType === 'alert' ? 'ALERTE' : notice.category ?? 'Info'}
                    </span>
                  )}
                  {notice.isLegal && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Affichage légal
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">{notice.title}</h3>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  {notice.modifiedAt && (
                    <span>Mis à jour le {new Date(notice.modifiedAt).toLocaleDateString('fr-FR')}</span>
                  )}
                  {notice.sourceUrl && (
                    <a href={notice.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium hover:underline ${
                        notice.source === 'panneaupocket_import'
                          ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}>
                      {notice.source === 'panneaupocket_import' ? 'PanneauPocket ↗' : 'Mairie ↗'}
                    </a>
                  )}
                </div>

                <div
                  className="prose prose-sm max-w-none text-gray-600 line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />

                {notice.medias && notice.medias.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {notice.medias.map((media: any) => (
                      <img
                        key={media.id}
                        src={media.thumbnailUrl ?? media.url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}

                <Link
                  href={`/commune/${slug}/${notice.id}`}
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  Lire la suite &rarr;
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}