# self-review r7: has-journey-acceptance-test

## what the guide requires

a journey acceptance test must:
- exercise a complete user journey through multiple timesteps
- cover a realistic scenario
- include edge cases along the way
- snapshot at each checkpoint
- verify final expected outcome

## what the blueprint declares

the acceptance test section shows:
- individual snapshots for plan, apply, re-plan
- error snapshots for various failure modes

**this is not a journey test — it's a collection of isolated snapshots.**

## gap found

**the blueprint lacks a journey acceptance test structure.**

the snapshots describe WHAT to capture, but not the WHEN (timesteps) or HOW (journey flow).

## fix: add journey test declaration

### journey: redirect rule lifecycle

```typescript
describe('domainRuleRedirect.journey', () => {
  given('[case1] redirect rule lifecycle', () => {
    // t0: initial state — no rules exist
    when('[t0] zone has no redirect rules', () => {
      then('plan shows CREATE for HTTP→HTTPS rule', () => {
        expect(planStdout).toMatchSnapshot();
      });
    });

    // t1: create first rule
    when('[t1] apply HTTP→HTTPS redirect rule', () => {
      then('apply succeeds', () => {
        expect(applyStdout).toMatchSnapshot();
      });
    });

    // t2: add second rule
    when('[t2] add root→www redirect rule', () => {
      then('plan shows CREATE for root→www, KEEP for HTTP→HTTPS', () => {
        expect(planStdout).toMatchSnapshot();
      });
      then('apply succeeds', () => {
        expect(applyStdout).toMatchSnapshot();
      });
    });

    // t3: idempotency check
    when('[t3] re-plan with same resources', () => {
      then('plan shows 0 changes (KEEP for both)', () => {
        expect(planStdout).toMatchSnapshot();
      });
    });

    // t4: update a rule
    when('[t4] update HTTP→HTTPS to use 308 instead of 301', () => {
      then('plan shows UPDATE for HTTP→HTTPS, KEEP for root→www', () => {
        expect(planStdout).toMatchSnapshot();
      });
      then('apply succeeds', () => {
        expect(applyStdout).toMatchSnapshot();
      });
    });

    // t5: delete a rule
    when('[t5] remove root→www rule', () => {
      then('plan shows DELETE for root→www, KEEP for HTTP→HTTPS', () => {
        expect(planStdout).toMatchSnapshot();
      });
      then('apply succeeds', () => {
        expect(applyStdout).toMatchSnapshot();
      });
    });

    // t6: final state
    when('[t6] verify final state', () => {
      then('only HTTP→HTTPS rule remains', () => {
        expect(finalState).toMatchSnapshot();
      });
    });
  });
});
```

### journey: error recovery

```typescript
describe('domainRuleRedirect.journey.errors', () => {
  given('[case2] error recovery flow', () => {
    when('[t0] attempt plan with invalid zone ref', () => {
      then('error shows zone not found', () => {
        expect(stderr).toMatchSnapshot();
      });
    });

    when('[t1] fix zone ref and retry plan', () => {
      then('plan succeeds', () => {
        expect(planStdout).toMatchSnapshot();
      });
    });

    when('[t2] apply with invalid expression', () => {
      then('error shows expression invalid', () => {
        expect(stderr).toMatchSnapshot();
      });
    });

    when('[t3] fix expression and retry apply', () => {
      then('apply succeeds', () => {
        expect(applyStdout).toMatchSnapshot();
      });
    });
  });
});
```

## fix applied to blueprint

added journey test section under test tree:

```markdown
### journey tests

```
src/contract/sdks/
└── [+] domainRuleRedirect.journey.acceptance.test.ts
    ├── [case1] redirect rule lifecycle
    │   ├── [t0] zone has no redirect rules
    │   ├── [t1] apply HTTP→HTTPS redirect rule
    │   ├── [t2] add root→www redirect rule
    │   ├── [t3] re-plan with same resources (idempotency)
    │   ├── [t4] update HTTP→HTTPS to use 308
    │   ├── [t5] remove root→www rule
    │   └── [t6] verify final state
    └── [case2] error recovery flow
        ├── [t0] attempt plan with invalid zone ref
        ├── [t1] fix zone ref and retry plan
        ├── [t2] apply with invalid expression
        └── [t3] fix expression and retry apply
```
```

## verification

| requirement | status |
|-------------|--------|
| multiple timesteps | yes (7 timesteps in lifecycle) |
| realistic scenario | yes (add, update, delete, verify) |
| edge cases | yes (error recovery journey) |
| snapshots at checkpoints | yes (each timestep has snapshot) |
| final state verification | yes (t6 verifies final state) |
