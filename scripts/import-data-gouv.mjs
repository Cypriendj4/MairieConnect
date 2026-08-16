#!/usr/bin/env node
/**
 * MairieConnect — Import des données officielles depuis data.gouv.fr
 *
 * Usage :
 *   node scripts/import-data-gouv.mjs                      # Découverte + import
 *   node scripts/import-data-gouv.mjs --dry-run            # Simulation seulement
 *   node scripts/import-data-gouv.mjs --list               # Lister les datasets disponibles
 *
 * Sources :
 *   - data.gouv.fr (portail national open data)
 *   - APIs ODATA des collectivités (Nantes, Paris, Lyon, etc.)
 *   - Recueil des Actes Administratifs (RAA)
 */

const API_BASE = 'https://www.data.gouv.fr/api/1/datasets/';
const DRY_RUN = process.argv.includes('--dry-run');
const LIST_ONLY = process.argv.includes('--list');

// Mapping villes connues (collections → slug MairieConnect)
const KNOWN_TOWNS = {
  'orvault': 'mairie-d-orvault-44700',
  'nantes': 'mairie-de-nantes-44000',
  'paris': 'mairie-de-paris-centre-75001',
  'lyon': 'mairie-de-lyon-69001',
  'marseille': 'mairie-de-marseille-13001',
  'bordeaux': 'mairie-de-bordeaux-33000',
  'lille': 'mairie-de-lille-59000',
  'rennes': 'mairie-de-rennes-35000',
  'toulouse': 'mairie-de-toulouse-31000',
  'strasbourg': 'mairie-de-strasbourg-67000',
  'besançon': 'mairie-de-besancon-25000',
  'besancon': 'mairie-de-besancon-25000',
};

function detectTown(name, org) {
  const text = `${name} ${org}`.toLowerCase();
  for (const [town, slug] of Object.entries(KNOWN_TOWNS)) {
    if (text.includes(town)) return slug;
  }
  return null;
}
const CATEGORY_MAP = {
  'urbanisme': 'travaux',
  'travaux': 'travaux',
  'voirie': 'travaux',
  'circulation': 'travaux',
  'transport': 'mobilite',
  'mobilité': 'mobilite',
  'environnement': 'dechets',
  'déchets': 'dechets',
  'propreté': 'dechets',
  'sécurité': 'securite',
  'securite': 'securite',
  'social': 'solidarite',
  'solidarité': 'solidarite',
  'culture': 'evenement',
  'sport': 'evenement',
  'education': 'enfance',
  'école': 'enfance',
  'jeunesse': 'enfance',
  'budget': 'mairie',
  'finances': 'mairie',
  'personnel': 'mairie',
};

function detectCategory(title, matiere) {
  const text = `${title} ${matiere}`.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return cat;
  }
  return 'info';
}

// ─── Découverte des datasets ────────────────────────

async function searchDatasets(query, pageSize = 10) {
  const url = `${API_BASE}?q=${encodeURIComponent(query)}&page_size=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data;
}

async function discoverAllDatasets() {
  console.log('🔍 Découverte des datasets data.gouv.fr...\n');

  const queries = [
    'délibérations conseil municipal',
    'arrêtés municipaux',
    'affichage légal',
    'informations municipales',
    'recueil actes administratifs',
  ];

  const allDatasets = new Map();

  for (const q of queries) {
    const result = await searchDatasets(q, 20);
    console.log(`  ${q}: ${result.total} datasets trouvés`);

    for (const ds of result.data || []) {
      const id = ds.id || ds.slug;
      if (!allDatasets.has(id)) {
        // Filtrer ceux qui ont des ressources structurées
        const goodResources = (ds.resources || []).filter(r =>
          ['json', 'csv', 'xml'].includes((r.format || '').toLowerCase())
        );
        if (goodResources.length > 0) {
          allDatasets.set(id, {
            title: ds.title,
            org: ds.organization?.name || 'Inconnu',
            url: ds.page || `https://data.gouv.fr/datasets/${id}`,
            resources: goodResources.map(r => ({
              format: r.format,
              title: r.title,
              url: r.url,
              type: r.type,
            })),
          });
        }
      }
    }
  }

  console.log(`\n📦 ${allDatasets.size} datasets avec ressources structurées (JSON/CSV/XML)`);
  return Array.from(allDatasets.values());
}

// ─── Import d'un dataset ─────────────────────────────

