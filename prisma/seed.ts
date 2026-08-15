import { PrismaClient } from '../prisma/client/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding MairieConnect database...');

  // Create test tenants
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
    console.log(`  ✅ Tenant created: ${tenant.name}`);

    // Create sample notices for each tenant
    const notices = [
      {
        title: 'Travaux rue de la République',
        content: '<p>La municipalité informe ses administrés que des travaux de réfection de la chaussée auront lieu du <strong>15 au 30 septembre 2026</strong> rue de la République.</p><p>La circulation sera alternée pendant cette période. Merci de votre compréhension.</p>',
        category: 'travaux',
        signType: 'info',
        modifiedAt: new Date('2026-08-10'),
      },
      {
        title: 'Collecte des déchets verts — Calendrier automne',
        content: '<p>La collecte des déchets verts passe en horaire d\'automne à partir du 1er octobre :</p><ul><li>Mardi et vendredi de 7h à 12h</li><li>Déchetterie ouverte du lundi au samedi 9h-18h</li></ul>',
        category: 'dechets',
        signType: 'info',
        modifiedAt: new Date('2026-08-12'),
      },
      {
        title: 'Alerte météo — Vigilance orange canicule',
        content: '<p>Météo France place le département en vigilance orange canicule à partir de demain.</p><p>Recommandations :</p><ul><li>Buvez régulièrement de l\'eau</li><li>Évitez les sorties aux heures les plus chaudes (12h-16h)</li><li>Prenez des nouvelles de vos proches</li></ul><p>La mairie met à disposition une salle rafraîchie au 1er étage de la mairie.</p>',
        category: 'securite',
        signType: 'alert',
        isLegal: false,
        modifiedAt: new Date('2026-08-14'),
      },
    ];

    for (const notice of notices) {
      await prisma.officialNotice.create({
        data: {
          tenantId: tenant.id,
          title: notice.title,
          content: notice.content,
          contentText: notice.content.replace(/<[^>]*>/g, ''),
          category: notice.category,
          signType: notice.signType,
          isLegal: notice.isLegal,
          modifiedAt: notice.modifiedAt,
          publishedAt: new Date(),
          source: 'manual',
          isPublished: true,
        },
      });
    }
    console.log(`  📝 3 notices created for ${tenant.name}`);
  }

  // Create admin user
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@mairieconnect.fr' },
    update: {},
    create: {
      email: 'admin@mairieconnect.fr',
      name: 'Admin MairieConnect',
      passwordHash,
      role: 'superadmin',
    },
  });
  console.log('  👤 Admin user created: admin@mairieconnect.fr / admin123');

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });