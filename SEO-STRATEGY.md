# MairieConnect — Stratégie SEO Géo & Roadmap simplifiée

## Pourquoi ce site va marcher en SEO

| Facteur SEO | MairieConnect | Concurrents |
|-------------|--------------|-------------|
| Pages uniques par commune | ✅ Oui | ❌ PanneauPocket = app mobile sans SEO |
| Pages uniques par notice | ✅ Oui | ❌ Données derrière une app |
| URLs propres | ✅ `/commune/orvault/decision-123` | ❌ PanneauPocket = `/ville/895350833-01-...` |
| Schema.org | ✅ À ajouter | ❌ Aucun |
| Liens sources officiels | ✅ data.gouv.fr | ❌ Pas de source |
| Contenu frais | ✅ Mise à jour régulière | ✅ Mise à jour quotidienne |
| Performance | ✅ Next.js SSR | ✅ App native |

## Architecture simplifiée (Phase 1)

```
data/mairieconnect.json   ← Fichier unique, généré par le script
                                     ↓
Next.js (SSR)             ← Pages générées à la demande
  ├─ /                    ← Accueil (stats + liste communes)
  ├─ /commune/[slug]      ← Page commune (SEO : nom + code postal dans l'URL)
  └─ /commune/[slug]/[id] ← Page notice (SEO : contenu unique)
```

**Plus de base de données. Plus de bugs de comptage. Un seul fichier JSON.**

## Plan d'action immédiat

### Étape 1 — Schema.org (aujourd'hui)
Ajouter JSON-LD sur chaque page pour que Google comprenne le contenu :
- Accueil : `WebSite` + `LocalGovernment` pour chaque commune
- Page commune : `GovernmentOrganization` + `WebPage`
- Page notice : `Article` + `GovernmentService`

### Étape 2 — Sitemap automatique
Générer un sitemap.xml avec TOUTES les pages :
- 1 entrée par commune
- 1 entrée par notice
- Balise `<lastmod>` avec la date de mise à jour

### Étape 3 — Robots.txt
✅ Déjà fait implicitement (Next.js génère robots.txt par défaut)

### Étape 4 — Métadonnées riches
- Title : "Arrêtés municipaux de [Ville] — MairieConnect"
- Description : "Retrouvez tous les arrêtés, délibérations et informations de la mairie de [Ville]"
- Open Graph → partage social propre
- Twitter Cards

### Étape 5 — Contenu frais (automatique)
Un cron GitHub Actions qui relance le script d'import chaque semaine :
```
.github/workflows/refresh-data.yml
  → node scripts/generate-data.mjs
  → git commit data/mairieconnect.json
  → git push
  → Vercel rebuild automatiquement
```

## Ce qu'on NE fait PAS
- ❌ Base de données (trop complexe, pas nécessaire pour le MVP)
- ❌ Authentification / Dashboard (distraction SEO)
- ❌ PanneauPocket comme source (concurrent)
- ❌ Multi-sources avant d'avoir une source qui marche

## Résultat attendu
```
3 villes avec 2 302 notices → 2 305 pages indexées
URL: /commune/mairie-d-orvault-44700 → indexé pour "Orvault arrêtés municipaux"
URL: /commune/mairie-d-orvault-44700/dg_xxx → indexé pour chaque délibération

→ Positionnement Google sur les recherches locales de chaque commune
→ Trafic organique des citoyens qui cherchent les infos de leur mairie
```