# self-review r3: has-play-test-convention

## deeper look: did i miss test files?

the yield documents two journeys:
1. **journey 1**: CLI workflow (`declastruct plan`, `declastruct apply`)
2. **journey 2**: SDK preset rules (direct function calls)

but my test sketch only named one file:
- `domainRuleRedirect.play.integration.test.ts`

**issue found**: journey 1 (CLI) is not covered.

## where does CLI journey test go?

from internal research (3.1.3.research.internal.product.code.test._):
- extant acceptance test: `src/contract/sdks/declastruct.acceptance.test.ts`
- this file tests the full CLI workflow

**correct approach**:
- CLI journeys **extend** the extant acceptance test file
- they do not need a new `.play.acceptance.test.ts` file
- the extant pattern already tests `plan` and `apply` CLI commands

from the test patterns research:
```typescript
// src/contract/sdks/declastruct.acceptance.test.ts
given('a declastruct resources file with cloudflare provider', () => {
  when('[t0] plan is run via declastruct CLI', () => { ... });
  when('[t1] apply is run via declastruct CLI', () => { ... });
});
```

**fix**: update yield file to note that CLI journeys extend `declastruct.acceptance.test.ts`.

## corrected test file plan

| journey | test file | runner |
|---------|-----------|--------|
| CLI workflow (plan/apply) | `declastruct.acceptance.test.ts` (extend) | acceptance |
| SDK operations (get/set) | `domainRuleRedirect.play.integration.test.ts` (new) | integration |

## why the yield test sketch is still correct

the test sketch I documented is for SDK-level operations:
```typescript
// domainRuleRedirect.play.integration.test.ts
describe('redirect rule journey', () => {
  given('[case1] zone with no redirect rules', () => { ... });
});
```

this is the right file for SDK journey tests. CLI journeys go in the extant acceptance test.

## update needed in yield file?

**no update needed** — the yield already notes:
- "extend acceptance test resources file to include redirect rules"
- the CLI journey (journey 1) is documented via `declastruct plan` and `declastruct apply`

the test convention holds:
- SDK journeys → `.play.integration.test.ts`
- CLI journeys → extend `declastruct.acceptance.test.ts`

## conclusion

convention holds. initial concern was unfounded — I had already documented the correct pattern. CLI journeys extend extant acceptance test; SDK journeys use new play integration tests.

