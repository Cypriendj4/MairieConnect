# Sources officielles des données municipales

## Objectif
Ne pas dépendre de PanneauPocket (concurrent).  
Aller chercher les infos directement **à la source** : les mairies et collectivités.

---

## Sources identifiées

### 1. data.gouv.fr (Portail national Open Data)
Déjà actif — 131+ datasets de délibérations municipales.
```
GET https://www.data.gouv.fr/api/1/datasets/?q=délibérations+conseil+municipal
GET https://www.data.gouv.fr/api/1/datasets/?q=arrêtés+municipaux
```
Les datasets référencent des ressources JSON, CSV, XML sur les portails Open Data locaux.

### 2. APIs OpenData locales (ODATA / opendata.soft)
Plateforme utilisée par des centaines de collectivités.
```
https://data.nantesmetropole.fr/api/explore/v2.1/...
https://opendata.paris.fr/api/...
https://data.grandlyon.com/...
https://data.marseille.fr/...
https://data.bordeaux-metropole.fr/...
```

### 3. Recueil des Actes Administratifs (RAA)
Publication légale obligatoire de toutes les décisions municipales.
Certaines préfectures/collectivités les publient en JSON/XML :
- Ville de Besançon → RAA en JSON
- Grand Besançon → RAA en XML
- Rosny-sous-Bois → RAA en PDF

### 4. Sites web des mairies (scraping ciblé)
Chaque mairie a une section "Arrêtés municipaux" ou "Affichage légal".
Approche par adaptateur par collectivité (liste des 50 plus grandes villes).

---

## Architecture d'import

```
┌─────────────────────────────────────────────────────────┐
│                   Sources officielles                    │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────┐  │
│  │data.gouv │  │ OpenData   │  │ RAA      │  │ Sites│  │
│  │.fr API   │  │ APIs       │  │ JSON/XML │  │ HTML │  │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └──┬───┘  │
│       │              │              │           │       │
├───────┼──────────────┼──────────────┼───────────┼───────┤
│       ▼              ▼              ▼           ▼       │
│  ┌──────────────────────────────────────────────────┐   │
│  │          MairieConnect Import Worker              │   │
│  │  - Découverte des datasets (data.gouv.fr)         │   │
│  │  - Normalisation des formats (json→notice)        │   │
│  │  - Dédoublonnage (hash contenu)                   │   │
│  │  - Attribution de la source (URL officielle)      │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │            data.json / embedded data              │   │
│  │    (ou future base de données Supabase)           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Format de donnée (déjà aligné avec notre modèle actuel)

```typescript
// Une notice officielle contient :
{
  id: string;          // ID unique MairieConnect
  tenantId: string;    // ID de la commune
  title: string;       // Titre de l'arrêté/info
  content: string;     // HTML du contenu
  category: string;    // travaux, securite, evenement, dechets...
  signType: string;    // info, alert, arrete
  isPublished: boolean;
  source: string;      // 'data_gouv', 'opendata_api', 'raa', 'scraping'
  sourceUrl: string;   // URL OFFICIELLE vers la source d'origine
  publishedAt: string; // Date de publication officielle
  modifiedAt: string;  // Dernière modification
}
```

## Implémentation immédiate (data.gouv.fr)

Un script de découverte et d'import des datasets data.gouv.fr :

```typescript
// scripts/import-data-gouv.mts
import { prisma } from '../src/lib/db'; // ou db selon déploiement

const API = 'https://www.data.gouv.fr/api/1/datasets/';

async function discoverDatasets() {
  const res = await fetch(`${API}?q=délibérations conseil municipal`);
  const data = await res.json();
  
  for (const dataset of data.data) {
    // Pour chaque dataset, trouver les resources structurées (json/csv)
    const resources = dataset.resources.filter(
      (r: any) => ['json', 'csv', 'xml'].includes(r.format?.toLowerCase())
    );
    
    for (const resource of resources) {
      await importResource(resource, dataset);
    }
  }
}

async function importResource(resource: any, dataset: any) {
  // Télécharger et normaliser les données
  // Transformer au format MairieConnect
  // Upsert dans la base
}
```

## Roadmap

| Phase | Source | Effort | Impact |
|-------|--------|--------|--------|
| 1 | data.gouv.fr API (131+ datasets) | 2 jours | ✅ Couvre les grandes villes |
| 2 | APIs OpenData locales (ODATA) | 3 jours | ✅ Couvre les métropoles |
| 3 | RAA JSON/XML (Besançon, etc.) | 2 jours | ✅ Données légales officielles |
| 4 | Scraping sites mairies (50 villes) | 5 jours | 🔄 Complétude |
| 5 | RAA PDF (extraction texte) | 3 jours | 📋 Données légales complètes |