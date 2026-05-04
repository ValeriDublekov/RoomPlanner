# Tooling And Validation

## Build And Run Commands

From `package.json`:

- `npm run dev`: Vite dev server
- `npm run build`: production build
- `npm run preview`: preview build output
- `npm run lint`: actually `tsc --noEmit`
- `npm test`: `vitest run`

Important detail:

- `lint` is currently a typecheck, not ESLint

## Vite Notes

`vite.config.ts` includes:

- React plugin
- Tailwind Vite plugin
- alias `@` mapped to the repository root, not specifically to `src`
- production base path `/RoomPlanner/`

This alias behavior matters when fixing imports.

## Test Surfaces Currently Visible

- `src/lib/geometry.test.ts`
- `src/lib/export.test.ts`

If a change touches geometry, exports, scene generation, or store behavior, prefer extending the nearest existing tests.

## Recommended Validation Order

For small local changes:

1. run the narrowest relevant test first
2. run `npm run lint` for TypeScript safety
3. only then widen to `npm test` or `npm run build` if needed

## Good Defaults For Agents

- prefer focused edits over folder-wide churn
- avoid mass import rewrites unless the task is explicitly about import boundaries
- do not assume React render paths are cheap; store subscriptions can be broad
- do not assume local save and cloud save share identical behavior paths
