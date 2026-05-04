# self-review r5: has-pruned-yagni — decisive action

## r4 flagged candidates but didn't decide

r4 identified two YAGNI candidates:
1. getOneDomainRuleRedirect
2. play integration test

r4 kept both "for pattern consistency" — but that's not decisive.

the guide says: "if a component was not requested, delete it or flag it as an open question for the wisher to decide."

---

## decision 1: getOneDomainRuleRedirect

### the facts
- **not in wish**: wisher didn't ask for "lookup individual rules"
- **not in vision usecase**: vision shows rules declared and applied, not individual lookup
- **set doesn't need it**: set calls getAll + filter internally
- **del doesn't need it**: del calls getAll + filter internally
- **pattern consistency**: DNS records have getOne

### the decision
**delete getOneDomainRuleRedirect from v1**

reasons:
1. not requested in wish or vision
2. not needed internally (set/del use getAll + filter)
3. can add in v2 if users request it
4. reduces code surface area

### fixes applied

removed from filediff tree:
```diff
-├── [+] getOneDomainRuleRedirect.ts
-├── [+] getOneDomainRuleRedirect.test.ts
```

removed from codepath tree:
```diff
-├── [+] getOneDomainRuleRedirect (communicator)
-│   ├── input: PickOne<{ primary: { id, zone }; unique: { zone, slug } }>
-│   └── output: HasReadonly<typeof ...> | null
```

removed from test coverage tables:
```diff
-| getOneDomainRuleRedirect | cloudflare API call | integration |
-| getOneDomainRuleRedirect | rule found | rule absent | by primary vs unique |
```

removed from test tree:
```diff
-├── [+] getOneDomainRuleRedirect.test.ts
```

removed from exports:
```diff
-- `getOneDomainRuleRedirect`
```

updated research citation:
```diff
-| pattern.4: getOne operation | yes | getOneDomainRuleRedirect |
+| pattern.4: getOne operation | no | YAGNI — set uses getAll + filter |
```

---

## decision 2: play integration test

### the facts
- **not explicitly requested**: vision doesn't mention "journey test"
- **useful for verification**: helps understand end-to-end behavior
- **test coverage already has**: integration tests cover API calls
- **acceptance tests cover**: CLI workflow

### the decision
**delete play integration test from v1**

reasons:
1. integration tests cover individual operations
2. acceptance tests cover CLI workflow
3. play test overlaps both
4. reduces test surface area

### fixes applied

removed from filediff tree:
```diff
-└── [+] domainRuleRedirect.play.integration.test.ts
```

removed from test tree:
```diff
-└── [+] domainRuleRedirect.play.integration.test.ts  # integration: journey test
```

---

## updated blueprint summary

### components deleted
| component | reason | fix |
|-----------|--------|-----|
| getOneDomainRuleRedirect | not requested, not needed | removed from all sections |
| play integration test | redundant with other tests | removed from test tree |

### components that remain
all explicitly requested or required by declastruct pattern:
- entity, spec, presets: requested in wish
- getAll, set, del: declastruct pattern
- cast: API translation
- DAO: provider integration
- unit tests: domain object verification
- integration tests: API verification
- acceptance tests: CLI verification

---

## conclusion

r5 made decisive action and applied fixes:
- deleted getOneDomainRuleRedirect (6 locations updated)
- deleted play integration test (2 locations updated)

blueprint is now minimal for stated requirements.
