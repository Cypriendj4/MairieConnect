// Couche de données MairieConnect
// Charge les notices depuis data/mairieconnect.json

let importedData: any;

try {
  importedData = require('../../data/mairieconnect.json');
} catch {
  importedData = null;
}

const CITIES: any[] = importedData?.cities || [
  { id: 't_paris', name: 'Mairie de Paris Centre', slug: 'mairie-de-paris-centre-75001', postCode: '75001', cityName: 'Paris' },
  { id: 't_lyon', name: 'Mairie de Lyon', slug: 'mairie-de-lyon-69001', postCode: '69001', cityName: 'Lyon' },
  { id: 't_marseille', name: 'Mairie de Marseille', slug: 'mairie-de-marseille-13001', postCode: '13001', cityName: 'Marseille' },
  { id: 't_bordeaux', name: 'Mairie de Bordeaux', slug: 'mairie-de-bordeaux-33000', postCode: '33000', cityName: 'Bordeaux' },
  { id: 't_lille', name: 'Mairie de Lille', slug: 'mairie-de-lille-59000', postCode: '59000', cityName: 'Lille' },
];

const NOTICES: any[] = importedData?.notices || [];

const cityBySlug = new Map(CITIES.map((c: any) => [c.slug, c]));
const cityById = new Map(CITIES.map((c: any) => [c.id, c]));

export const db = {
  tenant: {
    findMany: ({ where, orderBy, take }: any = {}) => {
      let items = [...CITIES];
      if (where?.OR) {
        const q = (where.OR[0]?.name?.contains || '').toLowerCase();
        if (q) items = items.filter((t: any) =>
          t.name.toLowerCase().includes(q) || t.cityName.toLowerCase().includes(q) || t.postCode.includes(q)
        );
      }
      if (orderBy?.name === 'asc') items.sort((a: any, b: any) => a.name.localeCompare(b.name));
      if (take) items = items.slice(0, take);
      return Promise.resolve(items);
    },
    findUnique: ({ where }: any = {}) => {
      if (where?.slug) return Promise.resolve(cityBySlug.get(where.slug) || null);
      if (where?.id) return Promise.resolve(cityById.get(where.id) || null);
      return Promise.resolve(null);
    },
    count: () => Promise.resolve(CITIES.length),
  },

  officialNotice: {
    findFirst: ({ where, include }: any = {}) => {
      let items = getNoticesForCity(where?.tenant?.slug);
      if (where?.id) items = items.filter((n: any) => n.id === where.id);
      const item = items[0] || null;
      if (item && include) {
        (item as any).tenant = cityBySlug.get(where?.tenant?.slug) || null;
        (item as any).medias = [];
      }
      return Promise.resolve(item);
    },
    findMany: ({ where, orderBy, take }: any = {}) => {
      let items = getNoticesForCity(where?.tenantId || where?.tenant?.slug);
      if (where?.isPublished === true) items = items.filter((n: any) => n.isPublished !== false);
      if (take) items = items.slice(0, take);
      return Promise.resolve(items.map((n: any) => ({ ...n, medias: [] })));
    },
    count: ({ where }: any = {}) => {
      if (where?.isPublished === true) return Promise.resolve(NOTICES.filter((n: any) => n.isPublished !== false).length);
      if (where?.tenantId) return Promise.resolve(NOTICES.filter((n: any) => n.tenantId === where.tenantId).length);
      return Promise.resolve(NOTICES.length);
    },
  },

  user: {
    findUnique: ({ where }: any = {}) => {
      if (where?.email === 'admin@mairieconnect.fr') {
        return Promise.resolve({ id: 'u_admin', email: 'admin@mairieconnect.fr', name: 'Admin', role: 'superadmin', isActive: true, passwordHash: '$2a$04$QyJZ2m3NvGk4b7W1dE9XeO5zVQrGk5j6p8s2n4l1m9w' });
      }
      return Promise.resolve(null);
    },
  },
};

function getNoticesForCity(slugOrId?: string) {
  if (!slugOrId) return NOTICES;
  const city = cityBySlug.get(slugOrId) || cityById.get(slugOrId);
  if (!city) return [];
  return NOTICES.filter((n: any) => n.tenantId === city.id);
}