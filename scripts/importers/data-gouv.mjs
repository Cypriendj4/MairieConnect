/**
 * MairieConnect — Import depuis data.gouv.fr (portail national open data)
 */

const API_BASE = 'https://www.data.gouv.fr/api/1/datasets/';

const KNOWN_TOWNS = {
  'orvault': 'mairie-d-orvault-44700',
  'nantes': 'mairie-de-nantes-44000',
  'angers': 'mairie-d-angers-49000',
  'brest': 'mairie-de-brest-29200',
  'rennes': 'mairie-de-rennes-35000',
  'tours': 'mairie-de-tours-37000',
  'poitiers': 'mairie-de-poitiers-86000',
  'bordeaux': 'mairie-de-bordeaux-33000',
  'toulouse': 'mairie-de-toulouse-31000',
  'marseille': 'mairie-de-marseille-13001',
  'nancy': 'mairie-de-nancy-54000',
  'clermont': 'mairie-de-clermont-ferrand-63000',
  'saint-étienne': 'mairie-de-saint-etienne-42000',
  'issy': 'mairie-d-issy-les-moulineaux-92130',
  'issy-les-moulineaux': 'mairie-d-issy-les-moulineaux-92130',
  'saint-herblain': 'mairie-de-saint-herblain-44800',
  'saint-louis': 'mairie-de-saint-louis-68300',
  'besançon': 'mairie-de-besancon-25000',
  'besancon': 'mairie-de-besancon-25000',
  'paris': 'mairie-de-paris-centre-75001',
  'lyon': 'mairie-de-lyon-69001',
  'lille': 'mairie-de-lille-59000',
  'strasbourg': 'mairie-de-strasbourg-67000',
  'nice': 'mairie-de-nice-06000',
  'grenoble': 'mairie-de-grenoble-38000',
  'montpellier': 'mairie-de-montpellier-34000',
  'antibes': 'mairie-d-antibes-06600',
  'aix': 'mairie-d-aix-en-provence-13100',
  'martigues': 'mairie-de-martigues-13500',
  'longjumeau': 'mairie-de-longjumeau-91160',
  'pontault-combault': 'mairie-de-pontault-combault-77340',
  'le haillan': 'mairie-du-haillan-33185',
  'haillan': 'mairie-du-haillan-33185',
  'anglet': 'mairie-d-anglet-64600',
  'chassieu': 'mairie-de-chassieu-69680',
  'mogneneins': 'mairie-de-mogneneins-01470',
  'la possession': 'mairie-de-la-possession-97419',
  'deauville': 'mairie-de-deauville-14800',
};

const CATEGORY_MAP = {
  'urbanisme': 'travaux', 'travaux': 'travaux', 'voirie': 'travaux',
  'circulation': 'travaux', 'transport': 'mobilite', 'environnement': 'dechets',
  'déchet': 'dechets', 'propre': 'dechets', 'sécurité': 'securite',
  'social': 'solidarite', 'culture': 'evenement', 'sport': 'evenement',
  'éducation': 'enfance', 'école': 'enfance', 'jeunesse': 'enfance',
  'budget': 'mairie', 'finances': 'mairie', 'personnel': 'mairie',
  'marché': 'evenement', 'association': 'mairie', 'subvention': 'mairie',
};

function detectTown(name, org) {
  const text = `${name} ${org}`.toLowerCase();
  for (const [town, slug] of Object.entries(KNOWN_TOWNS)) {
    if (text.includes(town)) return slug;
  }
  return null;
}

function detectCategory(title, matiere) {
  const text = `${title} ${matiere}`.toLowerCase();
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(kw)) return cat;
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
  console.log('  Récupération des datasets data.gouv.fr...');

  const queries = [
    'délibérations conseil municipal',
    'arrêtés municipaux',
    'affichage légal',
  ];

  const allDatasets = new Map();

  // Phase 1 : Découverte
  for (const q of queries) {
    const url = `${API_BASE}?q=${encodeURIComponent(q)}&page_size=50`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();

    for (const ds of data.data || []) {
      const id = ds.id || ds.slug;
      if (allDatasets.has(id)) continue;

      const goodResources = (ds.resources || []).filter(r =>
        ['json', 'csv'].includes((r.format || '').toLowerCase())
      );
      if (goodResources.length === 0) continue;

      allDatasets.set(id, {
        title: ds.title,
        org: ds.organization?.name || '',
        resources: goodResources.filter(r => r.format?.toLowerCase() === 'json').slice(0, 5),
      });
    }
  }

  console.log(`  ${allDatasets.size} datasets avec ressources JSON`);

  // Phase 2 : Import
  let allNotices = [];
  let idx = 0;

  for (const [id, ds] of allDatasets) {
    idx++;
    process.stdout.write(`\r  [${idx}/${allDatasets.size}] ${ds.title.substring(0, 45).padEnd(45)}`);

    for (const resource of ds.resources) {
      if (!resource.url || resource.format?.toLowerCase() !== 'json') continue;
      if (!resource.url.includes('/exports/json')) continue; // Format ODATA uniquement

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(resource.url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const rows = await res.json();
        if (!Array.isArray(rows)) continue;

        for (const row of rows) {
          const title = row.delib_objet || row.titre || row.title || row.objet || '';
          if (!title) continue;

          const date = row.delib_date || row.date || null;
          const rawUrl = row.delib_url || row.url || null;
          const townSlug = detectTown(row.coll_nom || '', ds.title + ' ' + ds.org);
          const cleanUrl = typeof rawUrl === 'string' ? rawUrl : '';
          const matiere = row.delib_matiere_nom || row.matiere || row.theme || '';

          allNotices.push({
            id: `dg_${simpleHash(title + (date || ''))}`,
            tenantSlug: townSlug || 'unknown',
            title: title.trim().substring(0, 200),
            content: `<p>${title.trim().replace(/</g, '&lt;').substring(0, 500)}</p>`,
            category: detectCategory(title, matiere),
            signType: 'info',
            isPublished: true,
            source: 'data_gouv',
            sourceUrl: cleanUrl,
            publishedAt: date,
            modifiedAt: date,
          });
        }
      } catch (e) {
        // Skip errors silently
      }
    }
  }

  process.stdout.write('\n');
  console.log(`  ✅ ${allNotices.length} notices importées depuis data.gouv.fr`);

  // Stats par ville
  const byCity = {};
  for (const n of allNotices) {
    if (n.tenantSlug && n.tenantSlug !== 'unknown') {
      byCity[n.tenantSlug] = (byCity[n.tenantSlug] || 0) + 1;
    }
  }
  const sorted = Object.entries(byCity).sort((a, b) => b[1] - a[1]);
  for (const [slug, count] of sorted.slice(0, 10)) {
    console.log(`    ${slug.split('-').pop()}: ${count} notices`);
  }
  if (sorted.length > 10) console.log(`    ... et ${sorted.length - 10} autres villes`);

  return allNotices;
}