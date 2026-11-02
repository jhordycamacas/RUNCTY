# Features

Each feature (e.g. `auth`, `account`, `preferences`) lives in its own folder and is split into layers:

| Layer | Contains | May depend on |
| --- | --- | --- |
| `domain/` | Entities, value objects, validation schemas, repository interfaces (ports) | nothing outside `domain` |
| `application/` | Use cases and React Query hooks that orchestrate them | `domain` |
| `infrastructure/` | Firebase implementations of the ports | `domain`, `@/core/firebase` |
| `presentation/` | Screens and feature components (container + presentational) | `application`, `@/core/ui` |

Shared, feature-agnostic code goes in `src/core/`. Features never import from each other's `infrastructure/` or internal files: they use another feature only through its public `index.ts` (or its `application/` hooks). Each feature wires its ports to Firebase in a private `composition.ts`; screens never import `firebase/*`.

Screens receive navigation as callbacks; the navigators live in `src/app/navigation/`.
