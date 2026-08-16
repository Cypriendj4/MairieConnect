#!/usr/bin/env node
/**
 * Génère le fichier de données MairieConnect
 * 
 * Usage :
 *   node scripts/generate-data.mjs              # Import + génération
 *   node scripts/generate-data.mjs --no-import   # Régénérer depuis les données existantes
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const SKIP_IMPORT = process.argv.includes('--no-import');

// ─── Villes de base (hardcodées) ─────────────────────

const CITIES = [
  { id: 't_paris', name: 'Mairie de Paris Centre', slug: 'mairie-de-paris-centre-75001', postCode: '75001', cityName: 'Paris' },
  { id: 't_lyon', name: 'Mairie de Lyon', slug: 'mairie-de-lyon-69001', postCode: '69001', cityName: 'Lyon' },
  { id: 't_marseille', name: 'Mairie de Marseille', slug: 'mairie-de-marseille-13001', postCode: '13001', cityName: 'Marseille' },
  { id: 't_bordeaux', name: 'Mairie de Bordeaux', slug: 'mairie-de-bordeaux-33000', postCode: '33000', cityName: 'Bordeaux' },
  { id: 't_lille', name: 'Mairie de Lille', slug: 'mairie-de-lille-59000', postCode: '59000', cityName: 'Lille' },
  { id: 't_issy', name: 'Mairie d\'Issy-les-Moulineaux', slug: 'mairie-d-issy-les-moulineaux-92130', postCode: '92130', cityName: 'Issy-les-Moulineaux' },
  { id: 't_orvault', name: 'Mairie d\'Orvault', slug: 'mairie-d-orvault-44700', postCode: '44700', cityName: 'Orvault' },
  { id: 't_saint-louis', name: 'Mairie de Saint-Louis', slug: 'mairie-de-saint-louis-68300', postCode: '68300', cityName: 'Saint-Louis' },
  { id: 't_saint-herblain', name: 'Mairie de Saint-Herblain', slug: 'mairie-de-saint-herblain-44800', postCode: '44800', cityName: 'Saint-Herblain' },
  { id: 't_tours', name: 'Mairie de Tours', slug: 'mairie-de-tours-37000', postCode: '37000', cityName: 'Tours' },
  { id: 't_rennes', name: 'Mairie de Rennes', slug: 'mairie-de-rennes-35000', postCode: '35000', cityName: 'Rennes' },
  { id: 't_nancy', name: 'Mairie de Nancy', slug: 'mairie-de-nancy-54000', postCode: '54000', cityName: 'Nancy' },
  { id: 't_angers', name: 'Mairie d\'Angers', slug: 'mairie-d-angers-49000', postCode: '49000', cityName: 'Angers' },
  { id: 't_brest', name: 'Mairie de Brest', slug: 'mairie-de-brest-29200', postCode: '29200', cityName: 'Brest' },
  { id: 't_clermont', name: 'Mairie de Clermont-Ferrand', slug: 'mairie-de-clermont-ferrand-63000', postCode: '63000', cityName: 'Clermont-Ferrand' },
  { id: 't_poitiers', name: 'Mairie de Poitiers', slug: 'mairie-de-poitiers-86000', postCode: '86000', cityName: 'Poitiers' },
  { id: 't_toulouse', name: 'Mairie de Toulouse', slug: 'mairie-de-toulouse-31000', postCode: '31000', cityName: 'Toulouse' },
  { id: 't_saint-etienne', name: 'Mairie de Saint-Étienne', slug: 'mairie-de-saint-etienne-42000', postCode: '42000', cityName: 'Saint-Étienne' },
  { id: 't_nantes', name: 'Mairie de Nantes', slug: 'mairie-de-nantes-44000', postCode: '44000', cityName: 'Nantes' },
  { id: 't_montpellier', name: 'Mairie de Montpellier', slug: 'mairie-de-montpellier-34000', postCode: '34000', cityName: 'Montpellier' },
  { id: 't_strasbourg', name: 'Mairie de Strasbourg', slug: 'mairie-de-strasbourg-67000', postCode: '67000', cityName: 'Strasbourg' },
  { id: 't_grenoble', name: 'Mairie de Grenoble', slug: 'mairie-de-grenoble-38000', postCode: '38000', cityName: 'Grenoble' },
  { id: 't_nice', name: 'Mairie de Nice', slug: 'mairie-de-nice-06000', postCode: '06000', cityName: 'Nice' },
];

const CITY_SLUG_TO_ID = Object.fromEntries(CITIES.map(c => [c.slug, c.id]));

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  MairieConnect — Générateur de données ║');
  console.log('╚════════════════════════════════════════╝\n');

  // 1. Importer les données
  let importedNotices = [];

  if (!SKIP_IMPORT) {
    console.log('📦 Importation depuis les sources...\n');
    
    const dataGouv = await import('./importers/data-gouv.mjs');
    const dataGouvNotices = await dataGouv.importAll();
    importedNotices = importedNotices.concat(dataGouvNotices);
  } else {
    console.log('⏭️  Import ignoré (--no-import)');
  }

  // 2. Associer les notices aux villes
  const citySlugMap = Object.fromEntries(CITIES.map(c => [c.slug, c.id]));
  
  let matched = 0;
  let unmatched = 0;

  const matchedNotices = [];
  for (const notice of importedNotices) {
    const slug = notice.tenantSlug;
    if (slug && citySlugMap[slug]) {
      matchedNotices.push({
        ...notice,
        tenantId: citySlugMap[slug],
        tenantSlug: undefined,
      });
      matched++;
    } else {
      unmatched++;
    }
  }

  console.log(`\n📊 Stats :`);
  console.log(`  🏙️  ${CITIES.length} villes`);
  console.log(`  📄 ${matchedNotices.length} notices associées à une ville`);
  if (unmatched > 0) console.log(`  ⚠️  ${unmatched} notices non associées (ignorées)`);

  // 3. Compter par ville
  const byCity = {};
  for (const n of matchedNotices) {
    const cityId = n.tenantId || '?';
    byCity[cityId] = (byCity[cityId] || 0) + 1;
  }
  console.log('');
  for (const [id, count] of Object.entries(byCity).sort((a, b) => b[1] - a[1])) {
    const city = CITIES.find(c => c.id === id);
    const name = city ? city.name.padEnd(30) : id;
    console.log(`  🏘️  ${name} ${count} notices`);
  }

  // 4. Générer le fichier
  console.log(`\n💾 Génération du fichier...`);

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    cities: CITIES,
    notices: matchedNotices.map(n => ({
      id: n.id,
      tenantId: n.tenantId,
      title: n.title,
      content: n.content,
      category: n.category,
      signType: n.signType || 'info',
      isPublished: true,
      source: n.source,
      sourceUrl: n.sourceUrl || '',
      publishedAt: n.publishedAt || null,
      modifiedAt: n.modifiedAt || null,
    })),
  };

  writeFileSync(join(DATA_DIR, 'mairieconnect.json'), JSON.stringify(output, null, 2));
  console.log(`  ✅ Données écrites dans data/mairieconnect.json`);
  console.log(`  📦 ${output.notices.length} notices · ${output.cities.length} villes`);
}

main().catch(e => { console.error('\n❌ Erreur:', e); process.exit(1); });