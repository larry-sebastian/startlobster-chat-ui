# FEEDBACK.md — PinchChat Feedback Queue

## Item #1
- **Date:** 2026-02-11
- **Priority:** high
- **Status:** done
- **Completed:** 2026-02-11
- **Description:** Migrer le projet de "ClawChat" vers "PinchChat"
  - Renommer le repo GitHub : MarlBurroW/clawchat → MarlBurroW/pinchchat
    - ⚠️ Le rename de repo se fait via `gh api -X PATCH /repos/MarlBurroW/clawchat -f name=pinchchat`
  - Mettre à jour tous les fichiers : README, CONTRIBUTING, package.json, title HTML, composants, etc.
  - Remplacer toutes les occurrences de "ClawChat" / "clawchat" par "PinchChat" / "pinchchat"
  - Mettre à jour le dossier local : `mv ~/clawchat ~/pinchchat` (et adapter le cron)
  - Vérifier que le build passe après migration
  - Commit + push
