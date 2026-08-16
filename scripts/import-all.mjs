#!/usr/bin/env node
/**
 * MairieConnect — Import multi-source des données officielles
 *
 * Usage :
 *   node scripts/import-all.mjs                           # Import complet
 *   node scripts/import-all.mjs --dry-run                 # Simulation
 *   node scripts/import-all.mjs --source data-gouv        # Une seule source
 */

const DRY_RUN = process.argv.includes('--dry-run');
const FILTER = process.argv.find(a => a.startsWith('--source='))?.split('=')[1] || null;

console.log('╔════════════════════════════════════════════╗');
console.log('║  MairieConnect — Import multi-source      ║');
console.log('╚════════════════════════════════════════════╝\n');

// ─── Sources disponibles ─────────────────────────────

const SOURCES = [
  { name: 'data-gouv',  label: 'data.gouv.fr',          file: './importers/data-gouv.mjs' },
  { name: 'opendata-locales', label: 'APIs OpenData locales', file: './importers/opendata-locales.mjs' },
];

// ─── Exécution ───────────────────────────────────────

async function main() {
  let allNotices = [];
  let stats = [];

  for (const source of SOURCES) {
    if (FILTER && source.name !== FILTER) continue;

    console.log(`\n📦 ${source.label}...`);
    try {
      const mod = await import(source.file);
      const notices = await mod.importAll({ dryRun: DRY_RUN });
      allNotices = allNotices.concat(notices);
      stats.push({ name: source.label, count: notices.length });
      console.log(`  ✅ ${notices.length} notices`);
    } catch (e) {
      console.error(`  ❌ Erreur: ${e.message}`);
      stats.push({ name: source.label, count: 0, error: e.message });
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Résumé :');
  for (const s of stats) {
    console.log(`  ${s.error ? '❌' : '✅'} ${s.name}: ${s.count} notices${s.error ? ` — ${s.error}` : ''}`);
  }
  console.log(`\n📈 Total: ${allNotices.length} notices importées`);

  if (!DRY_RUN && allNotices.length > 0) {
    console.log('\n💾 Génération du fichier de données...');
    // À implémenter : génération de data.ts
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });