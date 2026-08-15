import { PrismaClient } from '../prisma/client/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding MairieConnect database...');

  const tenants = [
    {
      name: 'Mairie de Paris Centre',
      slug: 'mairie-de-paris-centre-75001',
      postCode: '75001',
      cityName: 'Paris',
      address: 'Place de l\'Hôtel de Ville',
      latitude: 48.8566,
      longitude: 2.3522,
      entityType: 'mairie',
      department: 'FR-75',
      region: 'FR-IDF',
      source: 'manual',
    },
    {
      name: 'Mairie de Lyon',
      slug: 'mairie-de-lyon-69001',
      postCode: '69001',
      cityName: 'Lyon',
      address: '1 Place de la Comédie',
      latitude: 45.7675,
      longitude: 4.8330,
      entityType: 'mairie',
      department: 'FR-69',
      region: 'FR-ARA',
      source: 'manual',
    },
    {
      name: 'Mairie de Marseille',
      slug: 'mairie-de-marseille-13001',
      postCode: '13001',
      cityName: 'Marseille',
      address: 'Quai du Port',
      latitude: 43.2965,
      longitude: 5.3698,
      entityType: 'mairie',
      department: 'FR-13',
      region: 'FR-PAC',
      source: 'manual',
    },
    {
      name: 'Mairie de Bordeaux',
      slug: 'mairie-de-bordeaux-33000',
      postCode: '33000',
      cityName: 'Bordeaux',
      address: 'Place Pey Berland',
      latitude: 44.8378,
      longitude: -0.5792,
      entityType: 'mairie',
      department: 'FR-33',
      region: 'FR-NAQ',
      source: 'manual',
    },
    {
      name: 'Mairie de Lille',
      slug: 'mairie-de-lille-59000',
      postCode: '59000',
      cityName: 'Lille',
      address: 'Place Roger Salengro',
      latitude: 50.6292,
      longitude: 3.0573,
      entityType: 'mairie',
      department: 'FR-59',
      region: 'FR-HDF',
      source: 'manual',
    },
  ];

  for (const data of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    console.log(`  ✅ Tenant: ${tenant.name}`);

    const notices = [
      {
        title: 'Travaux rue de la République',
        content: '<p>Travaux de réfection de la chaussée du <strong>15 au 30 septembre 2026</strong>.</p><p>Circulation alternée.</p>',
        category: 'travaux', signType: 'info',
        modifiedAt: new Date('2026-08-10'),
      },
      {
        title: 'Collecte des déchets verts',
        content: '<p>Calendrier automne : mardi et vendredi 7h-12h.</p>',
        category: 'dechets', signType: 'info',
        modifiedAt: new Date('2026-08-12'),
      },
      {
        title: 'Alerte canicule',
        content: '<p>Vigilance orange. Buvez de l\'eau, évitez les sorties 12h-16h.</p>',
        category: 'securite', signType: 'alert',
        modifiedAt: new Date('2026-08-14'),
      },
    ];

    for (const notice of notices) {
      await prisma.officialNotice.create({
        data: {
          tenantId: tenant.id, title: notice.title, content: notice.content,
          contentText: notice.content.replace(/<[^>]*>/g, ''),
          category: notice.category, signType: notice.signType,
          modifiedAt: notice.modifiedAt, publishedAt: new Date(),
          source: 'manual', isPublished: true,
        },
      });
    }
    console.log(`  📝 3 notices`);
  }

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mairieconnect.fr' },
    update: {},
    create: { email: 'admin@mairieconnect.fr', name: 'Admin MairieConnect', passwordHash, role: 'superadmin' },
  });
  console.log('  👤 Admin: admin@mairieconnect.fr / admin123');

  console.log('✅ Seed complete!');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());