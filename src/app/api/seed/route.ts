import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// Protection : appelable seulement si SECRET_KEY correspond
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_SECRET ?? 'mairieconnect-seed-2026'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenants = [
    { name: 'Mairie de Paris Centre', slug: 'mairie-de-paris-centre-75001', postCode: '75001', cityName: 'Paris', address: 'Place de l\'Hôtel de Ville', latitude: 48.8566, longitude: 2.3522, department: 'FR-75', region: 'FR-IDF', source: 'manual' },
    { name: 'Mairie de Lyon', slug: 'mairie-de-lyon-69001', postCode: '69001', cityName: 'Lyon', address: '1 Place de la Comédie', latitude: 45.7675, longitude: 4.8330, department: 'FR-69', region: 'FR-ARA', source: 'manual' },
    { name: 'Mairie de Marseille', slug: 'mairie-de-marseille-13001', postCode: '13001', cityName: 'Marseille', address: 'Quai du Port', latitude: 43.2965, longitude: 5.3698, department: 'FR-13', region: 'FR-PAC', source: 'manual' },
    { name: 'Mairie de Bordeaux', slug: 'mairie-de-bordeaux-33000', postCode: '33000', cityName: 'Bordeaux', address: 'Place Pey Berland', latitude: 44.8378, longitude: -0.5792, department: 'FR-33', region: 'FR-NAQ', source: 'manual' },
    { name: 'Mairie de Lille', slug: 'mairie-de-lille-59000', postCode: '59000', cityName: 'Lille', address: 'Place Roger Salengro', latitude: 50.6292, longitude: 3.0573, department: 'FR-59', region: 'FR-HDF', source: 'manual' },
  ];

  let tenantsCreated = 0;
  let noticesCreated = 0;

  for (const data of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    tenantsCreated++;

    const notices = [
      { title: 'Travaux rue de la République', content: '<p>Travaux du <strong>15 au 30 septembre 2026</strong>. Circulation alternée.</p>', category: 'travaux', signType: 'info' },
      { title: 'Collecte des déchets verts — Calendrier automne', content: '<p>Mardi et vendredi 7h-12h. Déchetterie ouverte du lundi au samedi.</p>', category: 'dechets', signType: 'info' },
      { title: 'Alerte canicule — Vigilance orange', content: '<p>Buvez de l\'eau, évitez les sorties 12h-16h.</p>', category: 'securite', signType: 'alert' },
    ];

    for (const n of notices) {
      await prisma.officialNotice.create({
        data: {
          tenantId: tenant.id, title: n.title, content: n.content,
          contentText: n.content.replace(/<[^>]*>/g, ''),
          category: n.category, signType: n.signType,
          publishedAt: new Date(), source: 'manual', isPublished: true,
        },
      });
      noticesCreated++;
    }
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mairieconnect.fr' },
    update: {},
    create: { email: 'admin@mairieconnect.fr', name: 'Admin MairieConnect', passwordHash, role: 'superadmin' },
  });

  return NextResponse.json({
    ok: true,
    tenantsCreated,
    noticesCreated,
    admin: 'admin@mairieconnect.fr / admin123',
  });
}