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
- `app/ui/MathsApp.tsx` : interface élève, progression locale et aperçu
  enseignant.
- `tests/journey-engine.test.ts` et `tests/all-journeys.test.ts` : vérification
  de toutes les branches et de l'absence de cul-de-sac.

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

## Données et suivi

La progression élève est conservée uniquement dans le navigateur. À la fin du
parcours, une fiche A4 reprend la conjecture, les apprentissages, les formules
et les exemples : elle peut être imprimée, enregistrée en PDF ou téléchargée en
texte. Le site est accessible sans compte.

L'espace enseignant est une démonstration explicite fondée sur des données
fictives et anonymisées ; aucun compte, suivi de classe réel ou donnée
personnelle n'est créé.

## Vérification locale

```bash
pnpm install
pnpm run dev
pnpm run test:journey
pnpm run build
pnpm run build:pages
```
