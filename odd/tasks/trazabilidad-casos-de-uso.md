# Traceability: use cases, backlog and requirements

## Objective
Make the final requirements (`D:\Proyecto5to\Docs\RequsitosExcelFInal.xlsx`, read-only source of truth), the product backlog (`BacklogRUNCTY_PlantillaFinal.xlsx`) and the EA use case diagrams (`RunCty.eap`, Vista de Escenarios) trace one-to-one, for a traceability review: UR -> RF -> RNF -> backlog story -> use case diagram.

## Problem
- Use case model had 20 actors; requirements define 4 roles (Corredor, Administrador, Representante de club, Sistema).
- Backlog had 50 stories whose role contradicts the MODULOS actor, and RF-01-5..8 / RF-01-13..16 changed meaning vs the final Excel.
- Password recovery lived inside user management; EP-25 modeled an admin preference catalog not present in the requirements.

## Decisions
- Epics: EP-01..EP-24 map 1:1 to RF-01..RF-24, except RF-01 which splits into EP-01 Gestión de usuarios (RF-01-1..4, 9..12), EP-25 Autenticación y credenciales (RF-01-5..8) and EP-26 Preferencias de usuario (RF-01-13..16).
- Actors: Corredor, Administrador, Representante de club, Sistema. MODULOS "Usuario"/"Persona que se registra" -> Corredor; authentication use cases -> the three human roles.
- One use case per actor goal; CRUD grouped as "Gestionar X" only when one actor owns all operations. Every use case carries a CU code and its RF ids. Minimum 50 use cases.
- UR mapping is derived (the Excel does not declare UR -> RF); RF without a UR are flagged.
- Backlog stories keep their RF ids (1 story = 1 RF sub-requirement, 153 total); role from MODULOS; comments column carries priority, owner, UR, RNF, CU and diagram.
- "Cerrar sesión" is not in the final requirements, so it is not modeled.

## Tasks
- [x] T1 Use case catalog: 26 epics, 75 use cases, 4 actors, 7 include/extend relations, RF coverage 153/153, no actor conflict with MODULOS.
- [x] T2 EA rebuilt: `Casos de uso/00 - Actores`, 26 epic packages with one diagram each, `00 - Mapa de épicas y actores`. Staircase layout, no "(from …)" labels. Route: inline (design context already held; handoff cost higher than the work).
- [x] T3 Context diagram: removed 8 unused elements, flattened `sistema` package, trimmed names, renamed map provider (RNF-15) and aligned Administrador / Representante de club names.
- [ ] T4 Backlog rewritten and verified in scratchpad `Backlog_corregido.xlsx`; pending copy over `D:\Proyecto5to\Docs\BacklogRUNCTY_PlantillaFinal.xlsx` (file locked by Excel).
- [x] T5 Cross-check passed: 153/153 RF cited in EA notes; 0 backlog <-> EA mismatches (CU exists, cites RF, same epic package, same role); 28 diagrams.

## Revision 2 (user feedback: no codes in names, no single-oval diagrams)
- [x] T6 Model rebuilt at requirement granularity: 155 use cases (one per RF sub-requirement; RF-01-7 and RF-02-3 split into two goals), 40 diagrams (one per managed object), natural names, no codes in package/diagram/use case names. Codes live only in element notes.
- [x] T7 Partner file `corregido.eap` reviewed: one-use-case-per-diagram restructure of the old model; still had 3 actors ("Clubes"), recovery inside user management, admin preference catalog and unsupported proposals. Only its natural naming style was adopted.
- [x] T8 Backlog regenerated as `D:\Proyecto5to\Docs\BacklogRUNCTY_Final.xlsx` (original locked by Excel); comments reference use case and diagram by name.
- [x] T9 Cross-check: 155 use cases, 4 actors, 42 diagrams, 0 names with codes, 153/153 RF cited, 0 backlog <-> EA mismatches (exists, cites RF, on the named diagram, same role).

## Revision 3 (class diagram and final check)
- [x] T10 Class diagram for RF-07-9 in Vista Lógica: 7 classes, 9 relations, no enumerations, mapped to `safety.ts`.
- [x] T11 Recalculation includes (franjas and factores -> Recalcular índice) added, backed by `withRecalc`.
- [x] T12 Final check: 155 use cases, 4 actors, 43 diagrams, 0 coded names, 153/153 RF, 0 backlog <-> EA mismatches.
- [x] T13 CONTEXTO.md updated (sections 11, 12 and 13).

## Open points for the team
- The Excel declares no user requirement (UR) for RF-10, 11, 13, 14, 16, 18, 19, 20, 21, 22, 23; UR mapping for the rest is derived.
- "Cerrar sesión" is not a final requirement, so it was removed from the backlog.
- Context diagram keeps "Anunciante" sending campaign data, while RF-24 says the administrator registers it.
- No commits: the artifacts live outside the repo.

## Checks
- Every RF-xx-n appears in exactly one backlog row and at least one use case.
- Every use case has an actor or is the target of include/extend.
- Backlog role == MODULOS actor for all 153 rows.

## Backups
Scratchpad `backup/RunCty_antes.eap`, `backup/Backlog_antes.xlsx`.

## Progress
(updated per task)