async function importDataset(dataset) {
  const imported = [];

  for (const resource of dataset.resources) {
    if (resource.format.toLowerCase() !== 'json') continue;
    if (resource.url.includes('/exports/json')) {
      // Format ODATA
      const rows = await fetchJSON(resource.url);
      if (!rows || !Array.isArray(rows)) continue;

      for (const row of rows) {
        const notice = transformOdataRow(row, dataset, resource.url);
        if (notice) imported.push(notice);
      }
    }
  }

  return imported;
}

function transformOdataRow(row, dataset, sourceUrl) {
  // Détection automatique des champs selon le format du dataset
  const title = row.delib_objet || row.titre || row.title || row.objet || '';
  if (!title) return null;

  const date = row.delib_date || row.date || row.published_at || row.created_at || null;
  const rawUrl = row.delib_url || row.url || row.source_url || null;
  const townSlug = detectTown(row.coll_nom || '', dataset.title + ' ' + dataset.org);

  // Nettoyer l'URL (certaines APIs retournent un objet)
  const cleanUrl = typeof rawUrl === 'string' ? rawUrl
    : typeof rawUrl?.url === 'string' ? rawUrl.url
    : typeof sourceUrl === 'string' ? sourceUrl
    : '';

  const matiere = row.delib_matiere_nom || row.matiere || row.theme || row.category || '';

  return {
    id: `dg_${simpleHash(title + (date || ''))}`,
    tenantSlug: townSlug,
    title: title.trim(),
    content: `<p>${title.trim().replace(/</g, '&lt;')}</p>`,
    contentText: title.trim(),
    category: detectCategory(title, matiere),
    signType: 'info',
    isPublished: true,
    source: 'data_gouv',
    sourceUrl: cleanUrl,
    publishedAt: date || null,
    modifiedAt: date || null,
  };
}

// ─── Utilitaires ─────────────────────────────────────

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

// ─── Génération des données au format data.ts ────────

function generateDataTS(notices) {
  const rows = notices.map(n => {
    const slug = n.tenantSlug || 'mairie-de-paris-centre-75001';
    const parts = [
      `id: '${n.id}'`,
      `tenantSlug: '${slug}'`,
      `title: ${JSON.stringify(n.title)}`,
      `content: ${JSON.stringify(n.content)}`,
      `category: '${n.category}'`,
      `signType: '${n.signType}'`,
      'isPublished: true',
      "source: 'data_gouv'",
      n.sourceUrl ? `sourceUrl: ${JSON.stringify(n.sourceUrl)}` : '',
      n.publishedAt ? `publishedAt: '${n.publishedAt}'` : '',
    ].filter(Boolean);

    return `  { ${parts.join(', ')} },`;
  });

  return `// ⚡ Auto-généré par scripts/import-data-gouv.mjs — le ${new Date().toISOString().split('T')[0]}
// ${notices.length} notices importées depuis ${new Set(notices.map(n => n.source)).size} sources

${rows.join('\n')}
`;
}

// ─── Main ────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  MairieConnect — Import Open Data     ║');
  console.log('╚════════════════════════════════════════╝\n');

  const datasets = await discoverAllDatasets();

  if (LIST_ONLY) {
    console.log('\n📋 Datasets disponibles :');
    console.log('   (utilisation: Ajoutez-les comme source dans data.ts)');
    for (const ds of datasets) {
      console.log(`\n  📁 ${ds.title}`);
      console.log(`     Organisation: ${ds.org}`);
      console.log(`     URL: ${ds.url}`);
      for (const r of ds.resources.slice(0, 3)) {
        console.log(`     📄 ${r.format}: ${r.url.substring(0, 80)}`);
      }
    }
    return;
  }

  console.log('\n📥 Import des données...');
  let allNotices = [];

  for (const ds of datasets.slice(0, 3)) { // Limite à 3 datasets pour le test
    console.log(`\n  Traitement: ${ds.title}`);
    const notices = await importDataset(ds);
    console.log(`  → ${notices.length} notices importées`);
    allNotices = allNotices.concat(notices);
  }

  console.log(`\n✅ ${allNotices.length} notices au total`);

  if (DRY_RUN) {
    console.log('\n🔍 Aperçu (dry-run) :');
    for (const n of allNotices.slice(0, 5)) {
      console.log(`  - ${n.title.substring(0, 60)} [${n.category}]`);
    }
    return;
  }

  // Générer l'output
  const output = generateDataTS(allNotices);
  console.log('\n📝 Données générées. À intégrer dans data.ts.');
  console.log(output.substring(0, 500) + '...');
}

main().catch(e => {
  console.error('❌ Erreur:', e.message);
  process.exit(1);
});