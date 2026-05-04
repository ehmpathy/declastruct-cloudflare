# self-review r2: has-play-test-convention

## review question

are journey tests named correctly with `.play.test.ts` suffix?

## what i documented

in the yield file, test sketch uses:
```typescript
// domainRuleRedirect.play.integration.test.ts
```

## does this follow convention?

**yes** — the file uses `.play.integration.test.ts` suffix.

**why integration and not plain play?**
- journey tests for redirect rules require live cloudflare API access
- repo test runners use `.integration.test.ts` pattern for API tests
- `.play.integration.test.ts` correctly combines:
  - `.play` — indicates journey test (step-by-step user experience)
  - `.integration` — runs with integration test runner (live API)
  - `.test.ts` — jest test file

## verification against extant patterns

from internal research (3.1.3.research.internal.product.code.test._):
- unit tests: `.test.ts`
- integration tests: `.integration.test.ts`
- acceptance tests: `.acceptance.test.ts`

journey tests for API operations should use `.play.integration.test.ts`.

## alternative considered

**`.play.acceptance.test.ts`** — for CLI-based journey tests. the yield also documents CLI journeys (`declastruct plan`, `declastruct apply`). these would use acceptance runner.

but the test sketch I documented is SDK-level (direct function calls), so `.play.integration.test.ts` is correct.

## conclusion

convention holds. test file named `domainRuleRedirect.play.integration.test.ts` follows the pattern:
- `.play` for journey tests
- `.integration` for live API tests

