## Changement

<!-- Ce que fait cette modification, et pourquoi. -->

## Checklist sécurité (docs/securite/checklist.md)

- [ ] Entrées utilisateur validées (côté base : contraintes, RLS, fonctions `security definer` qui vérifient les droits)
- [ ] Nouvelle table : RLS activée + politiques + tests dans `tests/sql`
- [ ] Requêtes paramétrées uniquement (client Supabase / `format('%I', …)` en SQL dynamique)
- [ ] Aucun secret dans le code (hook pre-commit passé) ; variables `NEXT_PUBLIC_` / `EXPO_PUBLIC_` seulement pour des valeurs publiques
- [ ] Aucune donnée personnelle dans les journaux ni dans les URLs
- [ ] Messages d'erreur génériques pour l'utilisateur
- [ ] Nouvelle source externe (script, image, iframe) ajoutée à la CSP dans `src/proxy.ts`
- [ ] Permissions mobiles demandées seulement au moment où elles servent
