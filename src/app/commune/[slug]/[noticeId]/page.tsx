import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string; noticeId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, noticeId } = await params;
  const notice = await prisma.officialNotice.findFirst({
    where: { id: noticeId, tenant: { slug } },
  });
  if (!notice) return { title: 'Information introuvable' };
  return {
    title: `${notice.title} — MairieConnect`,
    description: notice.summary ?? notice.contentText?.slice(0, 160),
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { slug, noticeId } = await params;

  const notice = await prisma.officialNotice.findFirst({
    where: { id: noticeId, tenant: { slug } },
    include: { medias: { orderBy: { sortOrder: 'asc' } }, tenant: true },
  });

  if (!notice) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/commune/${slug}`}
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Retour aux informations de {notice.tenant.name}
      </Link>

      <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-2 mb-3">
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{notice.title}</h1>

        {notice.modifiedAt && (
          <p className="text-sm text-gray-400 mb-4">
            Mis à jour le {new Date(notice.modifiedAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}

        <div
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: notice.content }}
        />

        {notice.medias.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {notice.medias.map((media) => (
              <a key={media.id} href={media.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={media.url}
                  alt={media.altText ?? ''}
                  className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}