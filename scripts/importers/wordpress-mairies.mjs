/**
 * MairieConnect — Import depuis les sites WordPress des mairies
 * 
 * Connexion à l'API REST WordPress pour récupérer :
 *   - Événements (event)
 *   - Points d'intérêt touristique (poi)  
 *   - Actualités (news)
 */

const WP_SITES = [
  {
    name: 'Orvault',
    slug: 'mairie-d-orvault-44700',
    tenantId: 't_orvault',
    base: 'https://www.orvault.fr/wp-json/wp/v2',
    types: ['event', 'news'],
  },
  {
    name: 'Saint-Herblain',
    slug: 'mairie-de-saint-herblain-44800',
    tenantId: 't_saint-herblain',
    base: 'https://www.saint-herblain.fr/wp-json/wp/v2',
    types: ['event', 'news'],
  },
  {
    name: 'Saint-Louis',
    slug: 'mairie-de-saint-louis-68300',
    tenantId: 't_saint-louis',
    base: 'https://www.ville-saint-louis.fr/wp-json/wp/v2',
    types: ['event', 'news'],
  },
];

const CATEGORY_MAP = {
  'concert': 'evenement',
  'spectacle': 'evenement',
  'exposition': 'evenement',
  'festival': 'evenement',
  'marché': 'evenement',
  'atelier': 'evenement',
  'conférence': 'evenement',
  'bal': 'evenement',
  'théâtre': 'evenement',
  'danse': 'evenement',
  'musique': 'evenement',
  'cinéma': 'evenement',
  'sport': 'sport',
  'tourisme': 'tourisme',
  'visite': 'tourisme',
  'patrimoine': 'tourisme',
  'monument': 'tourisme',
};

function detectCategory(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(kw)) return cat;
  }
  return 'evenement';
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

function extractDate(item) {
  return item.event_date || item.date || item.modified || null;
}

function extractImage(item) {
  if (item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    return item._embedded['wp:featuredmedia'][0].source_url;
  }
  return null;
}

function extractCategories(item) {
  if (!item._embedded?.['wp:term']) return [];
  const cats = [];
  for (const terms of item._embedded['wp:term']) {
    for (const term of terms) {
      cats.push(term.name);
    }
  }
  return cats;
}

export async function importAll({ dryRun = false } = {}) {
  console.log('  Connexion aux sites WordPress des mairies...');
  const allItems = [];

  for (const site of WP_SITES) {
    console.log(`\n  📍 ${site.name}...`);

    for (const type of site.types) {
      const url = `${site.base}/${type}?per_page=20&_embed=1`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.log(`    ⏭️  ${type}: HTTP ${res.status}`);
          continue;
        }

        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) {
          console.log(`    ⏭️  ${type}: 0 résultat`);
          continue;
        }

        let count = 0;
        for (const item of items) {
          const title = item.title?.rendered || '';
          if (!title) continue;

          const content = item.content?.rendered || item.excerpt?.rendered || '';
          const date = extractDate(item);
          const image = extractImage(item);
          const link = item.link || '';
          const categories = extractCategories(item);

          allItems.push({
            id: `wp_${simpleHash(title + (date || ''))}`,
            tenantSlug: site.slug,
            tenantId: site.tenantId,
            title: title.trim().substring(0, 200),
            content: content || `<p>${title.trim()}</p>`,
            category: detectCategory(title, content),
            signType: 'event',
            isPublished: true,
            source: 'mairie_website',
            sourceUrl: link,
            publishedAt: date,
            modifiedAt: date,
            imageUrl: image,
            tags: categories,
          });
          count++;
        }
        console.log(`    ✅ ${type}: ${count} élément(s)`);
      } catch (e) {
        console.log(`    ❌ ${type}: ${e.message}`);
      }
    }
  }

  console.log(`\n  📦 Total: ${allItems.length} éléments importés`);
  return allItems;
}