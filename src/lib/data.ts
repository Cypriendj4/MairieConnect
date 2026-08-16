import fs from 'fs';
import path from 'path';

// JSON fallback data when no database is available
const dataPath = path.join(process.cwd(), 'data.json');
let jsonData: {
  tenants: any[];
  notices: any[];
  users: any[];
};

try {
  jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
} catch {
  jsonData = { tenants: [], notices: [], users: [] };
}

// Simple in-memory store that mimics Prisma interface
// Falls back to data.json when DATABASE_URL is not set
export const db = {
  tenant: {
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      let items = [...jsonData.tenants];
      if (where?.isActive !== undefined) {
        items = items.filter((t) => t.isActive !== false);
      }
      if (where?.OR) {
        const q = where.OR[0]?.name?.contains?.toLowerCase() || '';
        items = items.filter((t) =>
          q ? t.name.toLowerCase().includes(q) || t.cityName.toLowerCase().includes(q) || t.postCode.includes(q) : true
        );
      }
      if (orderBy?.name === 'asc') items.sort((a, b) => a.name.localeCompare(b.name));
      if (take) items = items.slice(0, take);
      return items;
    },
    findUnique: async ({ where }: any = {}) => {
      if (where?.slug) return jsonData.tenants.find((t) => t.slug === where.slug) || null;
      if (where?.id) return jsonData.tenants.find((t) => t.id === where.id) || null;
      return null;
    },
    count: async ({ where }: any = {}) => {
      if (where?.isActive !== undefined) return jsonData.tenants.filter((t) => t.isActive !== false).length;
      return jsonData.tenants.length;
    },
    create: async ({ data }: any = {}) => {
      const item = { id: data.id || String(Date.now()), ...data, createdAt: new Date().toISOString() };
      jsonData.tenants.push(item);
      return item;
    },
  },
  officialNotice: {
    findFirst: async ({ where, include }: any = {}) => {
      let items = [...jsonData.notices];
      if (where?.id) items = items.filter((n) => n.id === where.id);
      if (where?.tenant?.slug) items = items.filter((n) => {
        const t = jsonData.tenants.find(t => t.slug === where.tenant.slug);
        return t && n.tenantId === t.id;
      });
      const item = items[0] || null;
      if (item && include) {
        if (include.tenant) item.tenant = jsonData.tenants.find((t) => t.id === item.tenantId);
        if (include.medias) item.medias = [];
      }
      return item;
    },
    findMany: async ({ where, orderBy, take, include }: any = {}) => {
      let items = [...jsonData.notices];
      if (where?.tenantId) items = items.filter((n) => n.tenantId === where.tenantId);
      if (where?.isPublished !== undefined) items = items.filter((n) => n.isPublished !== false);
      if (take) items = items.slice(0, take);
      return items.map((n) => ({
        ...n,
        medias: [],
        tenant: include?.tenant ? jsonData.tenants.find((t) => t.id === n.tenantId) : undefined,
      }));
    },
    count: async ({ where }: any = {}) => {
      let items = [...jsonData.notices];
      if (where?.isPublished !== undefined) items = items.filter((n) => n.isPublished !== false);
      return items.length;
    },
  },
  user: {
    findUnique: async ({ where }: any = {}) => {
      return jsonData.users.find((u) => u.email === where?.email) || null;
    },
  },
};