/**
 * MairieConnect — Import depuis les APIs OpenData locales
 * Couvre les villes qui NE sont PAS sur data.gouv.fr :
 *   Paris, Lyon, Lille, Strasbourg, Nice, Grenoble, Montpellier
 *   + leurs métropoles respectives
 */

const API_TIMEOUT = 10000;

// Mapping des endpoints ODATA par ville
const ODATA_ENDPOINTS = [
  // Paris — opendata.paris.fr
  {
    name: 'Paris - Délibérations',
    url: 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-paris-centre-75001',
    fields: { title: 'titre', date: 'date_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Lyon — data.grandlyon.com (via API ODATA)
  {
    name: 'Lyon - Délibérations',
    url: 'https://data.grandlyon.com/api/explore/v2.1/catalog/datasets/deliberations-du-conseil-de-la-metropole-de-lyon/records?limit=50',
    citySlug: 'mairie-de-lyon-69001',
    fields: { title: 'objet', date: 'date_seance', url: 'lien_vers_la_deliberation' },
  },
  // Lille — data.lillemetropole.fr
  {
    name: 'Lille Métropole - Délibérations',
    url: 'https://data.lillemetropole.fr/api/explore/v2.1/catalog/datasets/deliberations-de-la-metropole-europeenne-de-lille/records?limit=50',
    citySlug: 'mairie-de-lille-59000',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Strasbourg — data.strasbourg.eu
  {
    name: 'Strasbourg - Délibérations',
    url: 'https://data.strasbourg.eu/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-strasbourg-67000',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Toulouse — data.toulouse-metropole.fr
  {
    name: 'Toulouse Métropole - Délibérations',
    url: 'https://data.toulouse-metropole.fr/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-toulouse-31000',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Montpellier — data.montpellier.fr
  {
    name: 'Montpellier - Délibérations',
    url: 'https://data.montpellier.fr/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-montpellier-34000',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Marseille — data.marseille.fr
  {
    name: 'Marseille - Délibérations',
    url: 'https://data.marseille.fr/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-marseille-13001',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Bordeaux — data.bordeaux-metropole.fr
  {
    name: 'Bordeaux Métropole - Délibérations',
    url: 'https://data.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-bordeaux-33000',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
  // Nice — data.nice.fr
  {
    name: 'Nice - Délibérations',
    url: 'https://data.nice.fr/api/explore/v2.1/catalog/datasets/deliberations/records?limit=50',
    citySlug: 'mairie-de-nice-06000',
    fields: { title: 'objet', date: 'date_de_la_deliberation', url: 'lien_vers_la_deliberation' },
  },
];

// Mapping des catégories
const CATEGORY_MAP = {
  'urbanisme': 'travaux', 'voirie': 'travaux', 'circulation': 'travaux',
  'transport': 'mobilite', 'environnement': 'dechets', 'déchet': 'dechets',
  'propre': 'dechets', 'sécurité': 'securite', 'sécurite': 'securite',
  'social': 'solidarite', 'culture': 'evenement', 'sport': 'evenement',
  'éducation': 'enfance', 'école': 'enfance', 'jeunesse': 'enfance',
  'budget': 'mairie', 'finances': 'mairie', 'personnel': 'mairie',
  'marché': 'evenement', 'association': 'mairie',
};

function detectCategory(title) {
  const t = (title || '').toLowerCase();
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (t.includes(kw)) return cat;
  }
  return 'info';
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

export async function importAll() {
  console.log('  Connexion aux APIs OpenData locales...');
  const allNotices = [];

  for (const endpoint of ODATA_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

      const res = await fetch(endpoint.url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`  ⏭️  ${endpoint.name}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const records = data.results || data.records || [];

      if (records.length === 0) {
        console.log(`  ⏭️  ${endpoint.name}: aucune donnée`);
        continue;
      }

      let count = 0;
      for (const record of records) {
        const row = record.fields || record;
        const title = row[endpoint.fields.title] || row.objet || row.title || '';
        if (!title) continue;

        const date = row[endpoint.fields.date] || row.date || null;
        const rawUrl = row[endpoint.fields.url] || row.url || '';
        const cleanUrl = typeof rawUrl === 'string' ? rawUrl : '';

        allNotices.push({
          id: `ol_${simpleHash(title + (date || ''))}`,
          tenantSlug: endpoint.citySlug,
          title: title.trim(),
          content: `<p>${title.trim().replace(/</g, '&lt;')}</p>`,
          contentText: title.trim(),
          category: detectCategory(title),
          signType: 'info',
          isPublished: true,
          source: 'opendata_api',
          sourceUrl: cleanUrl,
          publishedAt: date || null,
          modifiedAt: date || null,
          _source: endpoint.name,
        });
        count++;
      }

      if (count > 0) {
        console.log(`  ✅ ${endpoint.name}: ${count} notices`);
      }
    } catch (e) {
      console.log(`  ❌ ${endpoint.name}: ${e.message}`);
    }
  }

  return allNotices;
}