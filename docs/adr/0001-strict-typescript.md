# ADR 0001: Strict TypeScript (No `any` / No `unknown`)

## Status
Accepted (2025-12-28)

## Context
The codebase had multiple type-escape hatches (`any`, `Record<string, unknown>`, `as any`, `as unknown as`) that bypassed compiler guarantees and hid real bugs (e.g. mismatched DB field names like `viber_number` vs `viberNumber`).

## Decision
- Treat TypeScript as a production safety system:
  - Disallow `any` and `unknown` in application code.
  - Disallow chained casts (`as unknown as T`) and avoid `as T` assertions where possible.
- Use typed boundaries instead of escape hatches:
  - Zod schemas at HTTP/request boundaries and CSV imports.
  - Kysely `Selectable` / `Insertable` / `Updateable` for DB reads/writes.
  - `JsonValue` / `JsonObject` for JSON columns and “metadata” fields.
- Centralize Bun-friendly TS settings in `@repo/typescript-config/bun.json`.

## Consequences
- More up-front typing work, but fewer runtime surprises and safer refactors.
- Generated files may require explicit lint/type exclusions if they cannot meet these rules.
- Boundary modules must validate inputs rather than casting.

