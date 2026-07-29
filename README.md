# Horizon Maths

Site pédagogique de mathématiques pour la voie professionnelle, conçu autour
de parcours adaptatifs courts et explicables.

Version publique sans connexion :
<https://yohanpasselaiguepmaths.github.io/horizon-maths/>

## Architecture

- `app/content/curriculum.ts` : catalogue des niveaux, spécialités et chapitres.
- `app/content/geometricJourney.ts` : contenu du parcours pilote, aides,
  rétroactions, embranchements et métadonnées enseignantes.
- `app/engine/journeyEngine.ts` : moteur déterministe qui classe une réponse et
  choisit l'étape suivante.
- `app/engine/studentTrace.ts` : synthèse personnelle, reformulation positive
  des détours et export texte.
- `app/ui/MathsApp.tsx` : interface élève, progression locale et aperçu
  enseignant.
- `tests/journey-engine.test.ts` : vérification de toutes les branches et de
  l'absence de cul-de-sac.

Les contenus pédagogiques sont séparés du moteur et de l'interface. Le parcours
pilote ne dépend d'aucun service d'IA : à réponse identique, le même chemin est
toujours proposé.

## Ajouter un chapitre

1. Ajouter sa fiche dans `app/content/curriculum.ts`.
2. Créer un fichier de parcours dans `app/content/` en reprenant le schéma de
   `geometricJourney.ts`.
3. Décrire les étapes, critères de réponse, rétroactions et destinations de
   chaque branche.
4. Référencer le nouveau parcours dans le registre de l'interface.
5. Ajouter un test de graphe et un test pour chaque embranchement.

Un chapitre non encore relié à un parcours reste automatiquement visible avec
le statut « parcours en préparation ».

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
