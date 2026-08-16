// Embedded data — no filesystem dependency, works on Vercel out of the box

const tenantsData = [
  { id: 't_paris', name: 'Mairie de Paris Centre', slug: 'mairie-de-paris-centre-75001', postCode: '75001', cityName: 'Paris', address: "Place de l'Hôtel de Ville", latitude: 48.8566, longitude: 2.3522, department: 'FR-75', region: 'FR-IDF', source: 'manual', isActive: true },
  { id: 't_lyon', name: 'Mairie de Lyon', slug: 'mairie-de-lyon-69001', postCode: '69001', cityName: 'Lyon', address: '1 Place de la Comédie', latitude: 45.7675, longitude: 4.8330, department: 'FR-69', region: 'FR-ARA', source: 'manual', isActive: true },
  { id: 't_marseille', name: 'Mairie de Marseille', slug: 'mairie-de-marseille-13001', postCode: '13001', cityName: 'Marseille', address: 'Quai du Port', latitude: 43.2965, longitude: 5.3698, department: 'FR-13', region: 'FR-PAC', source: 'manual', isActive: true },
  { id: 't_bordeaux', name: 'Mairie de Bordeaux', slug: 'mairie-de-bordeaux-33000', postCode: '33000', cityName: 'Bordeaux', address: 'Place Pey Berland', latitude: 44.8378, longitude: -0.5792, department: 'FR-33', region: 'FR-NAQ', source: 'manual', isActive: true },
  { id: 't_lille', name: 'Mairie de Lille', slug: 'mairie-de-lille-59000', postCode: '59000', cityName: 'Lille', address: 'Place Roger Salengro', latitude: 50.6292, longitude: 3.0573, department: 'FR-59', region: 'FR-HDF', source: 'manual', isActive: true },
];

const noticesData = [
  { id: 'n1', tenantId: 't_paris', title: 'Travaux rue de la République', content: '<p>Travaux du <strong>15 au 30 septembre 2026</strong>. Circulation alternée.</p>', category: 'travaux', signType: 'info', isPublished: true, source: 'manual', modifiedAt: '2026-08-10T00:00:00Z' },
  { id: 'n2', tenantId: 't_paris', title: 'Collecte des déchets verts — Calendrier automne', content: '<p>Calendrier automne : mardi et vendredi 7h-12h. Déchetterie ouverte du lundi au samedi.</p>', category: 'dechets', signType: 'info', isPublished: true, source: 'manual', modifiedAt: '2026-08-12T00:00:00Z' },
  { id: 'n3', tenantId: 't_paris', title: 'Alerte canicule — Vigilance orange', content: '<p>Buvez de l\'eau, évitez les sorties 12h-16h. Salle rafraîchie disponible en mairie.</p>', category: 'securite', signType: 'alert', isPublished: true, source: 'manual', modifiedAt: '2026-08-14T00:00:00Z' },
  { id: 'n4', tenantId: 't_lyon', title: 'Réunion publique — Budget participatif', content: '<p>Réunion le 12 septembre à 18h en mairie. Présentation des projets 2026.</p>', category: 'evenement', signType: 'info', isPublished: true, source: 'manual' },
  { id: 'n5', tenantId: 't_lyon', title: 'Marché de Noël — Appel à candidatures', content: '<p>Inscriptions jusqu\'au 15 novembre pour les exposants.</p>', category: 'evenement', signType: 'info', isPublished: true, source: 'manual' },
  { id: 'n6', tenantId: 't_marseille', title: 'Fermeture de la piscine municipale', content: '<p>Fermeture pour travaux du 1er au 30 septembre.</p>', category: 'travaux', signType: 'info', isPublished: true, source: 'manual' },
  { id: 'n7', tenantId: 't_bordeaux', title: 'Marché des producteurs — Saison 2026', content: '<p>Tous les dimanches matin place de la Comédie.</p>', category: 'evenement', signType: 'info', isPublished: true, source: 'manual' },
  { id: 'n8', tenantId: 't_lille', title: 'Travaux ligne de métro', content: '<p>Interruption du trafic les 10-11 septembre pour maintenance.</p>', category: 'travaux', signType: 'info', isPublished: true, source: 'manual' },
];

const usersData = [
  { id: 'u_admin', email: 'admin@mairieconnect.fr', name: 'Admin', role: 'superadmin', isActive: true, passwordHash: '$2a$04$QyJZ2m3NvGk4b7W1dE9XeO5zVQrGk5j6p8s2n4l1m9w' },
];

// In-memory store
export const db = {
  tenant: {
    findMany: async ({ where, orderBy, take }: any = {}) => {
      let items = [...tenantsData];
      if (where?.isActive === true) items = items.filter((t) => t.isActive);
      if (where?.OR) {
        const q = (where.OR[0]?.name?.contains || '').toLowerCase();
        if (q) items = items.filter((t) => t.name.toLowerCase().includes(q) || t.cityName.toLowerCase().includes(q) || t.postCode.includes(q));
      }
      if (orderBy?.name === 'asc') items.sort((a, b) => a.name.localeCompare(b.name));
      if (take) items = items.slice(0, take);
      return items;
    },
    findUnique: async ({ where }: any = {}) => {
      if (where?.slug) return tenantsData.find((t) => t.slug === where.slug) || null;
      if (where?.id) return tenantsData.find((t) => t.id === where.id) || null;
      return null;
    },
    count: async ({ where }: any = {}) => {
      if (where?.isActive === true) return tenantsData.filter((t) => t.isActive).length;
      return tenantsData.length;
    },
    create: async ({ data }: any = {}) => {
      const item = { id: data.id || String(Date.now()), ...data, createdAt: new Date().toISOString() };
      tenantsData.push(item);
      return item;
    },
  },
  officialNotice: {
    findFirst: async ({ where, include }: any = {}) => {
      let items = [...noticesData];
      if (where?.id) items = items.filter((n) => n.id === where.id);
      if (where?.tenant?.slug) {
        const t = tenantsData.find((tt) => tt.slug === where.tenant.slug);
        if (t) items = items.filter((n) => n.tenantId === t.id);
      }
      const item = items[0] || null;
      if (item && include) {
        (item as any).tenant = include.tenant ? tenantsData.find((t) => t.id === item.tenantId) : undefined;
        (item as any).medias = include.medias ? [] : undefined;
      }
      return item;
    },
    findMany: async ({ where, orderBy, take, include }: any = {}) => {
      let items = [...noticesData];
      if (where?.tenantId) items = items.filter((n) => n.tenantId === where.tenantId);
      if (where?.isPublished === true) items = items.filter((n) => n.isPublished);
      if (take) items = items.slice(0, take);
      return items.map((n) => ({
        ...n,
        medias: [] as any[],
        tenant: include?.tenant ? tenantsData.find((t) => t.id === n.tenantId) : undefined,
      }));
    },
    count: async ({ where }: any = {}) => {
      if (where?.isPublished === true) return noticesData.filter((n) => n.isPublished).length;
      return noticesData.length;
    },
  },
  user: {
    findUnique: async ({ where }: any = {}) => {
      const user = usersData.find((u) => u.email === where?.email || u.id === where?.id) || null;
      return user;
    },
  },
};