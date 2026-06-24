# Agents Guidelines (Satori)

## TypeScript Strictness (Required)

- **No `any`** in TypeScript (no `: any`, no `as any`, no `Promise<any>`, no `Record<string, any>`).
- **No `unknown`** in TypeScript (no `: unknown`, no `Record<string, unknown>`, no `unknown[]`).
- **No assertion laundering**: never use chained casts like `as unknown as T`.
- **Avoid type assertions (`as T`)**. Prefer:
  - Zod schemas + `z.infer` at boundaries (HTTP, env, DB json, file/CSV import).
  - Narrowing helpers / type guards.
  - `satisfies` for shape-checking without widening.
  - Kysely `Selectable` / `Insertable` / `Updateable` for DB IO types.
- Generated/vendor files may include `any` / `@ts-nocheck` (e.g. `apps/admin/src/routeTree.gen.ts`). Do not hand-edit these; keep strictness in authored app code.
- For JSON-like data, use `JsonValue` / `JsonObject` types (see `apps/server/src/types.ts` and `apps/admin/src/types/json.ts`) instead of `Record<string, *>`.

## Repo Hygiene (Required)

- Keep `pnpm build` green before committing.
- If behavior changes or a new convention is introduced, document it in `docs/` (prefer `docs/adr/`).
