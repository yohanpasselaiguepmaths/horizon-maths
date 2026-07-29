# Horizon Maths

Site pédagogique de mathématiques pour la voie professionnelle, conçu autour
de parcours adaptatifs courts et explicables.

Version publique sans connexion :
<https://yohanpasselaiguepmaths.github.io/horizon-maths/>

Les 23 chapitres du catalogue proposent désormais un parcours actif : 6 en
Seconde, 10 en Première et 7 en Terminale.

## Architecture

- `app/content/curriculum.ts` : catalogue des niveaux, spécialités et chapitres.
- `app/content/journeyTypes.ts` : structure commune à tous les parcours.
- `app/content/geometricJourney.ts` : parcours approfondi, aides,
  rétroactions, embranchements et métadonnées enseignantes.
- `app/content/allJourneys.ts` : contenus et embranchements des 22 autres
  parcours.
- `app/engine/journeyEngine.ts` : moteur déterministe qui classe une réponse et
  choisit l'étape suivante.
- `app/engine/studentTrace.ts` : synthèse personnelle, reformulation positive
  des détours et export texte.
- `app/data/cloud.ts` : comptes, synchronisation et opérations sécurisées.
- `app/ui/AccountViews.tsx` : connexion élève, espace personnel et tableau
  enseignant.
- `app/ui/MathsApp.tsx` : interface, navigation et progression.
- `supabase/migrations/` : schéma, règles d'accès et fonctions de la base.
- `tests/` : vérification des parcours, des traces et des garanties du schéma.

Les contenus pédagogiques sont séparés du moteur et de l'interface. Les
parcours ne dépendent d'aucun service d'IA : à réponse identique, le même chemin
est toujours proposé.

## Ajouter un chapitre

1. Ajouter sa fiche dans `app/content/curriculum.ts`.
2. Créer un fichier de parcours dans `app/content/` en reprenant le schéma de
   `geometricJourney.ts`.
3. Décrire les étapes, critères de réponse, rétroactions et destinations de
   chaque branche.
4. Référencer le nouveau parcours dans `allJourneys.ts`.
5. Ajouter un test de graphe et un test pour chaque embranchement.

Le parcours approfondi sur les suites géométriques comporte huit étapes. Les 22
autres parcours suivent une structure resserrée en six étapes : diagnostic,
détour guidé ou défi, méthode, application, conjecture et trace élève.

## Espaces personnels et suivi

Un élève se connecte avec un code de classe, un pseudonyme, un identifiant et un
mot de passe. Aucun nom complet, aucune adresse e-mail élève et aucun compte
ChatGPT ne sont nécessaires. La progression est synchronisée entre les
appareils et reste aussi disponible localement pendant le travail.

À la fin du parcours, une fiche A4 reprend la conjecture, les apprentissages,
les formules et les exemples : elle peut être imprimée, enregistrée en PDF ou
téléchargée en texte. L'élève peut également exporter ou supprimer son espace.

L'enseignant crée ses classes et les accès pseudonymes. Son tableau montre les
parcours commencés ou terminés, les voies empruntées et les conjectures, sans
note ni classement. Il peut exporter une classe, renouveler un mot de passe,
effacer une progression ou supprimer un espace.

Les mots de passe élèves sont hachés, les sessions expirent, les tentatives
répétées sont temporairement bloquées et les règles d'accès isolent les
données de chaque enseignant. Aucune clé d'administration n'est envoyée au
navigateur.

## Connexion de la base Supabase

1. Créer un projet Supabase dans une région européenne.
2. Exécuter le fichier
   `supabase/migrations/20260729160000_horizon_accounts.sql` dans l'éditeur SQL.
3. Récupérer l'URL du projet et sa clé publique.
4. Ajouter les secrets GitHub `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Relancer le déploiement GitHub Pages.

Le fichier `.env.example` documente les deux variables nécessaires en local.
Une clé `service_role` ou une clé secrète ne doit jamais être placée dans le
site.

## Vérification locale

```bash
pnpm install
pnpm run dev
pnpm run test:journey
pnpm run build
pnpm run build:pages
```
